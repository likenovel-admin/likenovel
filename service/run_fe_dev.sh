#!/bin/bash

set -euo pipefail

TARGET_DIR="/home/ln-admin/likenovel/service-dev"
PM2_NAME="likenovel-user-dev"
DEV_PORT="${DEV_PORT:-3001}"

echo "[run_fe_dev] target=$TARGET_DIR pm2=$PM2_NAME port=$DEV_PORT"

sudo chown -R ln-admin:ln-admin "$TARGET_DIR"
sudo chmod -R 700 "$TARGET_DIR"

cd "$TARGET_DIR"

# NOTE:
# - Next.js는 `next start` 실행 시점에 `.env.production`/`.env` 등을 로드합니다.
# - dev는 "별도 폴더(service-dev)" + "별도 PM2 프로세스"로 운영되므로,
#   최초 배포(=PM2 프로세스가 아직 없음)에서는 env 파일이 없으면 즉시 장애가 납니다.
# - 그래서 최초 배포 시 env 파일 누락을 CodeDeploy 단계에서 명확한 로그로 실패시키도록 방어합니다.
ENV_FILE="$TARGET_DIR/.env.production"
ENV_FILE_DEV="$TARGET_DIR/.env.production.dev"

# -----------------------------------------------------------------------------
# dev 환경변수 로딩 규칙(중요)
# - Next.js는 기본적으로 `.env.production`만 자동 로드합니다.
# - 따라서 likenovel.dev는 `.env.production.dev`를 "직접" 읽게 할 수 없고,
#   배포 스크립트에서 `.env.production.dev` -> `.env.production`으로 적용해야 합니다.
# - 운영/기존 흐름을 건드리지 않기 위해, dev 배포에서는 dev 파일이 있으면 항상 우선 적용합니다.
# -----------------------------------------------------------------------------
if [ -f "$ENV_FILE_DEV" ]; then
  echo "[run_fe_dev] applying $ENV_FILE_DEV -> $ENV_FILE"
  cp -f "$ENV_FILE_DEV" "$ENV_FILE"
fi

# PM2 프로세스가 이미 있으면 restart, 없으면 start (최초 배포 방어)
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  echo "[run_fe_dev] pm2 restart $PM2_NAME"
  pm2 restart "$PM2_NAME"
else
  if [ ! -f "$ENV_FILE" ]; then
    echo "[run_fe_dev] ❌ missing env file: $ENV_FILE"
    echo "[run_fe_dev]    (dev) create $ENV_FILE_DEV (recommended) or $ENV_FILE"
    echo "[run_fe_dev]    create this file on EC2 before first start. (do NOT commit)"
    exit 1
  fi

  echo "[run_fe_dev] pm2 start $PM2_NAME (first time)"
  PORT="$DEV_PORT" pm2 start start_service.sh --name "$PM2_NAME"
fi

pm2 save
echo "[run_fe_dev] done"


