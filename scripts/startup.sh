#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
RUNTIME_DIR="$PROJECT_ROOT/.runtime"
BACKEND_LOG_DIR="$BACKEND_DIR/logs"
FRONTEND_LOG_DIR="$FRONTEND_DIR/logs"
BACKEND_LOG="$BACKEND_LOG_DIR/backend.log"
FRONTEND_LOG="$FRONTEND_LOG_DIR/frontend.log"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"
LOCK_FILE="$RUNTIME_DIR/process.lock"
BACKEND_PID=""
FRONTEND_PID=""
STARTUP_COMPLETE=0

fail() {
  printf '오류: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "필수 명령을 찾을 수 없습니다: $1"
}

process_group_exists() {
  local pgid="$1"

  ps -eo pgid= | awk -v target="$pgid" '
    $1 == target { found = 1 }
    END { exit found ? 0 : 1 }
  '
}

clear_stale_pid_file() {
  local service_name="$1"
  local pid_file="$2"
  local pid

  [[ -f "$pid_file" ]] || return 0

  pid="$(<"$pid_file")"
  if [[ "$pid" =~ ^[0-9]+$ ]] && process_group_exists "$pid"; then
    fail "$service_name 프로세스가 이미 실행 중입니다. 먼저 ./scripts/shutdown.sh를 실행하세요."
  fi

  printf '%s\n' "$service_name의 오래된 PID 파일을 정리합니다: $pid_file"
  rm -f -- "$pid_file"
}

ensure_port_free() {
  local service_name="$1"
  local port="$2"

  if [[ -n "$(ss -H -ltn "sport = :$port")" ]]; then
    printf '%s\n' "$service_name 포트 $port가 이미 사용 중입니다." >&2
    ss -ltnp "sport = :$port" >&2 || true
    fail "기존 프로세스를 확인한 뒤 종료하세요."
  fi
}

stop_started_group() {
  local pid="$1"
  local attempt

  [[ "$pid" =~ ^[0-9]+$ ]] || return 0
  process_group_exists "$pid" || return 0

  kill -TERM -- "-$pid" 2>/dev/null || true
  for attempt in {1..10}; do
    process_group_exists "$pid" || return 0
    sleep 1
  done

  kill -KILL -- "-$pid" 2>/dev/null || true
}

cleanup_on_exit() {
  local exit_status=$?

  trap - EXIT INT TERM
  if [[ "$STARTUP_COMPLETE" -eq 0 ]]; then
    if [[ -n "$FRONTEND_PID" ]]; then
      stop_started_group "$FRONTEND_PID"
      rm -f -- "$FRONTEND_PID_FILE"
    fi
    if [[ -n "$BACKEND_PID" ]]; then
      stop_started_group "$BACKEND_PID"
      rm -f -- "$BACKEND_PID_FILE"
    fi
  fi

  exit "$exit_status"
}

wait_for_service() {
  local service_name="$1"
  local url="$2"
  local pid="$3"
  local log_file="$4"
  local attempt

  for attempt in {1..15}; do
    if curl --fail --silent --show-error --max-time 2 "$url" >/dev/null 2>&1; then
      printf '%s 시작 완료: %s\n' "$service_name" "$url"
      return 0
    fi

    if ! process_group_exists "$pid"; then
      printf '%s 프로세스가 시작 중 종료됐습니다.\n' "$service_name" >&2
      tail -n 30 "$log_file" >&2 || true
      return 1
    fi

    sleep 1
  done

  printf '%s가 제한 시간 안에 응답하지 않았습니다.\n' "$service_name" >&2
  tail -n 30 "$log_file" >&2 || true
  return 1
}

trap cleanup_on_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

for command_name in python npm nohup setsid ss curl awk ps flock; do
  require_command "$command_name"
done

mkdir -p -- "$RUNTIME_DIR" "$BACKEND_LOG_DIR" "$FRONTEND_LOG_DIR"
exec 9> "$LOCK_FILE"
flock -n 9 || fail "다른 시작 또는 종료 작업이 진행 중입니다. 잠시 후 다시 시도하세요."

if [[ "${CONDA_DEFAULT_ENV:-}" != "necton_auth" ]]; then
  fail "먼저 'conda activate necton_auth'를 실행하세요."
fi

[[ -f "$BACKEND_DIR/.env" ]] || fail "$BACKEND_DIR/.env 파일이 없습니다."
[[ -d "$FRONTEND_DIR/node_modules" ]] || fail "frontend 의존성이 없습니다. frontend에서 npm ci를 실행하세요."

python -c 'import django' >/dev/null 2>&1 || fail "현재 Python 환경에 Django가 없습니다."

clear_stale_pid_file "백엔드" "$BACKEND_PID_FILE"
clear_stale_pid_file "프론트엔드" "$FRONTEND_PID_FILE"
ensure_port_free "백엔드" 8000
ensure_port_free "프론트엔드" 7746

printf '\n[%s] 백엔드 시작\n' "$(date --iso-8601=seconds)" >> "$BACKEND_LOG"
(
  exec 9>&-
  set -a
  # shellcheck disable=SC1091
  source "$BACKEND_DIR/.env"
  set +a
  cd "$BACKEND_DIR"
  nohup setsid python manage.py runserver 127.0.0.1:8000 --noreload \
    >> "$BACKEND_LOG" 2>&1 < /dev/null &
  printf '%s\n' "$!" > "$BACKEND_PID_FILE"
)
BACKEND_PID="$(<"$BACKEND_PID_FILE")"

if ! wait_for_service "백엔드" "http://127.0.0.1:8000/api/auth/me/" "$BACKEND_PID" "$BACKEND_LOG"; then
  stop_started_group "$BACKEND_PID"
  rm -f -- "$BACKEND_PID_FILE"
  fail "백엔드를 시작하지 못했습니다."
fi

printf '\n[%s] 프론트엔드 시작\n' "$(date --iso-8601=seconds)" >> "$FRONTEND_LOG"
(
  exec 9>&-
  cd "$FRONTEND_DIR"
  nohup setsid npm run dev -- \
    --host 0.0.0.0 \
    --port 7746 \
    --strictPort \
    >> "$FRONTEND_LOG" 2>&1 < /dev/null &
  printf '%s\n' "$!" > "$FRONTEND_PID_FILE"
)
FRONTEND_PID="$(<"$FRONTEND_PID_FILE")"

if ! wait_for_service "프론트엔드" "http://127.0.0.1:7746/login" "$FRONTEND_PID" "$FRONTEND_LOG"; then
  fail "프론트엔드를 시작하지 못해 백엔드도 종료했습니다."
fi

STARTUP_COMPLETE=1
printf '\n모든 서비스를 시작했습니다.\n'
printf '백엔드 로그: %s\n' "$BACKEND_LOG"
printf '프론트엔드 로그: %s\n' "$FRONTEND_LOG"
printf '종료 명령: %s/scripts/shutdown.sh\n' "$PROJECT_ROOT"
