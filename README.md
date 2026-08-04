# Necton RD Page

Necton RD Page는 문서의 내용과 특징을 분석해 어떤 조항에 해당하는지 분류하는
모델을 제공하는 서비스입니다. 이 저장소는 모델을 이용하기 위한 사용자 인증,
문서 특징 관리, React 웹 화면과 Django API를 관리합니다.

## 현재 기준

- 최신 릴리스는 `v0.1.3`입니다.
- `develop`에는 디자인 시스템 공통화, 설정 화면 반응형 개선, 분류 선택 UX 수정,
  Playwright 인증 E2E 테스트와 Document Image 참조 이미지 관리가 후속 반영되어
  있습니다.
- GitHub Actions CI는 아직 도입 전이므로 PR 전 검증 명령은 로컬에서 실행합니다.

## 후임자 빠른 시작

처음 저장소를 넘겨받았다면 다음 순서로 확인합니다.

1. `git status`, `git log --oneline -10`, [열린 PR](https://github.com/nickwildee/Necton_RDpage/pulls),
   [Discussions](https://github.com/nickwildee/Necton_RDpage/discussions)를 확인합니다.
2. 이 문서와 [기여 가이드](CONTRIBUTING.md), [아키텍처](docs/ARCHITECTURE.md)를
   읽고, 작업 디렉터리의 `AGENTS.md`를 확인합니다.
3. 일반 작업은 최신 `develop`에서 새 브랜치를 만들고 다시 `develop`으로 PR을
   보냅니다. `develop`과 `main`에는 직접 커밋하지 않습니다.
4. 인증만 로컬에서 확인할 때는 SQLite를 사용하고, 실제 설정 화면을 확인할 때는
   기존 MariaDB 스키마를 연결합니다.
5. 백엔드를 먼저 `127.0.0.1:8000`에 실행한 뒤 프론트엔드를 실행합니다. 브라우저의
   `/api/` 요청은 Vite가 Django로 프록시합니다.
6. 변경 후에는 아래 [검증 기준](#검증-기준)을 실제로 실행한 결과만 PR에 기록합니다.
7. EC2 데모를 갱신할 때는 [EC2 데모 실행](#ec2-데모-실행)을 따릅니다. `git pull` 뒤에는
   `./scripts/shutdown.sh`, `./scripts/startup.sh`로 서비스를 직접 재시작합니다.

### 현재 구현 범위

| 영역 | 구현 상태 |
| --- | --- |
| 인증 | Django 세션 쿠키와 CSRF 기반 회원가입·로그인·로그아웃·현재 사용자 조회 |
| 마이페이지 | 이메일·역할 표시, 닉네임 변경, 현재 비밀번호 확인 후 비밀번호 변경 |
| 역할 | `SUPER_ADMIN`만 설정 메뉴와 문서 특징 관리 API 사용 가능 |
| 문서 특징 | 대·중·소분류 조회·추가·수정·삭제와 소분류 페이지네이션 |
| Document Image | 중분류 메타데이터와 소분류별 참조 이미지 등록·조회·설명 수정·비활성화 |
| 프론트엔드 | React Router, FSD 계층, Tailwind 디자인 토큰, 데스크톱·태블릿·모바일 화면 |
| 자동 검증 | Django 테스트, 프론트 lint/build, Chromium Playwright E2E |

`연구 데이터`, `분석 리포트` 네비게이션은 현재 화면이 없는 자리표시자입니다. 모델
추론과 문서 분석 파이프라인도 이 저장소의 현재 구현 범위에는 포함되지 않습니다.

### 인수인계 시 반드시 알아둘 경계

- Django는 `.env`를 자동으로 읽지 않습니다. MariaDB를 사용할 때는 실행 프로세스에
  환경변수가 실제로 전달됐는지 확인합니다.
- 기존 MariaDB의 `USER`, `BDM_FEATURE_*`, `BDM_IMAGE_REFERENCE`가 데이터 원본입니다.
  BDM 모델은 `managed=False`이므로 Django 마이그레이션이 테이블을 만들거나 고치지
  않습니다.
- 기존 MariaDB에서 `python manage.py migrate`를 바로 실행하지 않습니다. 먼저 백업과
  `python manage.py showmigrations accounts` 결과를 확인하고, 실제 테이블과 migration
  기록을 대조한 뒤 적용 여부를 결정합니다.
- 참조 이미지는 회사별 비공개 데이터가 아니라 `SUPER_ADMIN`이 관리하는 전역 데이터입니다.
  `company_id`와 `user_id`는 접근 범위가 아닌 최초 등록자 이력입니다.
- `Document Image` 전용 기능은 현재 대분류 PK `3`을 기준으로 동작합니다. 운영 데이터에서
  이 ID를 삭제하거나 다른 의미로 재사용하지 말고, 장기적으로 고정 ID를 유지할지 별도
  도메인 코드로 바꿀지 결정해야 합니다.
- 이미지 파일은 `BDM_IMAGE_ROOT` 아래의 EC2 로컬 디스크에 저장됩니다. 저장 용량,
  백업, 보존 기간과 장애 복구 정책은 아직 정해지지 않았습니다.
- 인증 세션은 서버 테이블이 아닌 서명 쿠키에 저장됩니다. 데모에는 별도 세션 테이블이
  필요 없지만, 복사된 쿠키를 로그아웃만으로 서버에서 강제 폐기할 수 없으므로 운영 전에는
  DB/cache 세션 또는 별도 폐기 전략을 결정해야 합니다.
- 현재 배포는 Django와 Vite 개발 서버를 `nohup`과 `setsid`로 실행하는 데모입니다.
  실행·종료 스크립트는 제공하지만 재부팅 후 자동 시작, HTTPS, 운영 WSGI 서버와 중앙
  로그 수집은 제공하지 않습니다.
- 주요 미해결 정책은 [v0.1.3 미해결 안건](https://github.com/nickwildee/Necton_RDpage/discussions/21),
  코드 개선 후보는 [코드 품질 감사](https://github.com/nickwildee/Necton_RDpage/discussions/36),
  CI 기준은 [Playwright E2E 및 CI](https://github.com/nickwildee/Necton_RDpage/discussions/26),
  현재 이미지 설계의 근거는 [Document Image 관리 설계](https://github.com/nickwildee/Necton_RDpage/discussions/37)에
  기록돼 있습니다.

## 구조

- `backend/`: Django 인증 서버. React 전환이 끝날 때까지 기존 템플릿도 유지합니다.
- `frontend/`: React, Vite, TypeScript, Tailwind CSS 기반 웹 화면입니다.
- `scripts/`: EC2 데모 백엔드·프론트엔드 실행과 종료 스크립트입니다.

두 프로젝트의 의존성, 환경변수, 실행 명령은 서로 섞지 않습니다.

## 문서

- [기여 가이드](CONTRIBUTING.md): Git Flow, 브랜치, 검증, PR 작성 기준
- [아키텍처](docs/ARCHITECTURE.md): 인증 흐름, FSD 계층, DB와 배포 구조
- [디자인 시스템](DESIGN.md): Tailwind 토큰, 타이포그래피, 공통 UI 기준
- [에이전트 작업 규칙](AGENTS.md): 작업 에이전트가 따라야 하는 저장소 규칙
- FSD 세부 규칙: [entities](frontend/src/entities/README.md),
  [features](frontend/src/features/README.md), [widgets](frontend/src/widgets/README.md),
  [shared API](frontend/src/shared/api/README.md), [shared config](frontend/src/shared/config/README.md),
  [shared lib](frontend/src/shared/lib/README.md), [shared UI](frontend/src/shared/ui/README.md)

## 실행 요구사항 (Requirements)

| 구분 | 요구사항 | 비고 |
| --- | --- | --- |
| 서버 환경 | Ubuntu 기반 EC2 | 아래 EC2 명령은 Ubuntu와 `ubuntu` 사용자를 기준으로 합니다. |
| 소스 관리 | Git과 저장소 접근 권한 | 일반 작업과 데모 배포는 `develop`을 사용합니다. |
| 백엔드 런타임 | Conda, Python 3.12 | 환경 이름은 `necton_auth`이며 `backend/environment.yml`로 생성합니다. |
| 백엔드 패키지 | Django 6.0.7, Pillow 12.3.0, mysqlclient 2.2.8 | 버전은 `backend/environment.yml`에 고정되어 있습니다. |
| 프론트엔드 런타임 | Node.js 24, npm | 패키지는 `frontend/package-lock.json` 기준으로 `npm ci`로 설치합니다. |
| 데이터베이스 | MariaDB 또는 MySQL 호환 RDS | EC2에서 DB 호스트와 포트에 접근할 수 있어야 하며 기존 `USER`, `BDM_FEATURE_*`, `BDM_IMAGE_REFERENCE` 스키마가 필요합니다. |
| 네트워크 | 외부 `7746`, 내부 `8000`, EC2에서 DB 포트 연결 | `8000`은 외부에 공개하지 않고 Vite가 `/api/` 요청을 프록시합니다. |
| 이미지 저장소 | Git 저장소 밖의 쓰기 가능한 디렉터리 | `BDM_IMAGE_ROOT`로 지정하며 현재 예시는 `/home/ubuntu/data/necton/images`입니다. |
| E2E 테스트 | Playwright Chromium | 서비스 실행에는 필요하지 않고 `npm run test:e2e`를 실행할 때만 필요합니다. |

Ubuntu에서 `mysqlclient` 설치에 필요한 기본 도구가 없다면 최초 한 번 설치합니다.

```bash
sudo apt update
sudo apt install -y git curl build-essential pkg-config default-libmysqlclient-dev
```

E2E 테스트를 실행할 서버나 개발 PC에서는 프론트엔드 의존성 설치 후 Chromium도
설치합니다.

```bash
cd frontend
npx playwright install chromium
```

## Backend

새 로컬 SQLite에서 인증 API와 템플릿을 실행할 때는 다음처럼 실제 MariaDB와 분리합니다.
일반 SQLite에는 `managed=False`인 BDM 특징 테이블이 생성되지 않으므로 설정 화면의
CRUD까지 확인하려면 MariaDB를 연결하거나 Playwright E2E 환경을 사용합니다.

```bash
conda env create -f backend/environment.yml
conda activate necton_auth
cd backend
DB_ENGINE=sqlite python manage.py migrate
DB_ENGINE=sqlite python manage.py check
DB_ENGINE=sqlite python manage.py test
DB_ENGINE=sqlite python manage.py runserver 127.0.0.1:8000
```

MariaDB/RDS를 사용할 때는 `backend/.env.example`을 참고해 환경변수를 설정합니다.
현재 Django 설정은 `.env`를 자동으로 읽지 않으므로 실행 전에 셸 또는 서비스 설정으로
환경변수를 주입해야 합니다. 참조 이미지를 사용할 때는 `BDM_IMAGE_ROOT`에 Git
저장소 밖의 경로를 지정하고 Django 프로세스에 해당 디렉터리의 쓰기 권한을 줍니다.

### 인증 API

- `GET /api/auth/csrf/`: CSRF 쿠키와 토큰 발급
- `POST /api/auth/signup/`: 회원가입
- `POST /api/auth/login/`: 로그인 및 세션 생성
- `POST /api/auth/logout/`: 로그아웃 및 세션 제거
- `GET /api/auth/me/`: 현재 로그인 상태 확인
- `PATCH /api/auth/profile/`: 로그인 사용자의 닉네임 변경
- `POST /api/auth/password/`: 현재 비밀번호 확인 후 비밀번호 변경

변경 요청은 JSON 본문과 `X-CSRFToken` 헤더를 사용합니다. 프런트엔드는 먼저 CSRF
엔드포인트를 호출한 뒤 같은 도메인의 Django 세션 쿠키를 함께 전송합니다. JWT나
브라우저 `localStorage` 인증 토큰은 사용하지 않습니다.

### 문서 특징 관리 API

`SUPER_ADMIN`은 다음 API에서 대·중·소분류를 조회·추가·수정·삭제할 수 있습니다.
일반 사용자의 접근은 Django에서 차단합니다.

- `/api/settings/feature-groups/`
- `/api/settings/feature-types/`
- `/api/settings/feature-values/`
- `/api/settings/image-references/`

Document Image 중분류에는 물리적 형태와 객체 역할을 선택적으로 기록할 수 있습니다.
소분류를 만든 뒤 해당 항목을 선택해 JPEG, PNG, 정적 GIF, 정적 WebP 참조 이미지를
등록합니다. 파일은 SHA-256 이름으로 저장하며 DB와 API에는 서버 저장 루트가 아닌
상대 경로만 사용합니다.

`BDM_FEATURE_*`와 `BDM_IMAGE_REFERENCE`는 기존 MariaDB 스키마를 사용하는
`managed=False` 모델입니다. Django 마이그레이션은 모델 상태만 맞추며 운영 테이블을
생성하거나 변경하지 않습니다. 배포 전 `BDM_FEATURE_TYPE`의 `physical_type`,
`semantic_role` 열과 `BDM_IMAGE_REFERENCE` 테이블이 실제 DB에 있는지 확인해야
합니다.

## Frontend

Node.js 24 사용을 권장합니다.

```bash
cd frontend
npm ci
npm run dev
npm run lint
npm run build
npm run test:e2e
```

개발 서버는 상대 경로 `/api/` 요청을 `http://127.0.0.1:8000`의 Django로
프록시합니다.

현재 React 화면은 로그인, 회원가입, 인트로, 마이페이지와 `SUPER_ADMIN` 전용
문서 특징 관리 페이지로 구성됩니다. 공통 색상·타이포그래피·간격은 Tailwind의
시맨틱 토큰으로 관리하고, 화면과 상태 로직은 FSD 계층 안에서 분리합니다.

E2E 테스트는 `necton_auth` Conda 환경을 활성화한 상태에서 실행합니다.
Playwright가 격리된 SQLite 테스트 DB를 초기화하고 Django와 Vite 테스트 서버를
각각 `127.0.0.1:8766`, `127.0.0.1:8765`에 실행하므로 MariaDB 데이터에는 영향을
주지 않습니다. 비로그인 경로 보호, 로그인 성공·실패, 세션 유지와 로그아웃,
회원가입 후 로그인, `SUPER_ADMIN` 메뉴 노출을 Chromium에서 검증합니다.
Document Image E2E는 같은 격리 DB에서 실제 Django 이미지 업로드 API까지
검증합니다.

## 검증 기준

| 변경 범위 | 실행 명령 |
| --- | --- |
| 문서만 변경 | `git diff --check`와 링크·명령·환경변수의 실제 코드 대조 |
| Backend | `DB_ENGINE=sqlite python manage.py check`, `DB_ENGINE=sqlite python manage.py test` |
| Frontend | `npm run lint`, `npm run build` |
| 인증·권한·설정 화면 | 위 검증 전체와 `npm run test:e2e` |
| 실제 MariaDB 스키마 | 별도 백업 후 `SHOW TABLES`, `SHOW FULL COLUMNS`, `showmigrations` 대조 |

백엔드 테스트에 `DB_ENGINE=sqlite`를 명시하는 이유는 이미 MariaDB 환경변수를 불러온
터미널에서도 테스트가 실제 DB 설정을 상속하지 않게 하기 위해서입니다. E2E 명령은
추가로 전용 SQLite 경로와 심볼릭 링크 여부를 검사한 뒤 테스트 데이터를 초기화합니다.

## EC2 데모 실행

현재 EC2 데모는 운영용 Nginx나 Gunicorn 없이 Django 개발 서버와 Vite 개발
서버를 `nohup`으로 실행합니다. 외부에는 Vite의 `7746` 포트만 공개하고 Django는
EC2 내부의 `127.0.0.1:8000`에서 실행합니다.

### 1. 저장소와 의존성 준비

처음 설치하는 EC2에서는 저장소를 복제합니다.

```bash
mkdir -p ~/workspace
cd ~/workspace
git clone https://github.com/nickwildee/Necton_RDpage.git
```

복제 직후 또는 이미 저장소가 있는 환경에서는 항상 최신 `develop`을 받습니다.

```bash
cd ~/workspace/Necton_RDpage
git switch develop
git pull --ff-only origin develop

conda env create -f backend/environment.yml  # 최초 1회
conda activate necton_auth

cd frontend
npm ci
```

Conda 환경이 이미 있다면 `conda env create` 대신 아래 명령으로 고정된 백엔드
의존성을 갱신합니다. `package-lock.json`도 변경될 수 있으므로 새 코드를 받은 뒤에는
프론트엔드에서 `npm ci`를 실행합니다.

```bash
cd ~/workspace/Necton_RDpage
conda env update -f backend/environment.yml --prune
```

### 2. 백엔드 환경변수 설정

실제 `.env`에는 비밀번호가 포함되므로 Git에 커밋하지 않습니다.

```bash
cd ~/workspace/Necton_RDpage/backend
cp -n .env.example .env  # 최초 1회, 기존 .env는 덮어쓰지 않음
chmod 600 .env
```

`.env`에서 다음 값을 EC2와 MariaDB/RDS 환경에 맞게 설정합니다.
대문자로 적힌 예시 값은 그대로 사용하지 말고 실제 값으로 바꿉니다.

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

위 명령으로 생성한 값을 `DJANGO_SECRET_KEY`에 사용합니다.

```dotenv
DJANGO_DEBUG=true
DJANGO_SECRET_KEY=충분히-긴-임의의-값
DJANGO_ALLOWED_HOSTS=EC2_PUBLIC_IP,127.0.0.1,localhost

DB_ENGINE=mysql
DB_HOST=RDS_ENDPOINT
DB_PORT=RDS_PORT
DB_NAME=DATABASE_NAME
DB_USER=DATABASE_USER
DB_PASSWORD=DATABASE_PASSWORD

BDM_IMAGE_ROOT=/home/ubuntu/data/necton/images
```

이미지 저장 디렉터리는 Git 저장소 밖에 만들고 백엔드 실행 사용자에게 쓰기 권한을
줍니다.

```bash
mkdir -p /home/ubuntu/data/necton/images
```

Django 자체는 `.env` 파일을 자동으로 읽지 않습니다. `scripts/startup.sh`는 이 파일을
백엔드 프로세스에만 자동으로 불러옵니다. `.env`는 Bash 문법으로 읽으므로 `KEY=value`
형식만 사용하고, 공백이나 `$` 같은 특수문자가 포함된 값은 작은따옴표로 감쌉니다.
Django 관리 명령이나 수동 실행 명령을 사용할 때는 아래 순서로 값을 환경변수로
내보냅니다.

```bash
cd ~/workspace/Necton_RDpage/backend
set -a
source .env
set +a
```

비밀번호를 출력하지 않고 Django가 실제 MariaDB를 사용하는지 확인합니다.

```bash
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

`ENGINE=django.db.backends.mysql`과 각 테이블의 행 수가 출력되면 Django 설정,
기본 사용자 테이블과 BDM 관리 테이블 조회가 모두 정상입니다.

이때 Django가 "적용되지 않은 migration" 경고를 보여도 기존 MariaDB에 바로
`migrate`하지 않습니다. 이 저장소의 초기 migration은 `USER` 테이블 생성 이력을
포함하고, BDM 테이블은 Django가 관리하지 않습니다. 실제 DB의 migration 기록이
없거나 테이블 구조와 맞지 않으면 후임자가 단독으로 처리하지 말고 DB 백업과 스키마
대조를 먼저 안건으로 남깁니다.

### 3. 백엔드와 프론트엔드 일괄 실행

저장소 루트에서 `necton_auth` Conda 환경을 활성화한 뒤 실행 스크립트를 사용합니다.
스크립트는 `.env` 로드, 중복 실행 검사, 로그·PID 디렉터리 생성, 두 서버 실행과 HTTP
응답 확인을 순서대로 처리합니다.

```bash
cd ~/workspace/Necton_RDpage
conda activate necton_auth
./scripts/startup.sh
```

실행 로그와 PID는 다음 위치에 저장됩니다.

```text
backend/logs/backend.log
frontend/logs/frontend.log
.runtime/backend.pid
.runtime/frontend.pid
```

로그와 PID 파일은 Git에서 제외되며, 로그는 재시작해도 같은 파일에 이어서 기록됩니다.
현재 스크립트에는 로그 회전 기능이 없으므로 장기간 실행할 때는 파일 크기를 확인합니다.

### 4. 수동 실행

스크립트 문제를 진단할 때만 아래 명령을 사용합니다. 저장소 루트에서 디렉터리를 만들고,
백엔드 전용 서브셸에서만 `.env`를 불러온 뒤 두 프로세스를 별도 세션으로 실행합니다.

```bash
cd ~/workspace/Necton_RDpage
conda activate necton_auth
mkdir -p backend/logs frontend/logs .runtime

(
  cd backend
  set -a
  source .env
  set +a

  nohup setsid python manage.py runserver 127.0.0.1:8000 --noreload \
    >> "$PWD/logs/backend.log" 2>&1 < /dev/null &
  echo $! > ../.runtime/backend.pid
)
```

```bash
cd ~/workspace/Necton_RDpage/frontend

nohup setsid npm run dev -- \
  --host 0.0.0.0 \
  --port 7746 \
  --strictPort \
  >> "$PWD/logs/frontend.log" 2>&1 < /dev/null &
echo $! > ../.runtime/frontend.pid
```

Vite는 `npm -> sh -> vite(Node.js)` 순서로 자식 프로세스를 생성합니다. 이 EC2의
대화형 SSH 환경에서는 `nohup`만 사용하면 실제 Vite 프로세스가 SSH 세션에 남아,
터미널을 닫을 때 함께 종료될 수 있습니다. `setsid`는 전체 실행 체인을 새 세션으로
분리하고, `< /dev/null`은 표준 입력이 SSH 터미널을 참조하지 않도록 합니다.

위 명령은 SSH 연결을 종료한 뒤 다시 접속해 `7746` 포트와 HTTP `200 OK`가 유지되는
것까지 확인한 방식입니다. 다만 `nohup`과 `setsid`는 프로세스 장애나 EC2 재부팅 뒤
자동 재시작을 제공하지 않습니다. 그런 운영 기능이 필요하면 `systemd` 같은 프로세스
관리자를 별도로 도입해야 합니다.

### 5. 실행 확인

```bash
sudo ss -ltnp 'sport = :8000'
sudo ss -ltnp 'sport = :7746'

curl -s http://127.0.0.1:8000/api/auth/me/
curl -I http://127.0.0.1:7746/login
curl -s http://127.0.0.1:7746/api/auth/me/

tail -n 50 backend/logs/backend.log
tail -n 50 frontend/logs/frontend.log
```

정상이라면 `8000`은 `127.0.0.1`, `7746`은 `0.0.0.0`에서 `LISTEN`하고 인증 상태
API는 비로그인 상태에서 다음 JSON을 반환합니다.

```json
{"authenticated": false, "user": null}
```

브라우저에서는 `http://EC2_PUBLIC_IP:7746/login`으로 접속합니다. EC2 보안 그룹에는
테스트에 필요한 `7746` 인바운드만 허용하고 내부 Django 포트 `8000`은 외부에
공개하지 않습니다.

### 6. 종료와 재시작

저장소 루트에서 종료 스크립트를 실행합니다. 스크립트는 PID 파일에 기록된 세션이 실제
Django 또는 Vite 프로세스인지 검증한 뒤 프로세스 그룹 전체를 종료합니다.

```bash
cd ~/workspace/Necton_RDpage
./scripts/shutdown.sh
```

종료 결과는 다음 명령으로 확인합니다.

```bash
sudo ss -ltnp 'sport = :8000'
sudo ss -ltnp 'sport = :7746'
```

스크립트가 PID 파일이나 예상 명령이 다르다는 이유로 종료를 거부하면 임의로 다른
프로세스를 죽이지 않습니다. 먼저 저장된 세션과 실제 포트 사용 프로세스를 확인합니다.

```bash
cat .runtime/backend.pid .runtime/frontend.pid
ps -eo pid,ppid,sid,pgid,stat,cmd | grep -E 'manage.py runserver|npm run dev|vite'
sudo ss -ltnp 'sport = :8000 or sport = :7746'
```

수동으로 실행한 프로세스를 직접 종료해야 할 때는 저장된 세션 리더와 명령이 맞는지
확인한 다음 음수 PID로 프로세스 그룹 전체를 종료합니다.

```bash
BACKEND_PGID=$(cat .runtime/backend.pid)
FRONTEND_PGID=$(cat .runtime/frontend.pid)

ps -o pid,ppid,sid,pgid,stat,cmd -p "$BACKEND_PGID" -p "$FRONTEND_PGID"
kill -- "-$FRONTEND_PGID"
kill -- "-$BACKEND_PGID"
```

기존의 `nohup npm run dev ...` 방식으로 실행해 PID 파일이 없다면 `7746`의 `ss`
출력에 표시된 실제 `FRONTEND_PID`를 확인해 `kill FRONTEND_PID`로 종료한 뒤
`./scripts/startup.sh`로 다시 시작합니다. 같은 포트를 두 번 실행하지 않습니다.

`git pull`은 `--noreload`로 실행한 백엔드를 자동 재시작하지 않습니다. 새 코드를
받기 전 `./scripts/shutdown.sh`로 두 프로세스를 종료하고, 의존성을 갱신한 다음
`./scripts/startup.sh`로 다시 시작합니다.

```bash
cd ~/workspace/Necton_RDpage
./scripts/shutdown.sh
git pull --ff-only origin develop
conda env update -f backend/environment.yml --prune
(cd frontend && npm ci)
conda activate necton_auth
./scripts/startup.sh
```

로그인에서 "데이터베이스 연결에 문제가 있습니다"가 표시되는데 위의 Django DB
조회는 성공한다면, 실행 중인 백엔드가 환경변수 없이 시작됐는지 확인합니다. 아래
명령의 `BACKEND_PID`는 `ss` 출력에 나온 숫자로 바꿉니다.

```bash
sudo sh -c 'tr "\0" "\n" < /proc/BACKEND_PID/environ' \
  | grep -E '^DB_(ENGINE|HOST|PORT|NAME|USER)='
```

아무것도 출력되지 않으면 해당 프로세스는 `.env`를 전달받지 못한 것입니다. 프로세스를
종료하고 `set -a`, `source .env`, `set +a`를 실행한 뒤 백엔드를 다시 시작합니다.

프론트엔드 로그에는 `VITE ... ready`가 보이지만 SSH 터미널을 닫은 뒤 `7746` 포트가
사라진다면, 이전의 `nohup` 실행 방식으로 시작됐을 가능성이 큽니다. 기존 프로세스를
종료하고 `setsid` 명령으로 다시 실행한 뒤 SSH를 종료·재접속하여 확인합니다.

```bash
sudo ss -ltnp 'sport = :7746'
curl -I http://127.0.0.1:7746/login
tail -n 50 frontend/logs/frontend.log
```

## 배포 상태

현재 저장소는 Django 개발 서버와 Vite 개발 서버로 검증하는 단계입니다. 운영용
Nginx/Gunicorn 구성은 아직 포함하지 않으며, 같은 도메인에서 React 화면을 제공하고
`/api/`만 Django로 연결하는 배포를 목표로 합니다. 기존 EC2 서비스는 새 서비스
검증과 교체가 명시된 작업 전까지 유지합니다.
