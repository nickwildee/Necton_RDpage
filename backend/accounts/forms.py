from django import forms
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.db.models import Max

from .models import User


class LoginForm(forms.Form):
    email = forms.EmailField(label="이메일", max_length=255)
    password = forms.CharField(
        label="비밀번호",
        strip=False,
        widget=forms.PasswordInput,
    )

    def clean_email(self):
        return self.cleaned_data["email"].strip().lower()

    def clean(self):
        cleaned_data = super().clean()
        email = cleaned_data.get("email")
        password = cleaned_data.get("password")

        if email and password:
            self.user_cache = authenticate(
                self.request,
                email=email,
                password=password,
            )
            if self.user_cache is None:
                raise ValidationError(
                    "이메일 또는 비밀번호가 올바르지 않습니다."
                )

        return cleaned_data

    def __init__(self, *args, request=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.request = request
        self.user_cache = None

    def get_user(self):
        return self.user_cache


class SignUpForm(forms.ModelForm):
    password = forms.CharField(
        label="비밀번호",
        min_length=8,
        max_length=255,
        strip=False,
        widget=forms.PasswordInput,
        error_messages={
            "min_length": "비밀번호는 8자 이상 입력해 주세요.",
        },
    )
    password_confirm = forms.CharField(
        label="비밀번호 확인",
        min_length=8,
        max_length=255,
        strip=False,
        widget=forms.PasswordInput,
        error_messages={
            "min_length": "비밀번호는 8자 이상 입력해 주세요.",
        },
    )
    phone = forms.RegexField(
        label="핸드폰 번호",
        regex=r"^[0-9]{11}$",
        required=False,
        max_length=11,
        error_messages={
            "invalid": "핸드폰 번호는 숫자 11자리로 입력해 주세요.",
        },
    )
    company = forms.CharField(label="회사명", max_length=255)

    class Meta:
        model = User
        fields = ("email", "password", "nickname", "phone", "company")

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise ValidationError("이미 가입된 이메일입니다.")
        return email

    def clean_phone(self):
        return self.cleaned_data["phone"] or None

    def clean_company(self):
        return self.cleaned_data["company"].strip()

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        password_confirm = cleaned_data.get("password_confirm")

        if password and password_confirm and password != password_confirm:
            self.add_error(
                "password_confirm",
                "비밀번호가 일치하지 않습니다.",
            )

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])
        company_name = self.cleaned_data["company"]
        company_id = (
            User.objects.filter(company_name__iexact=company_name)
            .order_by("company_id")
            .values_list("company_id", flat=True)
            .first()
        )
        if company_id is None:
            maximum = User.objects.aggregate(Max("company_id"))["company_id__max"]
            company_id = (maximum or 0) + 1
        user.company_id = company_id
        user.company_name = company_name
        if commit:
            user.save()
        return user
