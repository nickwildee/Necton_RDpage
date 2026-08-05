#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
RUNTIME_DIR="$PROJECT_ROOT/.runtime"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"
LOCK_FILE="$RUNTIME_DIR/process.lock"
EXIT_STATUS=0

process_group_rows() {
  local pgid="$1"

  ps -eo sid=,pgid=,args= | awk -v target="$pgid" '$2 == target'
}

port_in_use() {
  local port="$1"

  [[ -n "$(ss -H -ltn "sport = :$port")" ]]
}

stop_service() {
  local service_name="$1"
  local pid_file="$2"
  local expected_pattern="$3"
  local pid
  local rows
  local attempt

  if [[ ! -f "$pid_file" ]]; then
    printf '%s PID 파일이 없습니다. 이미 종료됐거나 스크립트 밖에서 실행된 프로세스입니다.\n' "$service_name"
    return 0
  fi

  pid="$(<"$pid_file")"
  if [[ ! "$pid" =~ ^[0-9]+$ ]]; then
    printf '%s PID 파일 값이 올바르지 않습니다: %s\n' "$service_name" "$pid_file" >&2
    EXIT_STATUS=1
    return 0
  fi

  rows="$(process_group_rows "$pid")"
  if [[ -z "$rows" ]]; then
    printf '%s 프로세스는 이미 종료됐습니다. 오래된 PID 파일을 정리합니다.\n' "$service_name"
    rm -f -- "$pid_file"
    return 0
  fi

  if ! awk -v target="$pid" '$1 != target { exit 1 }' <<< "$rows"; then
    printf '%s PID가 별도 세션이 아니므로 안전을 위해 종료하지 않습니다.\n' "$service_name" >&2
    printf '%s\n' "$rows" >&2
    EXIT_STATUS=1
    return 0
  fi

  if ! grep -Eq "$expected_pattern" <<< "$rows"; then
    printf '%s PID가 예상한 명령과 다르므로 안전을 위해 종료하지 않습니다.\n' "$service_name" >&2
    printf '%s\n' "$rows" >&2
    EXIT_STATUS=1
    return 0
  fi

  printf '%s 프로세스 그룹을 종료합니다: %s\n' "$service_name" "$pid"
  if ! kill -TERM -- "-$pid" 2>/dev/null; then
    if [[ -z "$(process_group_rows "$pid")" ]]; then
      rm -f -- "$pid_file"
      printf '%s 종료 완료\n' "$service_name"
      return 0
    fi

    printf '%s 프로세스에 종료 신호를 보내지 못했습니다.\n' "$service_name" >&2
    EXIT_STATUS=1
    return 0
  fi

  for attempt in {1..10}; do
    if [[ -z "$(process_group_rows "$pid")" ]]; then
      rm -f -- "$pid_file"
      printf '%s 종료 완료\n' "$service_name"
      return 0
    fi
    sleep 1
  done

  printf '%s가 정상 종료되지 않아 강제 종료합니다.\n' "$service_name" >&2
  kill -KILL -- "-$pid" 2>/dev/null || true
  sleep 1

  if [[ -z "$(process_group_rows "$pid")" ]]; then
    rm -f -- "$pid_file"
    printf '%s 강제 종료 완료\n' "$service_name"
    return 0
  fi

  printf '%s 프로세스가 아직 남아 있습니다. 직접 확인하세요.\n' "$service_name" >&2
  EXIT_STATUS=1
}

for command_name in ss grep ps awk flock; do
  command -v "$command_name" >/dev/null 2>&1 || {
    printf '오류: 필수 명령을 찾을 수 없습니다: %s\n' "$command_name" >&2
    exit 1
  }
done

mkdir -p -- "$RUNTIME_DIR"
exec 9> "$LOCK_FILE"
if ! flock -n 9; then
  printf '오류: 다른 시작 또는 종료 작업이 진행 중입니다. 잠시 후 다시 시도하세요.\n' >&2
  exit 1
fi

stop_service "프론트엔드" "$FRONTEND_PID_FILE" '(npm run dev|sh -c vite|node .*/vite)'
stop_service "백엔드" "$BACKEND_PID_FILE" 'python .*manage\.py runserver'

if port_in_use 7746; then
  printf '프론트엔드 포트 7746이 아직 사용 중입니다.\n' >&2
  ss -ltnp 'sport = :7746' >&2 || true
  EXIT_STATUS=1
fi

if port_in_use 8000; then
  printf '백엔드 포트 8000이 아직 사용 중입니다.\n' >&2
  ss -ltnp 'sport = :8000' >&2 || true
  EXIT_STATUS=1
fi

if [[ "$EXIT_STATUS" -eq 0 ]]; then
  printf '모든 서비스를 종료했습니다.\n'
fi

exit "$EXIT_STATUS"
