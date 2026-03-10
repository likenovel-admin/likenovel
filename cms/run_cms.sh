#!/bin/bash

sudo chown -R ln-admin:ln-admin /home/ln-admin/likenovel/cms
sudo chmod -R 700 /home/ln-admin/likenovel/cms

cd /home/ln-admin/likenovel/cms

# -----------------------------------------------------------------------------
# prod 환경변수 로딩 규칙(안전장치)
# - Next.js는 `.env.production`만 자동 로드합니다.
# - 운영에서는 `.env.production.prod`를 SSOT로 두고, 배포 시점에 `.env.production`으로 적용합니다.
# - (파일이 없으면 기존 동작 그대로 유지)
# -----------------------------------------------------------------------------
if [ -f "/home/ln-admin/likenovel/cms/.env.production.prod" ]; then
  echo "[run_cms] applying .env.production.prod -> .env.production"
  cp -f "/home/ln-admin/likenovel/cms/.env.production.prod" "/home/ln-admin/likenovel/cms/.env.production"
fi

pm2 restart start_cms.sh

exit 0

