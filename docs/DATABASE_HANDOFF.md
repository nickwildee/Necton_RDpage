# 데이터베이스·운영 데이터 인계

이 프로젝트는 하나의 데이터베이스만 새로 만드는 구조가 아닙니다. Django 인증,
기존 BDM 분류 데이터, RD-2 수집 문서, 참조 이미지 파일이 서로 다른 소유 경계를
가집니다. 담당자와 접근 방법은 비밀값과 함께 안전한 별도 채널로 전달해야 합니다.

## 데이터 원본과 소유 경계

| 원본 | 사용 기능 | Git/Django가 생성·관리하는가 |
| --- | --- | --- |
| `USER` | 인증·역할·회사 정보 | Django 모델이 매핑하며 기존 운영 테이블을 보존해야 함 |
| `BDM_FEATURE_*` | 문서 특징 분류 | 기존 MariaDB 테이블을 읽고 수정하며 Django migration으로 만들지 않음 |
| `BDM_IMAGE_REFERENCE` | 참조 이미지 메타데이터 | 기존 MariaDB 테이블을 읽고 수정하며 파일은 별도 저장 |
| `documents` | RD-2 연구 문서 메타데이터 | 별도 수집기가 소유하며 Django는 읽기 전용으로 사용 |
| `BDM_IMAGE_ROOT` | 참조 이미지 실제 파일 | Git 밖의 웹 EC2 로컬 디스크 |
| `RESEARCH_DOCUMENT_ROOT` | 연구자료 실제 파일 | Git 밖의 RD-2 원본 자료 저장소 |

`FeatureGroup`, `FeatureType`, `FeatureValue`, `ImageReference`, `Document`는
운영 테이블과 호환하기 위한 `managed=False` 모델입니다. Django migration이 이
테이블을 생성하거나 운영 컬럼을 변경한다고 가정하지 않습니다.

## 필요한 테이블과 컬럼

아래는 애플리케이션이 직접 참조하는 최소 계약입니다. 실제 운영 스키마를 만들 때는
기존 DB DDL과 migration 기록을 원본으로 삼고, 이 표만 보고 테이블을 새로 만들지
않습니다.

### `USER`

| 컬럼 | 역할 |
| --- | --- |
| `user_id` | PK |
| `password` | Django 호환 비밀번호 해시 |
| `email` | 로그인 이메일, unique |
| `nickname`, `phone` | 프로필 정보 |
| `role` | `SUPER_ADMIN`, `ORG_ADMIN`, `ORG_USER`, `USER` 중 하나 |
| `company_id`, `company_name` | 회사 식별자와 표시 이름 |
| `status` | 현재 활성 사용자는 `A` |
| `created_date`, `update_date` | 생성·수정 시각 |

회원가입은 대소문자를 무시한 회사명으로 기존 `company_id`를 재사용합니다. 회사가
없으면 현재 최댓값 다음 번호를 사용하므로 동시 가입 정책은 별도 DB 설계가 필요합니다.

### BDM 분류 테이블

| 테이블 | 필요한 컬럼 |
| --- | --- |
| `BDM_FEATURE_GROUP` | `feature_group_id`, `feature`, `description` |
| `BDM_FEATURE_TYPE` | `feature_type_id`, `feature_group_id`, `feature`, `description`, `note`, `physical_type`, `semantic_role` |
| `BDM_FEATURE_VALUE` | `feature_value_id`, `feature_group_id`, `feature_type_id`, `feature_type`, `feature`, `description`, `c_weight`, `s_weight`, `o_weight` |
| `BDM_IMAGE_REFERENCE` | `image_id`, `company_id`, `user_id`, `feature_value_id`, `image_origin_name`, `image_name`, `image_path`, `use_yn`, `regist_date`, `update_date`, `description` |

Document Image 기능은 현재 `BDM_FEATURE_GROUP.feature_group_id = 3`인 대분류를
기준으로 동작합니다. 이 ID를 삭제하거나 다른 의미로 재사용하지 않습니다.

### `documents`

| 컬럼 | 역할 |
| --- | --- |
| `id` | PK |
| `cso_classification` | `O`, `S`, `C` 문서 유형 |
| `title` | 문서 제목 |
| `ordering_agency`, `department` | 주관 부처와 담당 부서 |
| `production_date` | 생산일 |
| `body_file_path` | 본문 파일의 상대경로 |
| `other_file_paths` | 기타 파일의 `|` 구분 상대경로 목록 |

## 신규 로컬 DB와 기존 MariaDB의 차이

| 상황 | 허용 절차 |
| --- | --- |
| 새 로컬 SQLite | `DB_ENGINE=sqlite python manage.py migrate` 실행 가능 |
| E2E 격리 DB | `python manage.py run_e2e_server --settings=config.e2e_settings` 사용 |
| 기존 운영 MariaDB | 백업·스키마·migration 기록을 대조하기 전 `migrate` 금지 |
| migration을 새로 적용해야 하는 MariaDB | DB 소유자의 승인과 복구 계획을 먼저 기록 |

기존 MariaDB에서 다음 명령으로 연결과 테이블 조회만 확인할 수 있습니다. 비밀번호는
명령행이나 로그에 넣지 않습니다.

```bash
cd backend
set -a
source .env
set +a

python manage.py showmigrations accounts
python manage.py shell -c "
from django.conf import settings
from accounts.models import FeatureGroup, FeatureType, FeatureValue, ImageReference, User
db = settings.DATABASES['default']
print('ENGINE:', db['ENGINE'])
print('HOST:', db.get('HOST'))
print('PORT:', db.get('PORT'))
print('NAME:', db.get('NAME'))
print('USER rows:', User.objects.count())
print('BDM rows:', {
    'groups': FeatureGroup.objects.count(),
    'types': FeatureType.objects.count(),
    'values': FeatureValue.objects.count(),
    'images': ImageReference.objects.count(),
})
"
```

DB 관리 권한이 있다면 migration 전후에 다음도 별도로 확인합니다.

```sql
SHOW TABLES;
SHOW FULL COLUMNS FROM USER;
SHOW FULL COLUMNS FROM BDM_FEATURE_GROUP;
SHOW FULL COLUMNS FROM BDM_FEATURE_TYPE;
SHOW FULL COLUMNS FROM BDM_FEATURE_VALUE;
SHOW FULL COLUMNS FROM BDM_IMAGE_REFERENCE;
SHOW FULL COLUMNS FROM documents;
```

## 파일 저장소 계약

### 참조 이미지

- `BDM_IMAGE_ROOT`는 Git 저장소 밖의 쓰기 가능한 디렉터리입니다.
- DB의 `image_path`와 API에는 저장 루트 기준 상대경로만 남습니다.
- 실제 저장 형태는 `{company_id}/{feature_value_id}/{연도}/{월}/{sha256}.{확장자}`입니다.
- 삭제는 DB 행과 파일을 지우지 않고 `use_yn = N`으로 비활성화합니다.
- 디스크 용량, 백업 주기, 보존 기간, 장애 복구 담당자를 인계 문서에 기록합니다.

### 연구자료

- `RESEARCH_DOCUMENT_ROOT`는 Django 프로세스가 읽을 수 있어야 합니다.
- `documents.body_file_path`와 `other_file_paths`에는 이 루트 기준 상대경로만 저장합니다.
- 실제 파일이 없는 레거시 문서는 목록에 보일 수 있지만 파일 API는 404를 반환합니다.
- 경로 이동, 절대경로, 심볼릭 링크를 통한 루트 밖 접근은 API가 거부합니다.
- 원본은 RD-2 수집기 또는 별도 저장소의 소유이며 웹 EC2에 무단 복사하지 않습니다.

## 인계 체크리스트

다음 값을 README나 GitHub PR에 적지 말고 비밀 관리 도구 또는 암호화된 채널로 전달합니다.

- [ ] DB 호스트·포트·DB명·접근 계정 담당자
- [ ] `USER`, `documents`, BDM 테이블의 DDL 또는 검증 가능한 원본 위치
- [ ] migration 기록과 마지막 백업 시각
- [ ] `BDM_IMAGE_ROOT` 경로·소유자·용량·백업·복구 담당자
- [ ] `RESEARCH_DOCUMENT_ROOT` 경로·읽기 권한·RD-2 동기화 상태
- [ ] `SUPER_ADMIN` 계정 발급 또는 역할 변경 담당자
- [ ] EC2 SSH와 보안 그룹 `7746` 인바운드 권한
- [ ] 운영 전환 시 HTTPS, WSGI 서버, 프로세스 자동 재시작, 중앙 로그 담당자

비밀번호, `DJANGO_SECRET_KEY`, SSH 키, 운영 이미지와 원본 연구자료를 저장소·ZIP·로그에
넣지 않습니다.
