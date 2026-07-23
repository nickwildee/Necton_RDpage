from functools import wraps

from django.core.paginator import Paginator
from django.db import IntegrityError, OperationalError, transaction

from .api_views import (
    _api_methods,
    _database_unavailable_response,
    _error_response,
    _json_response,
    _read_json_object,
)
from .models import FeatureGroup, FeatureType, FeatureValue, User

FEATURE_VALUE_PAGE_SIZE = 8
MISSING = object()


def _database_errors(view_func):
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        try:
            return view_func(request, *args, **kwargs)
        except OperationalError:
            return _database_unavailable_response()
        except IntegrityError:
            return _error_response(
                "데이터 제약조건을 확인해 주세요.",
                status=409,
            )

    return wrapped


def _super_admin_required(view_func):
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        user = request.user
        if not user.is_authenticated:
            return _error_response("로그인이 필요합니다.", status=401)
        if user.role != User.ROLE_SUPER_ADMIN:
            return _error_response(
                "SUPER_ADMIN 권한이 필요합니다.",
                status=403,
            )
        return view_func(request, *args, **kwargs)

    return wrapped


def _validation_response(errors):
    return _error_response(
        "입력값을 확인해 주세요.",
        status=400,
        errors=errors,
    )


def _text_value(
    payload,
    key,
    *,
    label,
    max_length,
    required,
    partial,
):
    if key not in payload:
        if partial:
            return MISSING, None
        if required:
            return MISSING, f"{label}을(를) 입력해 주세요."
        return None, None

    value = payload[key]
    if not isinstance(value, str):
        return MISSING, f"{label}은(는) 문자열이어야 합니다."

    value = value.strip()
    if not value:
        if required:
            return MISSING, f"{label}을(를) 입력해 주세요."
        return None, None

    if len(value) > max_length:
        return (
            MISSING,
            f"{label}은(는) {max_length}자 이하여야 합니다.",
        )

    return value, None


def _id_value(payload, key, *, label):
    value = payload.get(key)
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        return None, f"{label}을(를) 선택해 주세요."
    return value, None


def _weight_value(payload, key, *, label, partial):
    if key not in payload:
        return (MISSING, None) if partial else (None, None)

    value = payload[key]
    if value is None:
        return None, None
    if isinstance(value, bool) or not isinstance(value, int):
        return MISSING, f"{label}은(는) 정수여야 합니다."
    if not -128 <= value <= 127:
        return MISSING, f"{label}은(는) -128에서 127 사이여야 합니다."
    return value, None


def _query_id(request, key, *, label):
    raw_value = request.GET.get(key)
    try:
        value = int(raw_value)
    except (TypeError, ValueError):
        return None, _validation_response(
            {key: [f"{label}을(를) 선택해 주세요."]}
        )

    if value < 1:
        return None, _validation_response(
            {key: [f"{label}을(를) 선택해 주세요."]}
        )
    return value, None


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


def _group_payload(group):
    return {
        "id": group.feature_group_id,
        "feature": group.feature,
        "description": group.description,
    }


def _type_payload(feature_type):
    return {
        "id": feature_type.feature_type_id,
        "groupId": feature_type.feature_group_id,
        "feature": feature_type.feature,
        "description": feature_type.description,
        "note": feature_type.note,
    }


def _value_payload(feature_value):
    return {
        "id": feature_value.feature_value_id,
        "groupId": feature_value.feature_group_id,
        "typeId": feature_value.feature_type_id,
        "featureType": feature_value.feature_type_name,
        "feature": feature_value.feature,
        "description": feature_value.description,
        "cWeight": feature_value.c_weight,
        "sWeight": feature_value.s_weight,
        "oWeight": feature_value.o_weight,
    }


def _group_values(payload, *, partial):
    values = {}
    errors = {}
    fields = (
        ("feature", "대분류 이름", 100, True),
        ("description", "대분류 설명", 500, True),
    )
    for key, label, max_length, required in fields:
        value, error = _text_value(
            payload,
            key,
            label=label,
            max_length=max_length,
            required=required,
            partial=partial,
        )
        if error:
            errors.setdefault(key, []).append(error)
        elif value is not MISSING:
            values[key] = value
    return values, errors


def _type_values(payload, *, partial):
    values = {}
    errors = {}
    fields = (
        ("feature", "중분류 이름", 255, True),
        ("description", "중분류 설명", 255, True),
        ("note", "메모", 100, False),
    )
    for key, label, max_length, required in fields:
        value, error = _text_value(
            payload,
            key,
            label=label,
            max_length=max_length,
            required=required,
            partial=partial,
        )
        if error:
            errors.setdefault(key, []).append(error)
        elif value is not MISSING:
            values[key] = value
    return values, errors


def _value_values(payload, *, partial):
    values = {}
    errors = {}
    text_fields = (
        ("feature", "소분류 이름", 255, True),
        ("description", "소분류 설명", 255, False),
    )
    for key, label, max_length, required in text_fields:
        value, error = _text_value(
            payload,
            key,
            label=label,
            max_length=max_length,
            required=required,
            partial=partial,
        )
        if error:
            errors.setdefault(key, []).append(error)
        elif value is not MISSING:
            values[key] = value

    weight_fields = (
        ("cWeight", "C 가중치", "c_weight"),
        ("sWeight", "S 가중치", "s_weight"),
        ("oWeight", "O 가중치", "o_weight"),
    )
    for key, label, model_field in weight_fields:
        value, error = _weight_value(
            payload,
            key,
            label=label,
            partial=partial,
        )
        if error:
            errors.setdefault(key, []).append(error)
        elif value is not MISSING:
            values[model_field] = value
    return values, errors


@_api_methods("GET", "POST")
@_database_errors
@_super_admin_required
def feature_groups(request):
    if request.method == "GET":
        groups = FeatureGroup.objects.all()
        return _json_response(
            {"items": [_group_payload(group) for group in groups]}
        )

    payload, error_response = _read_json_object(request)
    if error_response:
        return error_response

    values, errors = _group_values(payload, partial=False)
    if errors:
        return _validation_response(errors)

    group = FeatureGroup.objects.create(**values)
    return _json_response({"item": _group_payload(group)}, status=201)


@_api_methods("PATCH", "DELETE")
@_database_errors
@_super_admin_required
def feature_group_detail(request, group_id):
    group = FeatureGroup.objects.filter(pk=group_id).first()
    if group is None:
        return _error_response("대분류를 찾을 수 없습니다.", status=404)

    if request.method == "DELETE":
        has_children = (
            FeatureType.objects.filter(feature_group_id=group_id).exists()
            or FeatureValue.objects.filter(
                feature_group_id=group_id
            ).exists()
        )
        if has_children:
            return _error_response(
                "하위 분류가 있는 대분류는 삭제할 수 없습니다.",
                status=409,
            )
        group.delete()
        return _json_response({"detail": "대분류를 삭제했습니다."})

    payload, error_response = _read_json_object(request)
    if error_response:
        return error_response

    values, errors = _group_values(payload, partial=True)
    if errors:
        return _validation_response(errors)
    if not values:
        return _validation_response(
            {"non_field_errors": ["수정할 값을 입력해 주세요."]}
        )

    for field, value in values.items():
        setattr(group, field, value)
    group.save(update_fields=tuple(values))
    return _json_response({"item": _group_payload(group)})


@_api_methods("GET", "POST")
@_database_errors
@_super_admin_required
def feature_types(request):
    if request.method == "GET":
        group_id, error_response = _query_id(
            request,
            "groupId",
            label="대분류",
        )
        if error_response:
            return error_response
        if not FeatureGroup.objects.filter(pk=group_id).exists():
            return _error_response(
                "대분류를 찾을 수 없습니다.",
                status=404,
            )

        types = FeatureType.objects.filter(feature_group_id=group_id)
        return _json_response(
            {
                "items": [
                    _type_payload(feature_type)
                    for feature_type in types
                ]
            }
        )

    payload, error_response = _read_json_object(request)
    if error_response:
        return error_response

    group_id, group_error = _id_value(
        payload,
        "groupId",
        label="대분류",
    )
    values, errors = _type_values(payload, partial=False)
    if group_error:
        errors.setdefault("groupId", []).append(group_error)
    if errors:
        return _validation_response(errors)

    group = FeatureGroup.objects.filter(pk=group_id).first()
    if group is None:
        return _error_response("대분류를 찾을 수 없습니다.", status=404)

    feature_type = FeatureType.objects.create(
        feature_group=group,
        **values,
    )
    return _json_response(
        {"item": _type_payload(feature_type)},
        status=201,
    )


@_api_methods("PATCH", "DELETE")
@_database_errors
@_super_admin_required
def feature_type_detail(request, type_id):
    feature_type = FeatureType.objects.filter(pk=type_id).first()
    if feature_type is None:
        return _error_response("중분류를 찾을 수 없습니다.", status=404)

    if request.method == "DELETE":
        if FeatureValue.objects.filter(feature_type_id=type_id).exists():
            return _error_response(
                "소분류가 있는 중분류는 삭제할 수 없습니다.",
                status=409,
            )
        feature_type.delete()
        return _json_response({"detail": "중분류를 삭제했습니다."})

    payload, error_response = _read_json_object(request)
    if error_response:
        return error_response

    values, errors = _type_values(payload, partial=True)
    if errors:
        return _validation_response(errors)
    if not values:
        return _validation_response(
            {"non_field_errors": ["수정할 값을 입력해 주세요."]}
        )

    with transaction.atomic():
        for field, value in values.items():
            setattr(feature_type, field, value)
        feature_type.save(update_fields=tuple(values))
        if "feature" in values:
            FeatureValue.objects.filter(
                feature_type_id=type_id
            ).update(feature_type_name=values["feature"])

    return _json_response({"item": _type_payload(feature_type)})


@_api_methods("GET", "POST")
@_database_errors
@_super_admin_required
def feature_values(request):
    if request.method == "GET":
        type_id, error_response = _query_id(
            request,
            "typeId",
            label="중분류",
        )
        if error_response:
            return error_response
        page, error_response = _page_number(request)
        if error_response:
            return error_response
        if not FeatureType.objects.filter(pk=type_id).exists():
            return _error_response(
                "중분류를 찾을 수 없습니다.",
                status=404,
            )

        paginator = Paginator(
            FeatureValue.objects.filter(feature_type_id=type_id),
            FEATURE_VALUE_PAGE_SIZE,
        )
        page_result = paginator.get_page(page)
        return _json_response(
            {
                "items": [
                    _value_payload(feature_value)
                    for feature_value in page_result.object_list
                ],
                "pagination": {
                    "page": page_result.number,
                    "pageSize": FEATURE_VALUE_PAGE_SIZE,
                    "totalItems": paginator.count,
                    "totalPages": paginator.num_pages,
                },
            }
        )

    payload, error_response = _read_json_object(request)
    if error_response:
        return error_response

    type_id, type_error = _id_value(
        payload,
        "typeId",
        label="중분류",
    )
    values, errors = _value_values(payload, partial=False)
    if type_error:
        errors.setdefault("typeId", []).append(type_error)
    if errors:
        return _validation_response(errors)

    feature_type = FeatureType.objects.filter(pk=type_id).first()
    if feature_type is None:
        return _error_response("중분류를 찾을 수 없습니다.", status=404)
    if feature_type.feature_group_id is None:
        return _error_response(
            "중분류에 연결된 대분류가 없습니다.",
            status=409,
        )
    group = FeatureGroup.objects.filter(
        pk=feature_type.feature_group_id
    ).first()
    if group is None:
        return _error_response(
            "중분류에 연결된 대분류를 찾을 수 없습니다.",
            status=409,
        )

    feature_value = FeatureValue.objects.create(
        feature_group=group,
        feature_type=feature_type,
        feature_type_name=feature_type.feature,
        **values,
    )
    return _json_response(
        {"item": _value_payload(feature_value)},
        status=201,
    )


@_api_methods("PATCH", "DELETE")
@_database_errors
@_super_admin_required
def feature_value_detail(request, value_id):
    feature_value = FeatureValue.objects.filter(pk=value_id).first()
    if feature_value is None:
        return _error_response("소분류를 찾을 수 없습니다.", status=404)

    if request.method == "DELETE":
        feature_value.delete()
        return _json_response({"detail": "소분류를 삭제했습니다."})

    payload, error_response = _read_json_object(request)
    if error_response:
        return error_response

    values, errors = _value_values(payload, partial=True)
    if errors:
        return _validation_response(errors)
    if not values:
        return _validation_response(
            {"non_field_errors": ["수정할 값을 입력해 주세요."]}
        )

    for field, value in values.items():
        setattr(feature_value, field, value)
    feature_value.save(update_fields=tuple(values))
    return _json_response({"item": _value_payload(feature_value)})
