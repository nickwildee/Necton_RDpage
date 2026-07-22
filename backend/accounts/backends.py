from .models import User


class EmailBackend:
    """USER 테이블의 이메일과 해시 비밀번호로 인증한다."""

    def authenticate(self, request, email=None, password=None, **kwargs):
        if not email or not password:
            return None

        try:
            user = User.objects.get(email__iexact=email.strip())
        except User.DoesNotExist:
            # 존재하는 계정의 비밀번호 검사와 비슷한 비용을 사용해
            # 이메일 존재 여부가 응답 시간으로 드러나는 것을 줄인다.
            User().set_password(password)
            return None

        password_matches = user.check_password(password)
        if user.status == User.STATUS_ACTIVE and password_matches:
            return user

        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(
                pk=user_id,
                status=User.STATUS_ACTIVE,
            )
        except User.DoesNotExist:
            return None
