# Necton RD Page

Necton RD의 인증 화면과 API를 관리하는 저장소입니다. 기존 Django 인증 기능을
유지하면서 프런트엔드를 React로 단계적으로 전환합니다.

## 구조

- `backend/`: Django 인증 서버. React 전환이 끝날 때까지 기존 템플릿도 유지합니다.
- `frontend/`: React, Vite, TypeScript, Tailwind CSS 기반 웹 화면입니다.

두 프로젝트의 의존성, 환경변수, 실행 명령은 서로 섞지 않습니다.

## Backend

```bash
conda env create -f backend/environment.yml
conda activate necton_auth_env
cd backend
python manage.py test
python manage.py runserver 127.0.0.1:8000
```

MariaDB/RDS를 사용할 때는 `backend/.env.example`을 참고해 환경변수를 설정합니다.
현재 Django 설정은 `.env`를 자동으로 읽지 않으므로 실행 전에 셸 또는 서비스 설정으로
환경변수를 주입해야 합니다.

## Frontend

Node.js 24 사용을 권장합니다.

```bash
cd frontend
npm install
npm run dev
npm run build
```

## 전환 상태

현재 단계는 저장소 분리와 프로젝트 구조 생성까지입니다. React 화면과 Django JSON API
연결, 운영용 Nginx/Gunicorn 설정은 후속 단계에서 추가합니다. 기존 EC2 서비스는 새
서비스 검증이 끝날 때까지 그대로 유지합니다.
