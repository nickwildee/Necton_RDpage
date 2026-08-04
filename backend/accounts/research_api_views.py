import mimetypes
from functools import wraps
from pathlib import Path

from django.conf import settings
from django.core.paginator import Paginator
from django.db import DatabaseError
from django.db.models import Count, Q
from django.http import FileResponse
from django.urls import reverse

from .api_views import (
    _api_methods,
    _authenticated_required,
    _database_unavailable_response,
    _error_response,
    _json_response,
)
from .models import Document

DOCUMENT_PAGE_SIZE = 30
INLINE_FILE_SUFFIXES = {
    ".gif",
    ".jpeg",
    ".jpg",
    ".pdf",
    ".png",
    ".txt",
    ".webp",
}


def _database_errors(view_func):
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        try:
            return view_func(request, *args, **kwargs)
        except DatabaseError:
            return _database_unavailable_response()

    return wrapped


def _validation_response(errors):
    return _error_response(
        "입력값을 확인해 주세요.",
        status=400,
        errors=errors,
    )


def _page_number(request):
    raw_value = request.GET.get("page", "1")
    try:
        value = int(raw_value)
    except (TypeError, ValueError):
        return None, _validation_response(
            {"page": ["페이지 번호는 정수여야 합니다."]}
        )

    if value < 1:
        return None, _validation_response(
            {"page": ["페이지 번호는 1 이상이어야 합니다."]}
        )
    return value, None


def _category(request):
    value = (request.GET.get("category") or "").strip().upper()
    if value not in Document.CLASSIFICATIONS:
        return None, _validation_response(
            {"category": ["문서 유형은 O, S, C 중 하나여야 합니다."]}
        )
    return value, None


def _other_paths(document):
    return [
        value.strip()
        for value in (document.other_file_paths or "").split("|")
        if value.strip()
    ]


def _filename(relative_path):
    normalized = (relative_path or "").replace("\\", "/")
    return normalized.rsplit("/", 1)[-1].strip()


def _file_payload(name, url):
    if not name:
        return None
    return {"name": name, "url": url}


def _production_date(value):
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _document_payload(document):
    body_file = None
    if document.body_file_path:
        body_file = _file_payload(
            _filename(document.body_file_path),
            reverse(
                "auth_api:research-document-body-file",
                args=[document.id],
            ),
        )

    other_files = []
    for index, relative_path in enumerate(_other_paths(document)):
        payload = _file_payload(
            _filename(relative_path),
            reverse(
                "auth_api:research-document-other-file",
                args=[document.id, index],
            ),
        )
        if payload:
            other_files.append(payload)

    return {
        "id": document.id,
        "category": document.cso_classification,
        "title": document.title,
        "orderingAgency": document.ordering_agency,
        "department": document.department,
        "productionDate": _production_date(document.production_date),
        "bodyFile": body_file,
        "otherFiles": other_files,
    }


def _storage_root():
    configured = getattr(settings, "RESEARCH_DOCUMENT_ROOT", None)
    if not configured:
        return None, _error_response(
            "연구자료 저장 경로가 설정되지 않았습니다.",
            status=503,
        )

    try:
        return Path(configured).expanduser().resolve(), None
    except OSError:
        return None, _error_response(
            "연구자료 저장 경로를 사용할 수 없습니다.",
            status=503,
        )


def _safe_file_path(root, relative_path):
    if not relative_path or "\\" in relative_path:
        return None

    relative = Path(relative_path)
    if relative.is_absolute() or ".." in relative.parts:
        return None

    try:
        target = (root / relative).resolve()
        target.relative_to(root)
    except (OSError, ValueError):
        return None
    return target


def _document_file_response(relative_path):
    root, error_response = _storage_root()
    if error_response:
        return error_response

    target = _safe_file_path(root, relative_path)
    if target is None or not target.is_file():
        return _error_response(
            "자료 파일을 찾을 수 없습니다.",
            status=404,
        )

    filename = _filename(relative_path)
    content_type = (
        mimetypes.guess_type(filename)[0] or "application/octet-stream"
    )
    try:
        response = FileResponse(
            target.open("rb"),
            as_attachment=target.suffix.lower() not in INLINE_FILE_SUFFIXES,
            content_type=content_type,
            filename=filename,
        )
    except OSError:
        return _error_response(
            "자료 파일을 읽을 수 없습니다.",
            status=503,
        )
    response["Cache-Control"] = "private, no-store"
    response["X-Content-Type-Options"] = "nosniff"
    return response


def _file_document(document_id):
    return Document.objects.filter(
        pk=document_id,
        cso_classification__in=Document.CLASSIFICATIONS,
    ).first()


@_api_methods("GET")
@_database_errors
@_authenticated_required
def document_summary(request):
    counts = Document.objects.aggregate(
        open_count=Count(
            "id",
            filter=Q(
                cso_classification=Document.CLASSIFICATION_OPEN
            ),
        ),
        sensitive_count=Count(
            "id",
            filter=Q(
                cso_classification=Document.CLASSIFICATION_SENSITIVE
            ),
        ),
        confidential_count=Count(
            "id",
            filter=Q(
                cso_classification=Document.CLASSIFICATION_CONFIDENTIAL
            ),
        ),
    )
    category_counts = {
        "O": counts["open_count"],
        "S": counts["sensitive_count"],
        "C": counts["confidential_count"],
    }
    return _json_response(
        {
            "totalItems": sum(category_counts.values()),
            "counts": category_counts,
        }
    )


@_api_methods("GET")
@_database_errors
@_authenticated_required
def documents(request):
    category, error_response = _category(request)
    if error_response:
        return error_response
    page_number, error_response = _page_number(request)
    if error_response:
        return error_response

    queryset = Document.objects.filter(
        cso_classification=category
    ).order_by("-production_date", "-id")
    paginator = Paginator(queryset, DOCUMENT_PAGE_SIZE)
    page = paginator.get_page(page_number)
    return _json_response(
        {
            "items": [_document_payload(item) for item in page.object_list],
            "pagination": {
                "page": page.number,
                "pageSize": DOCUMENT_PAGE_SIZE,
                "totalItems": paginator.count,
                "totalPages": paginator.num_pages,
            },
        }
    )


@_api_methods("GET")
@_database_errors
@_authenticated_required
def document_body_file(request, document_id):
    document = _file_document(document_id)
    if document is None:
        return _error_response("문서를 찾을 수 없습니다.", status=404)
    if not document.body_file_path:
        return _error_response("본문 자료가 없습니다.", status=404)
    return _document_file_response(document.body_file_path)


@_api_methods("GET")
@_database_errors
@_authenticated_required
def document_other_file(request, document_id, file_index):
    document = _file_document(document_id)
    if document is None:
        return _error_response("문서를 찾을 수 없습니다.", status=404)

    paths = _other_paths(document)
    if file_index >= len(paths):
        return _error_response("기타 자료가 없습니다.", status=404)
    return _document_file_response(paths[file_index])
