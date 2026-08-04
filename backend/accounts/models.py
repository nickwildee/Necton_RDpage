from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db import models
from django.utils.crypto import salted_hmac


class User(models.Model):
    """회원 테이블 스키마에 대응하는 사용자 모델."""

    ROLE_USER = "USER"
    ROLE_ORG_USER = "ORG_USER"
    ROLE_ORG_ADMIN = "ORG_ADMIN"
    ROLE_SUPER_ADMIN = "SUPER_ADMIN"
    STATUS_ACTIVE = "A"

    user_id = models.AutoField(primary_key=True)
    password = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, unique=True)
    nickname = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=11, default=ROLE_USER)
    company_id = models.IntegerField()
    company_name = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=1, default=STATUS_ACTIVE)
    created_date = models.DateTimeField(auto_now_add=True)
    update_date = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "USER"

    def __str__(self):
        return self.email

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def get_session_auth_hash(self):
        return self._get_session_auth_hash()

    def get_session_auth_fallback_hash(self):
        for fallback_secret in settings.SECRET_KEY_FALLBACKS:
            yield self._get_session_auth_hash(secret=fallback_secret)

    def _get_session_auth_hash(self, secret=None):
        return salted_hmac(
            "django.contrib.auth.models.AbstractBaseUser.get_session_auth_hash",
            self.password,
            secret=secret,
            algorithm="sha256",
        ).hexdigest()


class FeatureGroup(models.Model):
    """기존 BDM_FEATURE_GROUP 대분류 테이블 매핑."""

    DOCUMENT_IMAGE_ID = 3

    feature_group_id = models.AutoField(primary_key=True)
    feature = models.CharField(max_length=100)
    description = models.CharField(max_length=500)

    class Meta:
        managed = False
        db_table = "BDM_FEATURE_GROUP"
        ordering = ("feature_group_id",)


class FeatureType(models.Model):
    """기존 BDM_FEATURE_TYPE 중분류 테이블 매핑."""

    feature_group = models.ForeignKey(
        FeatureGroup,
        db_column="feature_group_id",
        db_constraint=False,
        null=True,
        on_delete=models.DO_NOTHING,
        related_name="feature_types",
    )
    feature_type_id = models.AutoField(primary_key=True)
    feature = models.CharField(max_length=255)
    description = models.CharField(max_length=255)
    note = models.CharField(max_length=100, blank=True, null=True)
    physical_type = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )
    semantic_role = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    class Meta:
        managed = False
        db_table = "BDM_FEATURE_TYPE"
        ordering = ("feature_type_id",)


class FeatureValue(models.Model):
    """기존 BDM_FEATURE_VALUE 소분류 테이블 매핑."""

    feature_group = models.ForeignKey(
        FeatureGroup,
        db_column="feature_group_id",
        db_constraint=False,
        null=True,
        on_delete=models.DO_NOTHING,
        related_name="feature_values",
    )
    feature_type = models.ForeignKey(
        FeatureType,
        db_column="feature_type_id",
        db_constraint=False,
        null=True,
        on_delete=models.DO_NOTHING,
        related_name="feature_values",
    )
    feature_value_id = models.AutoField(primary_key=True)
    feature_type_name = models.CharField(
        db_column="feature_type",
        max_length=255,
    )
    feature = models.CharField(max_length=255)
    description = models.CharField(max_length=255, blank=True, null=True)
    c_weight = models.SmallIntegerField(blank=True, null=True)
    s_weight = models.SmallIntegerField(blank=True, null=True)
    o_weight = models.SmallIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "BDM_FEATURE_VALUE"
        ordering = ("feature_value_id",)


class ImageReference(models.Model):
    """기존 BDM_IMAGE_REFERENCE 이미지 참조 테이블 매핑."""

    USE_ACTIVE = "Y"
    USE_INACTIVE = "N"

    company_id = models.IntegerField()
    user_id = models.IntegerField()
    feature_value = models.ForeignKey(
        FeatureValue,
        db_column="feature_value_id",
        db_constraint=False,
        on_delete=models.DO_NOTHING,
        related_name="image_references",
    )
    image_id = models.AutoField(primary_key=True)
    image_origin_name = models.CharField(max_length=255)
    image_name = models.CharField(max_length=255)
    image_path = models.CharField(max_length=255)
    use_yn = models.CharField(max_length=1, default=USE_ACTIVE)
    regist_date = models.DateTimeField(auto_now_add=True)
    update_date = models.DateTimeField(auto_now=True)
    description = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = "BDM_IMAGE_REFERENCE"
        ordering = ("-regist_date", "-image_id")


class Document(models.Model):
    """RD-2 수집기의 기존 documents 테이블 매핑."""

    CLASSIFICATION_OPEN = "O"
    CLASSIFICATION_SENSITIVE = "S"
    CLASSIFICATION_CONFIDENTIAL = "C"
    CLASSIFICATIONS = (
        CLASSIFICATION_OPEN,
        CLASSIFICATION_SENSITIVE,
        CLASSIFICATION_CONFIDENTIAL,
    )

    id = models.AutoField(primary_key=True)
    cso_classification = models.CharField(max_length=16)
    title = models.CharField(max_length=255, blank=True, null=True)
    ordering_agency = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )
    department = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )
    production_date = models.DateField(blank=True, null=True)
    body_file_path = models.TextField(blank=True, null=True)
    other_file_paths = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "documents"
        ordering = ("-production_date", "-id")
