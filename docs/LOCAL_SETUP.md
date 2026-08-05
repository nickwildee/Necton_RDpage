# 로컬 개발 환경 설정

이 문서는 저장소를 처음 받은 개발자가 로컬에서 인증 화면과 격리된 전체 데모를
확인하기 위한 절차입니다. 운영 MariaDB와 연구자료를 연결하는 방법은
[데이터베이스·운영 인계](DATABASE_HANDOFF.md)를 참고하세요.

## 1. 사전 요구사항

다음 도구를 먼저 설치합니다.

| 도구 | 기준 | 확인 명령 |
| --- | --- | --- |
| Git | 저장소 접근 권한 포함 | `git --version` |
| Conda | Miniconda 또는 Anaconda | `conda --version` |
| Python | 3.12 | `python --version` |
| Node.js | 24.x | `node --version` |
| npm | Node.js에 포함된 버전 | `npm --version` |

설치 방법은 각 공식 문서를 사용합니다.

- [Miniconda 설치](https://docs.conda.io/projects/miniconda/en/latest/)
- [Node.js 다운로드](https://nodejs.org/en/download)

Python 의존성은 시스템 Python에 설치하지 않고 저장소가 제공하는 Conda 환경에
설치합니다. Node.js 24가 이 프로젝트의 지원 기준입니다. 다른 버전에서 명령이
실행될 수 있어도 CI·배포 기준으로 간주하지 않습니다.

EC2 Ubuntu에서 백엔드와 데모 스크립트를 실행하려면 다음 시스템 패키지도 필요합니다.

```bash
sudo apt update
sudo apt install -y \
  git curl build-essential pkg-config default-libmysqlclient-dev \
  iproute2 procps util-linux
```

`iproute2`는 `ss`, `procps`는 `ps`, `util-linux`는 `flock`과 `setsid`를 제공합니다.

## 2. 저장소와 의존성 준비

```bash
git clone https://github.com/nickwildee/Necton_RDpage.git
cd Necton_RDpage
git switch develop

conda env create -f backend/environment.yml
conda activate necton_auth

cd frontend
npm ci
npx playwright install chromium
cd ..
```

Conda 환경이 이미 있으면 다음으로 저장소의 백엔드 버전을 맞춥니다.

```bash
conda env update -f backend/environment.yml --prune
```

## 3. 인증만 확인하는 로컬 실행

SQLite를 사용하면 운영 MariaDB와 분리된 인증 API와 React 화면을 확인할 수 있습니다.
기본 설정은 SQLite이므로 아래처럼 명시적으로 `DB_ENGINE=sqlite`를 붙입니다.

터미널 A에서 백엔드를 실행합니다.

```bash
cd Necton_RDpage/backend
conda activate necton_auth
DB_ENGINE=sqlite python manage.py migrate
DB_ENGINE=sqlite python manage.py check
DB_ENGINE=sqlite python manage.py runserver 127.0.0.1:8000
```

터미널 B에서 프론트엔드를 실행합니다.

```bash
cd Necton_RDpage/frontend
npm run dev
```

브라우저에서 [http://127.0.0.1:5173/login](http://127.0.0.1:5173/login)을 열고
회원가입을 진행합니다. Vite는 상대 경로 `/api/`를 `127.0.0.1:8000`의 Django로
프록시합니다.

이 경로에서 회원가입한 계정의 역할은 항상 `USER`입니다. SQLite에는
`managed=False`인 `BDM_FEATURE_*`, `BDM_IMAGE_REFERENCE`, `documents` 테이블과
샘플 데이터가 없으므로 설정·연구 데이터 화면의 실제 목록은 나타나지 않습니다.
전체 화면을 확인하려면 다음 격리 데모를 사용하거나 실제 MariaDB를 연결하세요.

## 4. 격리된 전체 데모 실행

E2E 서버는 `backend/e2e.sqlite3`와 `backend/.e2e-*` 아래에 테스트 전용 데이터와
파일을 만들고, 매번 초기화합니다. 운영 DB와 운영 파일 저장소에는 접근하지 않습니다.

터미널 A:

```bash
cd Necton_RDpage/backend
conda activate necton_auth
python manage.py run_e2e_server --settings=config.e2e_settings
```

터미널 B:

```bash
cd Necton_RDpage/frontend
VITE_API_PROXY_TARGET=http://127.0.0.1:8766 \
  npm run dev -- --host 127.0.0.1 --port 8765 --strictPort
```

브라우저에서 [http://127.0.0.1:8765/login](http://127.0.0.1:8765/login)을 엽니다.
테스트 전용 계정은 다음과 같습니다.

| 계정 | 이메일 | 비밀번호 | 확인할 수 있는 범위 |
| --- | --- | --- | --- |
| 일반 사용자 | `e2e-user@example.com` | `S3cure!Passphrase-7746` | 인증·연구 데이터 |
| 최고 관리자 | `e2e-super-admin@example.com` | `S3cure!Passphrase-7746` | 인증·연구 데이터·설정 |

위 계정과 비밀번호는 격리된 E2E 데이터에만 사용합니다. 운영 계정이나 실제
MariaDB에 재사용하지 않습니다.

자동 검증만 필요한 경우에는 프론트엔드에서 다음 명령을 실행합니다. Django와 Vite
테스트 서버를 자동으로 시작하고 종료하며 Chromium 테스트를 수행합니다.

```bash
cd Necton_RDpage/frontend
conda activate necton_auth
npm run test:e2e
```

## 5. 검증 명령

변경한 영역에 따라 다음 명령을 실행합니다.

```bash
# backend/
DB_ENGINE=sqlite python manage.py check
DB_ENGINE=sqlite python manage.py test

# frontend/
npm run lint
npm run build
npm run test:e2e
```

MariaDB를 환경변수로 설정한 터미널에서도 백엔드 테스트에는 반드시
`DB_ENGINE=sqlite`를 붙여 운영 DB에 테스트가 연결되지 않게 합니다.

## 6. EC2 데모 실행

EC2 데모는 `backend/.env`와 기존 MariaDB·파일 저장소가 필요하므로 이 문서의
인증용 SQLite 절차를 그대로 사용하지 않습니다.

```bash
cd Necton_RDpage/backend
cp -n .env.example .env
chmod 600 .env
# .env에 실제 DJANGO_*, DB_*, BDM_IMAGE_ROOT, RESEARCH_DOCUMENT_ROOT를 입력

cd ..
conda activate necton_auth
./scripts/startup.sh
```

`startup.sh`만 `.env`를 자동으로 읽습니다. `python manage.py`를 직접 실행할 때는
다음처럼 환경변수를 먼저 export해야 합니다.

```bash
cd Necton_RDpage/backend
set -a
source .env
set +a
```

EC2의 MariaDB 연결과 파일 저장소 준비는 [데이터베이스·운영 인계](DATABASE_HANDOFF.md)를
먼저 완료합니다. 실행·종료·로그·포트 확인은 [README의 EC2 데모 실행](../README.md#ec2-데모-실행)을
따릅니다.

## 문제 해결

- `frontend/node_modules` 오류: `cd frontend && npm ci`를 다시 실행합니다.
- `Django가 없습니다` 오류: `conda activate necton_auth` 후 `python -c 'import django'`를
  실행합니다.
- 포트 충돌: 기존 `8000`, `7746`, E2E용 `8765`, `8766` 프로세스를 확인합니다.
- 로그인에서 데이터베이스 오류: SQLite 명령에 `DB_ENGINE=sqlite`가 붙었는지 확인합니다.
- 설정 화면이 비어 있음: 일반 SQLite에는 BDM 테이블이 없으므로 격리 전체 데모 또는
  MariaDB 연결을 사용합니다.
