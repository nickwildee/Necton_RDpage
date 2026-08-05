import hashlib
import os
import tempfile
import warnings
from pathlib import Path

from PIL import Image, UnidentifiedImageError
from django.conf import settings
from django.core.exceptions import RequestDataTooBig
from django.core.paginator import Paginator
from django.db import transaction
from django.http import FileResponse, UnreadablePostError
from django.http.multipartparser import MultiPartParserError
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt, csrf_protect

from .api_views import (
    _api_methods,
    _error_response,
    _json_response,
    _read_json_object,
)
from .feature_api_views import (
    _database_errors,
    _query_id,
    _super_admin_required,
    _text_value,
    _validation_response,
)
from .models import (
    FeatureGroup,
    FeatureType,
    FeatureValue,
    ImageReference,
)

DEFAULT_IMAGE_PAGE_SIZE = 12
MAX_IMAGE_PAGE_SIZE = 50
ALLOWED_IMAGE_FORMATS = {
    ".jpg": ("JPEG", "jpg", "image/jpeg"),
    ".jpeg": ("JPEG", "jpg", "image/jpeg"),
    ".png": ("PNG", "png", "image/png"),
    ".gif": ("GIF", "gif", "image/gif"),
    ".webp": ("WEBP", "webp", "image/webp"),
}
IMAGE_CONTENT_TYPES = {
    suffix: metadata[2]
    for suffix, metadata in ALLOWED_IMAGE_FORMATS.items()
}


class ActiveDuplicateImage(Exception):
    pass


def _image_payload(image_reference):
    return {
        "id": image_reference.image_id,
        "valueId": image_reference.feature_value_id,
        "originName": image_reference.image_origin_name,
        "storedName": image_reference.image_name,
        "description": image_reference.description,
        "registeredAt": image_reference.regist_date.isoformat(),
        "updatedAt": image_reference.update_date.isoformat(),
        "fileUrl": reverse(
            "auth_api:image-reference-file",
            args=[image_reference.image_id],
        ),
    }


def _image_page_size(request):
    raw_value = request.GET.get(
        "pageSize",
        str(DEFAULT_IMAGE_PAGE_SIZE),
    )
    try:
        value = int(raw_value)
    except (TypeError, ValueError):
        return None, _validation_response(
            {"pageSize": ["페이지 표시 수는 정수여야 합니다."]}
        )

    if not 1 <= value <= MAX_IMAGE_PAGE_SIZE:
        return None, _validation_response(
            {
                "pageSize": [
                    "페이지 표시 수는 1 이상 50 이하여야 합니다."
                ]
            }
        )
    return value, None


def _storage_root():
    configured = getattr(settings, "BDM_IMAGE_ROOT", None)
    if not configured:
        return None, _error_response(
            "이미지 저장 경로가 설정되지 않았습니다.",
            status=503,
        )

    try:
        return Path(configured).expanduser().resolve(), None
    except OSError:
        return None, _error_response(
            "이미지 저장 경로를 사용할 수 없습니다.",
            status=503,
        )


def _safe_file_path(root, relative_path):
    relative = Path(relative_path)
    if relative.is_absolute() or ".." in relative.parts:
        return None

    try:
        target = (root / relative).resolve()
        target.relative_to(root)
    except (OSError, ValueError):
        return None
    return target


def _document_image_value(value_id, *, lock=False):
    values = FeatureValue.objects
    if lock:
        values = values.select_for_update()
    feature_value = values.filter(pk=value_id).first()
    if feature_value is None:
        return None, _error_response(
            "소분류를 찾을 수 없습니다.",
            status=404,
        )

    is_document_image = (
        feature_value.feature_group_id
        == FeatureGroup.DOCUMENT_IMAGE_ID
        and FeatureType.objects.filter(
            pk=feature_value.feature_type_id,
            feature_group_id=FeatureGroup.DOCUMENT_IMAGE_ID,
        ).exists()
    )
    if not is_document_image:
        return None, _error_response(
            "Document Image 소분류에만 이미지를 등록할 수 있습니다.",
            status=409,
        )
    return feature_value, None


def _multipart_data(request):
    if not (request.content_type or "").startswith("multipart/form-data"):
        return None, None, _error_response(
            "Content-Type은 multipart/form-data여야 합니다.",
            status=415,
        )

    try:
        return request.POST, request.FILES, None
    except RequestDataTooBig:
        return None, None, _error_response(
            "요청 본문이 너무 큽니다.",
            status=413,
        )
    except (MultiPartParserError, UnreadablePostError):
        return None, None, _error_response(
            "업로드 요청을 읽을 수 없습니다.",
            status=400,
        )


def _form_id(form_data, key, *, label):
    raw_value = form_data.get(key)
    try:
        value = int(raw_value)
    except (TypeError, ValueError):
        return None, f"{label}을(를) 선택해 주세요."
    if value < 1:
        return None, f"{label}을(를) 선택해 주세요."
    return value, None


def _original_name(uploaded_file):
    raw_name = str(uploaded_file.name or "").replace("\\", "/")
    name = os.path.basename(raw_name).strip()
    if not name:
        return None, "원본 파일명을 확인할 수 없습니다."
    if "\r" in name or "\n" in name:
        return None, "원본 파일명이 올바르지 않습니다."
    if len(name) > 255:
        return None, "원본 파일명은 255자 이하여야 합니다."
    if Path(name).suffix.lower() not in ALLOWED_IMAGE_FORMATS:
        return None, "JPEG, PNG, GIF, WebP 파일만 등록할 수 있습니다."
    return name, None


def _stage_upload(uploaded_file, root):
    root.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256()
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            dir=root,
            prefix=".upload-",
            delete=False,
        ) as staged:
            temp_path = Path(staged.name)
            for chunk in uploaded_file.chunks():
                digest.update(chunk)
                staged.write(chunk)
    except Exception:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)
        raise

    return temp_path, digest.hexdigest()


def _validate_staged_image(staged_path, origin_name):
    suffix = Path(origin_name).suffix.lower()
    expected_format, canonical_extension, _ = (
        ALLOWED_IMAGE_FORMATS[suffix]
    )

    try:
        with warnings.catch_warnings():
            warnings.simplefilter(
                "error",
                Image.DecompressionBombWarning,
            )
            with Image.open(staged_path) as image:
                detected_format = image.format
                is_animated = (
                    getattr(image, "is_animated", False)
                    or getattr(image, "n_frames", 1) > 1
                )
                image.verify()
    except (
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
        OSError,
        SyntaxError,
        UnidentifiedImageError,
    ):
        return None, "올바른 이미지 파일이 아닙니다."

    if detected_format != expected_format:
        return None, "파일 확장자와 실제 이미지 형식이 일치하지 않습니다."
    if is_animated:
        return None, "움직이는 GIF, APNG, WebP는 등록할 수 없습니다."

    return canonical_extension, None


def _persist_image(
    *,
    staged_path,
    digest,
    extension,
    origin_name,
    description,
    value_id,
    user,
    root,
):
    image_name = f"{digest}.{extension}"
    moved_target = None

    try:
        with transaction.atomic():
            feature_value, error_response = _document_image_value(
                value_id,
                lock=True,
            )
            if error_response:
                return None, None, error_response

            duplicate = ImageReference.objects.filter(
                feature_value_id=feature_value.pk,
                image_name=image_name,
            ).order_by("image_id").first()
            if duplicate and duplicate.use_yn == ImageReference.USE_ACTIVE:
                raise ActiveDuplicateImage

            if duplicate:
                target = _safe_file_path(root, duplicate.image_path)
                if target is None:
                    return None, None, _error_response(
                        "저장된 이미지 경로가 올바르지 않습니다.",
                        status=409,
                    )
                target.parent.mkdir(parents=True, exist_ok=True)
                os.replace(staged_path, target)

                duplicate.use_yn = ImageReference.USE_ACTIVE
                duplicate.description = description
                duplicate.save(
                    update_fields=(
                        "use_yn",
                        "description",
                        "update_date",
                    )
                )
                return duplicate, False, None

            registered_at = timezone.localtime()
            relative_path = Path(
                str(user.company_id),
                str(feature_value.pk),
                f"{registered_at:%Y}",
                f"{registered_at:%m}",
                image_name,
            )
            target = _safe_file_path(root, relative_path)
            if target is None:
                return None, None, _error_response(
                    "이미지 저장 경로를 만들 수 없습니다.",
                    status=503,
                )

            target.parent.mkdir(parents=True, exist_ok=True)
            os.replace(staged_path, target)
            moved_target = target
            image_reference = ImageReference.objects.create(
                company_id=user.company_id,
                user_id=user.pk,
                feature_value=feature_value,
                image_origin_name=origin_name,
                image_name=image_name,
                image_path=relative_path.as_posix(),
                use_yn=ImageReference.USE_ACTIVE,
                description=description,
            )
            return image_reference, True, None
    except Exception:
        if moved_target is not None:
            moved_target.unlink(missing_ok=True)
        raise


@csrf_protect
def _create_image_reference(request):
    form_data, files, error_response = _multipart_data(request)
    if error_response:
        return error_response

    value_id, value_error = _form_id(
        form_data,
        "valueId",
        label="소분류",
    )
    description, description_error = _text_value(
        form_data,
        "description",
        label="설명",
        max_length=255,
        required=True,
        partial=False,
    )
    uploaded_file = files.get("image")
    origin_name = None
    origin_error = None
    if uploaded_file is None:
        origin_error = "이미지 파일을 선택해 주세요."
    else:
        origin_name, origin_error = _original_name(uploaded_file)

    errors = {}
    if value_error:
        errors["valueId"] = [value_error]
    if description_error:
        errors["description"] = [description_error]
    if origin_error:
        errors["image"] = [origin_error]
    if errors:
        return _validation_response(errors)

    _, error_response = _document_image_value(value_id)
    if error_response:
        return error_response
    if request.user.company_id is None:
        return _error_response(
            "현재 사용자의 회사 정보를 확인할 수 없습니다.",
            status=409,
        )

    root, error_response = _storage_root()
    if error_response:
        return error_response

    staged_path = None
    try:
        staged_path, digest = _stage_upload(uploaded_file, root)
        extension, validation_error = _validate_staged_image(
            staged_path,
            origin_name,
        )
        if validation_error:
            return _validation_response({"image": [validation_error]})

        try:
            image_reference, created, error_response = _persist_image(
                staged_path=staged_path,
                digest=digest,
                extension=extension,
                origin_name=origin_name,
                description=description,
                value_id=value_id,
                user=request.user,
                root=root,
            )
        except ActiveDuplicateImage:
            return _error_response(
                "동일한 이미지가 이미 등록되어 있습니다.",
                status=409,
                errors={"image": ["이미 등록된 이미지입니다."]},
            )
        if error_response:
            return error_response
    except OSError:
        return _error_response(
            "이미지 파일을 저장할 수 없습니다.",
            status=503,
        )
    finally:
        if staged_path is not None:
            staged_path.unlink(missing_ok=True)

    return _json_response(
        {
            "item": _image_payload(image_reference),
            "reactivated": not created,
        },
        status=201 if created else 200,
    )


@csrf_exempt
@_api_methods("GET", "POST")
@_database_errors
@_super_admin_required
def image_references(request):
    if request.method == "POST":
        return _create_image_reference(request)

    value_id, error_response = _query_id(
        request,
        "valueId",
        label="소분류",
    )
    if error_response:
        return error_response
    page_size, error_response = _image_page_size(request)
    if error_response:
        return error_response
    raw_page = request.GET.get("page", "1")
    try:
        page = int(raw_page)
    except (TypeError, ValueError):
        return _validation_response(
            {"page": ["페이지 번호는 정수여야 합니다."]}
        )
    if page < 1:
        return _validation_response(
            {"page": ["페이지 번호는 1 이상이어야 합니다."]}
        )

    _, error_response = _document_image_value(value_id)
    if error_response:
        return error_response
    paginator = Paginator(
        ImageReference.objects.filter(
            feature_value_id=value_id,
            use_yn=ImageReference.USE_ACTIVE,
        ),
        page_size,
    )
    page_result = paginator.get_page(page)
    return _json_response(
        {
            "items": [
                _image_payload(image_reference)
                for image_reference in page_result.object_list
            ],
            "pagination": {
                "page": page_result.number,
                "pageSize": page_size,
                "totalItems": paginator.count,
                "totalPages": paginator.num_pages,
            },
        }
    )


@_api_methods("PATCH", "DELETE")
@_database_errors
@_super_admin_required
def image_reference_detail(request, image_id):
    image_reference = ImageReference.objects.filter(
        pk=image_id,
        use_yn=ImageReference.USE_ACTIVE,
    ).first()
    if image_reference is None:
        return _error_response(
            "이미지를 찾을 수 없습니다.",
            status=404,
        )

    if request.method == "DELETE":
        image_reference.use_yn = ImageReference.USE_INACTIVE
        image_reference.save(
            update_fields=("use_yn", "update_date")
        )
        return _json_response(
            {"detail": "이미지를 비활성화했습니다."}
        )

    payload, error_response = _read_json_object(request)
    if error_response:
        return error_response
    description, description_error = _text_value(
        payload,
        "description",
        label="설명",
        max_length=255,
        required=True,
        partial=False,
    )
    if description_error:
        return _validation_response(
            {"description": [description_error]}
        )

    image_reference.description = description
    image_reference.save(
        update_fields=("description", "update_date")
    )
    return _json_response({"item": _image_payload(image_reference)})


@_api_methods("GET")
@_database_errors
@_super_admin_required
def image_reference_file(request, image_id):
    image_reference = ImageReference.objects.filter(
        pk=image_id,
        use_yn=ImageReference.USE_ACTIVE,
    ).first()
    if image_reference is None:
        return _error_response(
            "이미지를 찾을 수 없습니다.",
            status=404,
        )

    root, error_response = _storage_root()
    if error_response:
        return error_response
    target = _safe_file_path(root, image_reference.image_path)
    if target is None or not target.is_file():
        return _error_response(
            "이미지 파일을 찾을 수 없습니다.",
            status=404,
        )

    suffix = Path(image_reference.image_name).suffix.lower()
    content_type = IMAGE_CONTENT_TYPES.get(
        suffix,
        "application/octet-stream",
    )
    try:
        response = FileResponse(
            target.open("rb"),
            content_type=content_type,
            filename=image_reference.image_origin_name,
        )
    except OSError:
        return _error_response(
            "이미지 파일을 읽을 수 없습니다.",
            status=503,
        )
    response["Cache-Control"] = "no-store"
    response["X-Content-Type-Options"] = "nosniff"
    return response
