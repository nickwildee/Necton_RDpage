# API 계약

React 프론트엔드는 같은 출처의 상대 경로 `/api/`를 사용합니다. 개발 환경에서는
Vite가 Django로 프록시하고, EC2 데모에서는 외부 Vite 포트만 공개합니다.

## 공통 규칙

- 인증은 Django 세션 쿠키입니다. JWT와 `localStorage` 인증 토큰을 사용하지 않습니다.
- 변경 요청은 JSON 본문과 `X-CSRFToken` 헤더가 필요합니다.
- 먼저 `GET /api/auth/csrf/`를 호출해 CSRF 쿠키와 토큰을 받습니다.
- JSON 요청은 `Content-Type: application/json`을 사용합니다.
- 이미지 등록만 `multipart/form-data`를 사용합니다.
- 오류는 기본적으로 다음 형태입니다.

```json
{
  "detail": "입력값을 확인해 주세요.",
  "errors": {
    "email": ["이미 가입된 이메일입니다."]
  }
}
```

주요 상태 코드는 `400` 입력 오류, `401` 로그인 필요·인증 실패, `403` 권한 또는 CSRF
오류, `404` 대상 없음, `409` 현재 상태에서 처리할 수 없음, `413` 요청 크기 초과,
`415` Content-Type 오류, `503` DB·파일 저장소 사용 불가입니다.

## 인증 API

| Method | Path | 권한 | 요청 |
| --- | --- | --- | --- |
| GET | `/api/auth/csrf/` | 없음 | 없음 |
| POST | `/api/auth/signup/` | 없음 | `email`, `password`, `password_confirm`, `nickname`, `phone`, `company` |
| POST | `/api/auth/login/` | 없음 | `email`, `password` |
| POST | `/api/auth/logout/` | 로그인 권장 | 없음 |
| GET | `/api/auth/me/` | 없음 | 없음 |
| PATCH | `/api/auth/profile/` | 로그인 | `nickname` |
| POST | `/api/auth/password/` | 로그인 | `current_password`, `new_password`, `new_password_confirm` |

회원가입의 `password`와 비밀번호 확인은 8자 이상이어야 하며, `phone`은 입력할 경우
숫자 11자리입니다. 회원가입 후 자동 로그인하지 않습니다.

```json
POST /api/auth/signup/
{
  "email": "user@example.com",
  "password": "S3cure!Passphrase-7746",
  "password_confirm": "S3cure!Passphrase-7746",
  "nickname": "홍길동",
  "phone": "01012345678",
  "company": "Necton"
}
```

성공 응답은 `201`이며 `user`에는 `id`, `email`, `nickname`, `role`만 포함됩니다.
신규 회원의 역할은 항상 `USER`입니다.

```json
{
  "detail": "회원가입이 완료되었습니다. 로그인해 주세요.",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "홍길동",
    "role": "USER"
  }
}
```

로그인 성공 응답에는 현재 사용자와 새 `csrfToken`이 포함됩니다. `me`는 비로그인 상태에서
`{"authenticated": false, "user": null}`을 반환합니다.

## 문서 특징 관리 API

모든 조회·변경은 `SUPER_ADMIN`만 사용할 수 있습니다. 변경 요청은 CSRF 보호를 적용합니다.

### 대분류

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/settings/feature-groups/` | 전체 대분류 조회 |
| POST | `/api/settings/feature-groups/` | 대분류 추가 |
| PATCH | `/api/settings/feature-groups/{groupId}/` | 대분류 수정 |
| DELETE | `/api/settings/feature-groups/{groupId}/` | 하위 항목이 없을 때 삭제 |

추가·수정 본문은 `feature`와 `description`입니다.

```json
{
  "feature": "Document Image",
  "description": "문서 시각 정보"
}
```

### 중분류

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/settings/feature-types/?groupId=3` | 대분류의 중분류 조회 |
| POST | `/api/settings/feature-types/` | 중분류 추가 |
| PATCH | `/api/settings/feature-types/{typeId}/` | 중분류 수정 |
| DELETE | `/api/settings/feature-types/{typeId}/` | 하위 소분류가 없을 때 삭제 |

추가 본문은 `groupId`, `feature`, `description`이 필요하고 `note`, `physicalType`,
`semanticRole`은 선택입니다. `physicalType`과 `semanticRole`은 현재 대분류 ID `3`인
Document Image 중분류에서만 사용할 수 있습니다.

```json
{
  "groupId": 3,
  "feature": "Logo",
  "description": "기관 로고",
  "note": "선택 메모",
  "physicalType": "Raster image",
  "semanticRole": "Organization identity"
}
```

### 소분류

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/settings/feature-values/?typeId=4&page=1&pageSize=10` | 페이지 조회 |
| POST | `/api/settings/feature-values/` | 소분류 추가 |
| PATCH | `/api/settings/feature-values/{valueId}/` | 소분류 수정 |
| DELETE | `/api/settings/feature-values/{valueId}/` | 이미지 이력이 없을 때 삭제 |

추가 본문은 `typeId`, `feature`가 필요하며 `description`, `cWeight`, `sWeight`,
`oWeight`는 선택입니다. 가중치는 정수 `-128`부터 `127` 사이입니다. 목록의 기본
`pageSize`는 10이고 최대 50입니다.

```json
{
  "typeId": 4,
  "feature": "국가안보기관로고",
  "description": "국가안보 관련 기관 로고",
  "cWeight": 40,
  "sWeight": 80,
  "oWeight": 10
}
```

### 참조 이미지

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/settings/image-references/?valueId=11&page=1&pageSize=12` | 활성 이미지 목록 |
| POST | `/api/settings/image-references/` | 이미지 등록, multipart |
| PATCH | `/api/settings/image-references/{imageId}/` | 설명 수정 |
| DELETE | `/api/settings/image-references/{imageId}/` | `use_yn=N` 비활성화 |
| GET | `/api/settings/image-references/{imageId}/file/` | 이미지 파일 스트리밍 |

이미지 등록 필드는 multipart의 `valueId`, `description`, `image`입니다. 허용 형식은
JPEG, PNG, 정적 GIF, 정적 WebP입니다. 서버는 파일 내용의 SHA-256으로 저장명을 만들고,
같은 소분류에 활성 상태로 같은 내용이 있으면 `409`를 반환합니다. 기본 `pageSize`는
12이고 최대 50입니다.

응답 목록은 `items`와 `pagination`을 반환합니다.

```json
{
  "items": [
    {
      "id": 1,
      "valueId": 11,
      "originName": "기관 로고.png",
      "storedName": "<sha256>.png",
      "description": "기관 공식 로고",
      "registeredAt": "2026-08-05T12:00:00+09:00",
      "updatedAt": "2026-08-05T12:00:00+09:00",
      "fileUrl": "/api/settings/image-references/1/file/"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 12,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

## 연구 데이터 API

모든 로그인 역할이 O/S/C 문서를 읽을 수 있습니다. 목록은 유형별로 독립적이며 30건씩
페이지네이션합니다.

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/research/documents/summary/` | 전체·유형별 건수 |
| GET | `/api/research/documents/?category=O&page=1` | 유형별 문서 목록 |
| GET | `/api/research/documents/{id}/files/body/` | 본문 자료 |
| GET | `/api/research/documents/{id}/files/other/{index}/` | 기타 자료 |

요약 응답:

```json
{
  "totalItems": 96,
  "counts": {"O": 32, "S": 32, "C": 32}
}
```

목록의 `category`는 `O`, `S`, `C` 중 하나여야 합니다. 문서 항목은
`id`, `category`, `title`, `orderingAgency`, `department`, `productionDate`,
`bodyFile`, `otherFiles`를 반환합니다. `bodyFile`과 `otherFiles`에는 실제 저장 경로가
아니라 파일명과 인증된 파일 API URL만 포함됩니다.

## 변경 후 확인

API 계약을 바꿀 때는 백엔드 테스트와 프론트 타입·API 호출을 함께 확인합니다.

```bash
cd backend
DB_ENGINE=sqlite python manage.py test

cd ../frontend
npm run lint
npm run build
npm run test:e2e
```
