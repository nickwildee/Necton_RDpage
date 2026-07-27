# Necton RD 디자인 시스템

Necton RD의 화면은 차분하고 신뢰감 있는 문서·데이터 관리 도구를 지향합니다.
장식보다 정보 구조, 현재 선택, 작업 상태가 먼저 보여야 합니다.

## 적용 범위

- React 프론트엔드의 로그인, 회원가입, 인트로, 마이페이지, 설정 화면
- Tailwind CSS 전역 테마와 공통 UI
- 기존 화면의 시각 방향을 유지하는 점진적 정리

현재 범위에는 리브랜딩, 다크 모드, 다중 테마, Storybook 도입이 포함되지 않습니다.

## 원칙

1. **정보가 먼저입니다.** 색상과 그림자는 정보 구조와 상태를 설명할 때만 사용합니다.
2. **브랜드 색상은 절제합니다.** 주요 행동, 선택 상태, 포커스에 집중해서 사용합니다.
3. **같은 상태는 같은 모습입니다.** 기본, hover, focus, disabled, error 상태를 화면마다
   새로 만들지 않습니다.
4. **반복이 확인된 것만 공통화합니다.** 한 화면에만 필요한 표현은 성급하게 범용
   컴포넌트로 만들지 않습니다.
5. **의미 기반 토큰을 사용합니다.** 색상값이나 `auth-*`처럼 기능에 묶인 이름 대신
   `canvas`, `surface`, `ink`, `brand`, `danger`처럼 제품 전체에서 통하는 이름을
   사용합니다.

## 타이포그래피

기본 글꼴은 Pretendard이며, 사용할 수 없는 환경에서는 운영체제의 한글 산세리프
글꼴로 대체합니다.

```text
"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont,
"Segoe UI", sans-serif
```

| 역할 | Tailwind | 크기 | 기본 굵기 |
| --- | --- | ---: | ---: |
| 페이지 제목 | `text-page-title` | 28px | 700 |
| 섹션 제목 | `text-lg` | 18px | 700 |
| 기본 본문 | `text-sm` | 14px | 400 |
| 입력·버튼 본문 | `text-control` | 15px | 400~700 |
| 라벨·목록 제목 | `text-label` | 13px | 600~700 |
| 상태·개수·표 정보 | `text-caption` | 11px | 600~700 |

페이지 제목과 영문 구분 라벨에는 각각 `tracking-page-title`,
`tracking-eyebrow`를 사용합니다. 일반 제목은 `tracking-heading`, 버튼처럼 작은
UI 텍스트는 `tracking-interface`를 사용할 수 있습니다. 데이터 숫자에는
`tabular-nums`를 사용합니다.

## 색상

색상 원본은 `frontend/src/app/styles/index.css`의 Tailwind `@theme`에서 관리합니다.
컴포넌트에는 아래 Tailwind 클래스를 사용하고 색상값을 직접 작성하지 않습니다.

### 바탕과 내용

| 토큰 | 값 | Tailwind 예시 | 용도 |
| --- | --- | --- | --- |
| Canvas | `#f5f6f8` | `bg-canvas` | 앱 전체 배경 |
| Surface | `#ffffff` | `bg-surface` | 카드, 패널, 내비게이션 |
| Surface field | `#fcfcfd` | `bg-surface-field` | 입력 필드 기본 배경 |
| Surface subtle | `#f8f9fb` | `bg-surface-subtle` | 표 안의 작은 데이터 표시 |
| Surface muted | `#fafbfc` | `bg-surface-muted` | 모달 하단처럼 구분된 면 |
| Ink | `#383b41` | `text-ink` | 제목과 주요 정보 |
| Ink secondary | `#565b63` | `text-ink-secondary` | 라벨과 보조 강조 |
| Ink muted | `#7a7f88` | `text-ink-muted` | 설명과 비활성 정보 |
| Ink subtle | `#9a9ea5` | `placeholder:text-ink-subtle` | placeholder |
| Ink disabled | `#b6bbc4` | `text-ink-disabled` | 구분자와 약한 비활성 상태 |

### 구조와 상태

| 토큰 | 값 | Tailwind 예시 | 용도 |
| --- | --- | --- | --- |
| Line | `#dfe2e7` | `border-line` | 기본 테두리 |
| Line strong | `#c8ccd3` | `border-line-strong` | hover 테두리 |
| Line subtle | `#eceef1` | `border-line-subtle` | 표 행 구분선 |
| Brand | `#4f607e` | `bg-brand`, `text-brand` | 주요 행동과 선택 |
| Brand strong | `#40506c` | `bg-brand-strong` | hover와 강조 텍스트 |
| Brand soft | `#f2f5fa` | `bg-brand-soft` | 선택·안내 배경 |
| Brand line | `#d7deea` | `border-brand-line` | 선택·안내 테두리 |
| On brand | `#ffffff` | `text-on-brand` | 브랜드 배경 위의 텍스트와 아이콘 |
| Danger | `#b42318` | `text-danger` | 오류와 삭제 |
| Danger soft | `#fff8f7` | `bg-danger-soft` | 오류 배경 |
| Danger line | `#f0d0cc` | `border-danger-line` | 오류 테두리 |

`danger`는 오류와 파괴적 행동에만 사용합니다. 성공 상태는 현재 제품에 별도 시각
언어가 없으므로 임의의 초록색을 추가하지 않고 기본 안내 스타일을 사용합니다.

## 간격과 레이아웃

- 기본 간격 단위는 4px입니다.
- 우선 Tailwind 기본 간격 단계인 `2`, `3`, `4`, `5`, `6`, `8`, `10`을 사용합니다.
- 같은 임의 값이 세 곳 이상 반복될 때만 새 전역 토큰을 검토합니다.
- 앱 콘텐츠 최대 폭은 `max-w-app` 1200px입니다.
- 인증 카드 최대 폭은 `max-w-auth` 440px입니다.
- 편집 다이얼로그 최대 폭은 `max-w-dialog` 520px입니다.
- 페이지 좌우 여백은 모바일 24px, 큰 화면 40px을 기본으로 합니다.

## 형태와 깊이

| 역할 | Tailwind | 값 |
| --- | --- | ---: |
| 작은 데이터 표시 | `rounded-compact` | 6px |
| 버튼, 입력, 목록 항목 | `rounded-control` | 8px |
| 카드, 패널, 다이얼로그 | `rounded-panel` | 12px |
| 배지, 아바타 | `rounded-full` | 9999px |

- 일반 패널은 `shadow-panel`을 사용합니다.
- 더 약한 계정 카드에는 `shadow-panel-subtle`을 사용할 수 있습니다.
- 다이얼로그에는 `shadow-dialog`를 사용합니다.
- 키보드 포커스는 `outline-brand` 또는 `shadow-focus`로 분명히 표시합니다.
- 오류 입력 포커스에는 `shadow-danger-focus`를 사용합니다.

## 상호작용

- 기본 색상과 테두리 전환은 150ms입니다.
- 눌림 이동처럼 즉각적인 반응은 100ms까지 사용할 수 있습니다.
- `prefers-reduced-motion` 환경에서는 장식 목적의 전환을 제거합니다.
- 주요 내비게이션과 계정 행동의 클릭 영역은 최소 44px 높이를 유지합니다.
- disabled 상태는 커서와 투명도를 함께 바꿔 상태를 텍스트 없이도 구분합니다.

## 공통 UI 기준

공통 컴포넌트는 실제 중복이 확인된 순서로 만듭니다. 현재 `shared/ui`에는 다음
항목이 있습니다.

1. Button: primary, secondary, neutral, danger와 화면 밀도별 크기
2. Alert: notice, danger
3. Page header: 영문 구분 라벨, 제목, 설명

Form control은 인증 화면과 관리 다이얼로그의 크기·밀도가 달라 아직 공통화하지
않습니다. 세 번째 사용 문맥이나 공통 규격이 확인될 때 input, textarea, label,
error를 함께 검토합니다.

기능별 상태와 API 동작은 공통 UI로 옮기지 않습니다. 공통 UI는 표시와 상호작용
상태만 담당하고, FSD 계층의 `shared/ui`에 둡니다.

## 변경 시 확인사항

- 새 색상값이 `index.css` 밖에 직접 작성되지 않았는가
- 기존 토큰으로 표현할 수 있는데 새 토큰을 만들지 않았는가
- hover, focus, disabled, error 상태를 함께 확인했는가
- 모바일에서 정보 순서와 클릭 영역이 유지되는가
- 색상만으로 상태를 구분하지 않는가
- `npm run lint`와 `npm run build`를 통과했는가

## 결정 기록

| 날짜 | 결정 | 이유 |
| --- | --- | --- |
| 2026-07-24 | 기존 블루그레이 화면에서 토큰을 추출 | 이미 승인된 디자인을 유지하면서 화면 간 일관성을 높이기 위해 |
| 2026-07-24 | 의미 기반 Tailwind 토큰 사용 | 인증용으로 시작한 색상값을 제품 전체에서 안전하게 사용하기 위해 |
| 2026-07-24 | 리브랜딩과 다크 모드는 제외 | 현재 데모 범위를 벗어난 확장을 만들지 않기 위해 |
| 2026-07-27 | Tailwind `@theme`을 토큰 단일 원본으로 유지 | 사용처가 없는 TypeScript 토큰 사본과 동기화 비용을 만들지 않기 위해 |
| 2026-07-27 | 반복된 Button, Alert, PageHeader만 공통화 | 입력 필드의 문맥별 차이를 억지로 variant로 만들지 않기 위해 |
