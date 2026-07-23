import json
from functools import wraps

from django.contrib.auth import SESSION_KEY, update_session_auth_hash
from django.core.exceptions import NON_FIELD_ERRORS, RequestDataTooBig
from django.db import IntegrityError, OperationalError, transaction
from django.http import JsonResponse, UnreadablePostError
from django.middleware.csrf import get_token
from django.views.csrf import csrf_failure as default_csrf_failure
from django.views.decorators.csrf import ensure_csrf_cookie

from .forms import (
    LoginForm,
    NicknameForm,
    PasswordChangeForm,
    SignUpForm,
)
from .views import end_login_session, start_login_session

DATABASE_UNAVAILABLE_MESSAGE = (
    "데이터베이스 연결에 문제가 있습니다. 잠시 후 다시 시도해 주세요."
)


def _json_response(payload, *, status=200):
    response = JsonResponse(payload, status=status)
    response["Cache-Control"] = "no-store"
    return response


def _error_response(detail, *, status, errors=None):
    payload = {"detail": detail}
    if errors:
        payload["errors"] = errors
    return _json_response(payload, status=status)


def _database_unavailable_response():
    return _error_response(
        DATABASE_UNAVAILABLE_MESSAGE,
        status=503,
    )


def _api_methods(*allowed_methods):
    allowed = tuple(method.upper() for method in allowed_methods)

    def decorator(view_func):
        @wraps(view_func)
        def wrapped(request, *args, **kwargs):
            if request.method not in allowed:
                response = _error_response(
                    "허용되지 않은 요청 방식입니다.",
                    status=405,
                )
                response["Allow"] = ", ".join(allowed)
                return response
            return view_func(request, *args, **kwargs)

        return wrapped

    return decorator


def _authenticated_required(view_func):
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        try:
            user = request.user
            is_authenticated = user.is_authenticated
        except OperationalError:
            return _database_unavailable_response()

        if not is_authenticated:
            return _error_response("로그인이 필요합니다.", status=401)
        return view_func(request, *args, **kwargs)

    return wrapped


def _read_json_object(request):
    if request.content_type != "application/json":
        return None, _error_response(
            "Content-Type은 application/json이어야 합니다.",
            status=415,
        )

    try:
        raw_body = request.body
    except RequestDataTooBig:
        return None, _error_response(
            "요청 본문이 너무 큽니다.",
            status=413,
        )
    except UnreadablePostError:
        return None, _error_response(
            "요청 본문을 읽을 수 없습니다.",
            status=400,
        )

    if not raw_body:
        return {}, None

    try:
        payload = json.loads(raw_body)
    except (ValueError, RecursionError):
        return None, _error_response(
            "요청 본문이 올바른 JSON이 아닙니다.",
            status=400,
        )

    if not isinstance(payload, dict):
        return None, _error_response(
            "요청 본문은 JSON 객체여야 합니다.",
            status=400,
        )

    return payload, None


def _form_errors(form):
    serialized = {}
    for field, error_list in form.errors.as_data().items():
        key = "non_field_errors" if field == NON_FIELD_ERRORS else field
        serialized[key] = [
            message
            for error in error_list
            for message in error.messages
        ]
    return serialized


def _user_payload(user):
    return {
        "id": user.pk,
        "email": user.email,
        "nickname": user.nickname,
        "role": user.role,
    }


@_api_methods("GET")
@ensure_csrf_cookie
def csrf_token(request):
    return _json_response({"csrfToken": get_token(request)})


@_api_methods("POST")
def signup(request):
    payload, error_response = _read_json_object(request)
    if error_response:
        return error_response

    form = SignUpForm(payload)
    try:
        is_valid = form.is_valid()
    except OperationalError:
        return _database_unavailable_response()

    if not is_valid:
        return _error_response(
            "입력값을 확인해 주세요.",
            status=400,
            errors=_form_errors(form),
        )

    try:
        with transaction.atomic():
            user = form.save()
    except IntegrityError:
        return _error_response(
            "입력값을 확인해 주세요.",
            status=400,
            errors={"email": ["이미 가입된 이메일입니다."]},
        )
    except OperationalError:
        return _database_unavailable_response()

    return _json_response(
        {
            "detail": "회원가입이 완료되었습니다. 로그인해 주세요.",
            "user": _user_payload(user),
        },
        status=201,
    )


@_api_methods("POST")
def login(request):
    payload, error_response = _read_json_object(request)
    if error_response:
        return error_response

    form = LoginForm(payload, request=request)
    try:
        is_valid = form.is_valid()
    except OperationalError:
        return _database_unavailable_response()

    if not is_valid:
        errors = _form_errors(form)
        status = 401 if "non_field_errors" in errors else 400
        return _error_response(
            "로그인에 실패했습니다.",
            status=status,
            errors=errors,
        )

    user = form.get_user()
    start_login_session(request, user)
    return _json_response(
        {
            "authenticated": True,
            "user": _user_payload(user),
            "csrfToken": get_token(request),
        }
    )


@_api_methods("POST")
def logout(request):
    end_login_session(request)
    return _json_response(
        {
            "authenticated": False,
            "user": None,
            "csrfToken": get_token(request),
        }
    )


@_api_methods("GET")
def me(request):
    try:
        user = request.user
        is_authenticated = user.is_authenticated
    except OperationalError:
        return _database_unavailable_response()

    if not is_authenticated:
        if request.session.get(SESSION_KEY):
            request.session.flush()
        return _json_response(
            {"authenticated": False, "user": None}
        )

    return _json_response(
        {
            "authenticated": True,
            "user": _user_payload(user),
        }
    )


@_api_methods("PATCH")
@_authenticated_required
def profile(request):
    payload, error_response = _read_json_object(request)
    if error_response:
        return error_response

    form = NicknameForm(payload)
    if not form.is_valid():
        return _error_response(
            "입력값을 확인해 주세요.",
            status=400,
            errors=_form_errors(form),
        )

    user = request.user
    user.nickname = form.cleaned_data["nickname"]
    try:
        user.save(update_fields=["nickname", "update_date"])
    except OperationalError:
        return _database_unavailable_response()

    return _json_response(
        {
            "detail": "닉네임이 변경되었습니다.",
            "user": _user_payload(user),
        }
    )


@_api_methods("POST")
@_authenticated_required
def password(request):
    payload, error_response = _read_json_object(request)
    if error_response:
        return error_response

    user = request.user
    form = PasswordChangeForm(payload, user=user)
    if not form.is_valid():
        return _error_response(
            "입력값을 확인해 주세요.",
            status=400,
            errors=_form_errors(form),
        )

    user.set_password(form.cleaned_data["new_password"])
    try:
        user.save(update_fields=["password", "update_date"])
    except OperationalError:
        return _database_unavailable_response()

    update_session_auth_hash(request, user)
    return _json_response({"detail": "비밀번호가 변경되었습니다."})


def api_not_found(request, *args, **kwargs):
    return _error_response(
        "요청한 API를 찾을 수 없습니다.",
        status=404,
    )


def csrf_failure(request, reason=""):
    if request.path == "/api" or request.path.startswith("/api/"):
        return _error_response(
            "CSRF 검증에 실패했습니다.",
            status=403,
        )
    return default_csrf_failure(request, reason=reason)
