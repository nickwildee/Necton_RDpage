# Necton RD Page

Necton RD Page는 문서의 내용과 특징을 분석해 어떤 조항에 해당하는지 분류하는
모델을 제공하는 서비스입니다. 이 저장소는 모델을 이용하기 위한 사용자 인증,
문서 특징 관리, React 웹 화면과 Django API를 관리합니다.

## 현재 기준

- 최신 릴리스는 `v0.1.3`입니다.
- `develop`에는 디자인 시스템 공통화, 설정 화면 반응형 개선, 분류 선택 UX 수정,
  Playwright 인증 E2E 테스트가 후속 반영되어 있습니다.
- GitHub Actions CI는 아직 도입 전이므로 PR 전 검증 명령은 로컬에서 실행합니다.

## 구조

- `backend/`: Django 인증 서버. React 전환이 끝날 때까지 기존 템플릿도 유지합니다.
- `frontend/`: React, Vite, TypeScript, Tailwind CSS 기반 웹 화면입니다.

두 프로젝트의 의존성, 환경변수, 실행 명령은 서로 섞지 않습니다.

## 문서

- [기여 가이드](CONTRIBUTING.md): Git Flow, 브랜치, 검증, PR 작성 기준
- [아키텍처](docs/ARCHITECTURE.md): 인증 흐름, FSD 계층, DB와 배포 구조
- [디자인 시스템](DESIGN.md): Tailwind 토큰, 타이포그래피, 공통 UI 기준
- [에이전트 작업 규칙](AGENTS.md): 작업 에이전트가 따라야 하는 저장소 규칙

## Backend

```bash
conda env create -f backend/environment.yml
conda activate necton_auth
cd backend
python manage.py check
python manage.py test
python manage.py runserver 127.0.0.1:8000
```

MariaDB/RDS를 사용할 때는 `backend/.env.example`을 참고해 환경변수를 설정합니다.
현재 Django 설정은 `.env`를 자동으로 읽지 않으므로 실행 전에 셸 또는 서비스 설정으로
환경변수를 주입해야 합니다.

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

## 배포 상태

현재 저장소는 Django 개발 서버와 Vite 개발 서버로 검증하는 단계입니다. 운영용
Nginx/Gunicorn 구성은 아직 포함하지 않으며, 같은 도메인에서 React 화면을 제공하고
`/api/`만 Django로 연결하는 배포를 목표로 합니다. 기존 EC2 서비스는 새 서비스
검증과 교체가 명시된 작업 전까지 유지합니다.
