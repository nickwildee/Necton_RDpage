# 기여 가이드

이 문서는 사람과 작업 에이전트가 같은 방식으로 변경사항을 만들고 검증하기 위한
기준입니다. 프로젝트 구조와 인증 흐름은 [아키텍처 문서](docs/ARCHITECTURE.md)를
참고하세요.

## 작업 시작 전

1. 루트와 작업 대상 디렉터리의 `AGENTS.md`를 읽습니다.
2. `README.md`와 관련 소스·테스트를 확인합니다.
3. `git status`와 최근 `git log`로 현재 브랜치와 기존 변경사항을 확인합니다.
4. 다른 사람이 만든 변경사항, `.env`, 운영 데이터와 실행 중인 서비스를 임의로
   수정하지 않습니다.

## Git Flow

일반 작업은 `develop`에서 분기하고 다시 `develop`으로 PR을 보냅니다. 검증된 릴리스만
`develop`에서 `main`으로 PR을 보냅니다. `main`과 `develop`에는 직접 커밋하지 않습니다.

```text
develop
   └─ {feature|fix|refactor|docs}/<topic>
          └─ Pull Request → develop

검증 완료된 develop
   └─ Pull Request → main
```

작업 브랜치는 최신 `develop`에서 만듭니다.

```bash
git switch develop
git pull --ff-only origin develop
git switch -c refactor/example-topic
```

브랜치 접두사는 변경 목적에 맞게 사용합니다.

| 접두사 | 용도 |
| --- | --- |
| `feature/` | 사용자 기능 추가 |
| `fix/` | 버그 수정 |
| `refactor/` | 동작을 바꾸지 않는 구조 개선 |
| `docs/` | 문서만 변경 |
| `hotfix/` | 배포된 `main`의 긴급 수정 |

`hotfix/`는 `main`에서 분기해 `main`으로 PR을 보내고, 병합된 수정사항을
`develop`에도 다시 반영합니다.

커밋 제목은 `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`처럼 변경 성격을 먼저
표시합니다. 하나의 커밋에는 하나의 논리적인 변경을 담습니다.

PR을 만들기 전에 원격 `develop`을 다시 반영하고 충돌을 해결합니다.

```bash
git fetch origin develop
git merge origin/develop --no-edit
```

## 개발 환경

백엔드와 프론트엔드는 의존성과 실행 환경이 분리된 프로젝트입니다. 명령도 각
디렉터리에서 실행합니다.

### Backend

```bash
conda env create -f backend/environment.yml
conda activate necton_auth
cd backend
python manage.py check
python manage.py test
python manage.py runserver 127.0.0.1:8000
```

환경변수는 `backend/.env.example`을 기준으로 셸이나 서비스 설정에서 주입합니다.
Django는 `.env` 파일을 자동으로 읽지 않으며 실제 비밀값을 커밋하면 안 됩니다.

### Frontend

Node.js 24를 사용합니다.

```bash
cd frontend
npm ci
npm run dev
npm run lint
npm run build
npm run test:e2e
```

Vite는 상대 `/api/` 요청을 `127.0.0.1:8000`의 Django로 프록시합니다. 프론트와
백엔드를 같은 포트에 실행하지 않습니다.

## 변경 범위

- 백엔드 변경은 `backend/`, 프론트 변경은 `frontend/` 안에서 끝내는 것을 기본으로
  합니다.
- API 계약이 바뀔 때만 양쪽 프로젝트를 함께 수정합니다.
- 요청받지 않은 기능, 인증 방식, 배포 설정을 작업 도중 추가하지 않습니다.
- 기존 Django 템플릿은 React가 로그인·회원가입·로그아웃·오류 동작을 모두 대체하고
  테스트가 갖춰질 때까지 유지합니다.
- 기존 크롤러 저장소와 EC2 서비스는 새 버전 검증과 교체가 명시된 작업에서만
  변경합니다.

## 인증 변경 시 확인사항

- 브라우저 인증은 Django 세션 쿠키와 CSRF를 사용합니다.
- API는 같은 도메인의 상대 경로 `/api/`로 호출합니다.
- 비밀번호, 세션 정보와 인증 토큰을 `localStorage`에 저장하지 않습니다.
- 역할값은 `SUPER_ADMIN`, `ORG_ADMIN`, `ORG_USER`, `USER`만 사용합니다.
- 메뉴 숨김은 보안 경계가 아닙니다. 권한이 필요한 API는 Django에서 요청마다 역할을
  검사해야 합니다.
- 기존 MariaDB `USER` 테이블과 비밀번호 해시 호환성을 유지합니다.

## 검증 기준

| 변경 범위 | 필수 검증 |
| --- | --- |
| Backend | `python manage.py check`, `python manage.py test` |
| Frontend | `npm run lint`, `npm run build` |
| 인증 API 또는 화면 | 위 검증 전체와 `npm run test:e2e` |
| 역할별 UI | `SUPER_ADMIN`과 일반 `USER`를 각각 확인 |
| DB 스키마 | 마이그레이션 포함 여부와 기존 `USER` 테이블 영향 확인 |

E2E 테스트는 격리된 SQLite DB와 전용 포트 `8765`, `8766`을 사용하며 실행할 때마다
테스트 데이터를 초기화합니다. 실제로 실행한 검증 결과만 PR에 기록합니다.

## Pull Request

PR은 저장소 템플릿에 맞춰 짧고 검증 가능하게 작성합니다.

- 무엇을 바꿨는지 2~4개 항목으로 적습니다.
- 관련 이슈가 있으면 `closes #번호`를 사용합니다.
- 실제 실행한 검증만 체크합니다.
- DB 스키마 변경 여부를 명시합니다.
- 일반 작업 PR의 대상은 `develop`, 검증된 릴리스 PR의 대상은 `main`입니다.
