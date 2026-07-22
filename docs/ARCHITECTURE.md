# Necton RD Page 아키텍처

이 문서는 Django 인증 서버와 React 클라이언트의 책임, 인증 흐름, 프론트엔드
계층 규칙을 설명합니다. 실제 작업 절차는 [기여 가이드](../CONTRIBUTING.md)를
참고하세요.

## 전체 구조

```text
Browser
  │
  ├─ /login, /signup, /intro/* ──> React + Vite
  │                                  │
  │                                  └─ relative /api/*
  │                                             │
  └─ session cookie + CSRF header ──────────────┤
                                                v
                                      Django authentication API
                                                │
                                                v
                                      MariaDB USER table
```

개발 환경에서는 Django가 `127.0.0.1:8000`에서 실행되고 Vite가 `/api` 요청을
Django로 프록시합니다. EC2 데모에서 외부에 공개할 포트가 `7746`이라면 Vite만
`0.0.0.0:7746`에 바인딩하고 Django는 로컬 `127.0.0.1:8000`을 사용합니다.

같은 도메인으로 배포할 때는 React 화면을 제공하는 서버가 `/api/` 요청만 Django로
연결합니다. 현재 저장소에는 운영용 Nginx와 Gunicorn 구성이 없습니다.

## 인증 흐름

JWT가 아니라 Django 세션 쿠키와 CSRF를 사용합니다.

```text
App 시작
  ├─ GET /api/auth/csrf/ ──> CSRF 쿠키와 토큰
  └─ GET /api/auth/me/   ──> 현재 사용자

상태 변경 요청
  └─ POST JSON + X-CSRFToken + same-origin cookie
       ├─ 성공 ──> 사용자/세션 상태 갱신
       └─ 403  ──> CSRF 토큰 재발급 후 한 번 재시도
```

`AuthProvider`가 사용자, 초기 연결 상태와 CSRF 토큰을 관리합니다. 로그인과
로그아웃 응답에 포함된 새 CSRF 토큰도 다시 저장합니다. Django는 signed-cookie
session backend를 사용하므로 기존 DB에 `django_session` 테이블이 없어도 동작합니다.

브라우저에는 비밀번호나 인증 토큰을 저장하지 않습니다. 세션 쿠키는 `HttpOnly`이고,
세션과 CSRF 쿠키는 `SameSite=Lax`를 사용합니다. HTTPS 환경에서는 secure cookie
설정을 활성화합니다.

### 인증 API

| Method | Path | 책임 |
| --- | --- | --- |
| `GET` | `/api/auth/csrf/` | CSRF 쿠키와 토큰 발급 |
| `POST` | `/api/auth/signup/` | 사용자 생성 |
| `POST` | `/api/auth/login/` | 인증 후 세션 생성 |
| `POST` | `/api/auth/logout/` | 세션 제거 |
| `GET` | `/api/auth/me/` | 현재 인증 상태와 사용자 반환 |

POST 요청은 `Content-Type: application/json`과 `X-CSRFToken` 헤더가 필요합니다.
API 오류는 `detail`과 선택적인 필드별 `errors`를 JSON으로 반환합니다.

## 사용자와 역할

Django `User` 모델은 새 테이블을 만들지 않고 기존 MariaDB `USER` 테이블에
매핑됩니다.

```text
USER
├─ user_id
├─ password
├─ email
├─ nickname
├─ phone
├─ role
├─ company_id
├─ company_name
├─ status
├─ created_date
└─ update_date
```

역할값은 다음 네 가지입니다.

- `SUPER_ADMIN`
- `ORG_ADMIN`
- `ORG_USER`
- `USER`

현재 설정 메뉴는 `SUPER_ADMIN`에게만 표시됩니다. 메뉴를 숨기는 것은 접근 제어가
아니므로 설정 API가 추가될 때는 Django에서도 `SUPER_ADMIN` 권한을 검사해야 합니다.

회원가입 시 같은 `company_name`이 이미 있으면 기존 `company_id`를 재사용합니다.
없으면 현재 최댓값 다음 번호를 생성합니다. 이 방식은 기존 스키마 호환을 위한 현재
동작이며, 동시 가입 정책이나 별도 회사 테이블 도입은 명시적인 DB 설계 작업으로
다룹니다.

## 프론트엔드 구조

프론트엔드는 Feature-Sliced Design(FSD)의 단방향 계층을 사용합니다.

```text
app
 └─ pages
     └─ widgets
         └─ features
             └─ entities
                 └─ shared
```

상위 계층은 하위 계층을 사용할 수 있지만 하위 계층은 상위 계층을 알면 안 됩니다.

| 계층 | 책임 |
| --- | --- |
| `app` | Provider, Router, 전역 스타일 |
| `pages` | URL 단위 화면 조립과 페이지 제목 |
| `widgets` | 네비게이션처럼 여러 요소를 합친 독립 UI 블록 |
| `features` | 로그인·회원가입처럼 사용자 행동을 완성하는 기능 |
| `entities` | 사용자 타입처럼 비즈니스 개체 표현 |
| `shared` | 비즈니스 의미가 없는 API client, UI, 유틸리티 |

각 slice는 필요에 따라 다음 segment를 사용합니다.

- `ui/`: JSX와 사용자에게 보이는 표현
- `model/`: 상태, custom hook, 타입과 동작
- `api/`: 구체적인 API 요청

### 페이지와 로직 분리

로그인과 회원가입은 다음 흐름으로 구성됩니다.

```text
LoginPage / SignupPage
  └─ LoginForm / SignupForm       ui: 입력과 오류를 렌더링
       └─ useLoginForm / useSignupForm
            ├─ 입력·제출 상태     model
            ├─ 성공·실패 처리     model
            ├─ 화면 이동          model
            └─ AuthProvider       인증 상태와 CSRF 처리
                 └─ auth/api      endpoint 요청
                      └─ shared/api client
```

페이지에 폼 상태나 API 요청을 다시 넣지 않습니다. UI 컴포넌트에는 표시 코드,
custom hook에는 상태와 이벤트 동작, API segment에는 HTTP 요청을 둡니다. 두 화면에
비슷한 코드가 있더라도 동작이 다른 경우 성급하게 하나의 범용 hook으로 합치지 않습니다.

`Navigation`도 메뉴 렌더링은 `ui/`, 사용자 표시·역할 판정·로그아웃은
`model/useNavigation`에서 담당합니다.

## Django 템플릿과 React 전환

기존 Django 로그인·회원가입·계정 템플릿은 React 전환 중 호환 화면입니다. React가
로그인, 회원가입, 로그아웃, 오류 상황을 자동 테스트로 충분히 대체하기 전까지 삭제하지
않습니다. 새 제품 UI는 React에 추가하고 Django 템플릿에는 기능을 확장하지 않습니다.

## 배포 안전 원칙

- 새 버전이 검증되기 전에는 기존 EC2 서비스나 별도 크롤러 저장소를 수정하거나
  중단하지 않습니다.
- Django와 Vite를 같은 포트에 실행하지 않습니다.
- 브라우저가 접근하는 포트와 내부 Django 포트를 구분합니다.
- IP와 포트는 프론트 소스에 하드코딩하지 않고 `/api/` 상대 경로를 유지합니다.
- 운영 서버 구성이나 서비스 교체는 별도 배포 작업에서 확인 절차와 함께 진행합니다.
