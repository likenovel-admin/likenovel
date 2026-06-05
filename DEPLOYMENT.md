## 배포/CI-CD 가이드 (GitHub Actions, dev/prod 브랜치)

> Status: CURRENT BACKGROUND, NOT EXECUTION SSOT
> Execution SSOT: `docs/deployment-runbook.md` and root `AGENTS.md`.
> Use this file for frontend Docker/staging background only. Backend deploy, DB channel, cron, and batch runtime path decisions must be checked in the current runbook and source scripts.

이 레포는 zip 기반으로 넘어온 코드를 **GitHub Actions**로 빌드/배포할 수 있게 정리하는 것을 목표로 합니다.

현재 운영(ln-web)은 **Docker Compose 기반**이므로, 이 문서는 “스테이징 분리”와 “Docker 기반 CI/CD”를 우선으로 다룹니다.

> 참고: 기존 CodeDeploy 워크플로(`likenovel-user-*.yml`)는 현재 운영 구조와 달라 **LEGACY(수동 실행)**로 변경해두었습니다.

---

## (가장 중요) 현재 운영 서버 구조 요약 (ln-web)
운영(ln-web, `ip-10-0-0-201`)은 **PM2가 아니라 Docker Compose**로 유저/파트너/CMS를 구동하고, Nginx가 80/443에서 **도메인별로 로컬 포트(3000/3001/3002)로 프록시**하는 구조입니다.

- **user (3000)**: `aiaracorp1/likenovel-user:production` → container: `likenovel-user-production`
- **partner (3001)**: `aiaracorp1/likenovel-partner:prod` → container: `likenovel-partner`
- **cms (3002)**: `aiaracorp1/likenovel-admin:production` → container: `likenovel-admin`

또한 운영 user 컨테이너 내부에는 `/app/.env`, `/app/.env.production` 파일이 존재합니다.  
즉, EC2 호스트 폴더(`~/likenovel/service`)에 `.env*`가 없어도 정상 동작할 수 있습니다.

---

## 스테이징(likenovel.dev) 분리 - “오늘 바로 끝내는” 최소 단계
목표: **운영을 절대 건드리지 않고**, dev 도메인(`likenovel.dev`, `partner.likenovel.dev`, `cms.likenovel.dev`)을 별도 컨테이너/포트로 분리합니다.

### 0) 절대 금지(운영 보호)
- 운영 컨테이너(`likenovel-user-production`, `likenovel-partner`, `likenovel-admin`) 삭제/재생성 금지
- 운영 docker compose 파일 수정 금지(먼저 dev를 분리해서 검증)
- PM2 관련 명령(`pm2 save` 등)은 ln-web에서는 의미가 없고, 실수로 상태를 망칠 수 있으니 금지

### 1) dev 컨테이너 3개를 “다른 포트”로 먼저 띄우기(검증용)
운영 이미지 그대로 복제해서 dev 도메인 라우팅부터 검증합니다.

- **dev 포트 제안**: user `3100`, partner `3101`, cms `3102`

#### 1.1) user-dev (3100)

```bash
mkdir -p /home/ln-admin/likenovel/service-dev/docker
cat > /home/ln-admin/likenovel/service-dev/docker/docker-compose.yml <<'YAML'
version: '3.8'
services:
  likenovel-user-dev:
    image: aiaracorp1/likenovel-user:production
    container_name: likenovel-user-dev
    restart: unless-stopped
    ports:
      - "3100:3000"
    environment:
      - NODE_ENV=production
YAML
docker compose -p service-dev -f /home/ln-admin/likenovel/service-dev/docker/docker-compose.yml up -d
```

#### 1.2) partner-dev (3101)

```bash
mkdir -p /home/ln-admin/likenovel/partner-dev/docker
cat > /home/ln-admin/likenovel/partner-dev/docker/docker-compose.yml <<'YAML'
version: "3.8"
services:
  likenovel-partner-dev:
    image: aiaracorp1/likenovel-partner:prod
    container_name: likenovel-partner-dev
    restart: unless-stopped
    ports:
      - "3101:3001"
    environment:
      - NODE_ENV=production
YAML
docker compose -p partner-dev -f /home/ln-admin/likenovel/partner-dev/docker/docker-compose.yml up -d
```

#### 1.3) cms-dev (3102)

```bash
mkdir -p /home/ln-admin/likenovel/cms-dev/docker
mkdir -p /home/ln-admin/likenovel/docker-dev
cat > /home/ln-admin/likenovel/cms-dev/docker/docker-compose.yml <<'YAML'
version: '3.8'
services:
  likenovel-admin-dev:
    image: aiaracorp1/likenovel-admin:production
    container_name: likenovel-admin-dev
    restart: unless-stopped
    ports:
      - "3102:3002"
    volumes:
      - /home/ln-admin/likenovel/docker-dev:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3002
      - HOSTNAME=0.0.0.0
YAML
docker compose -p cms-dev -f /home/ln-admin/likenovel/cms-dev/docker/docker-compose.yml up -d
```

> 여기까지는 “운영과 동일 이미지 복제”라서 화면이 같게 나오는 게 정상입니다.  
> 이 단계의 목적은 **도메인/프록시 분기(nginx)가 제대로 되는지**를 1차로 확인하는 것입니다.

### 2) Nginx에 dev 도메인 server block 추가(핵심)
현재 nginx에는 `.net` 도메인만 있고 `.dev` server_name이 없어서, dev로 들어오면 기본 server로 떨어져 **엉뚱한 화면이 나옵니다.**

해야 할 일:
- `likenovel.dev`(+`www.likenovel.dev`) → `127.0.0.1:3100`
- `partner.likenovel.dev` → `127.0.0.1:3101`
- `cms.likenovel.dev` → `127.0.0.1:3102`

**가장 안전한 방법**: 기존 `.net` 서버블록을 그대로 복사하고,
`server_name`만 `.dev`로 바꾸고 `proxy_pass` 포트만 `31xx`로 바꾸세요. (SSL 설정/헤더 포함)

#### 2.1) 어떤 nginx 설정 파일을 수정해야 하는지 찾기
아래 명령으로 `.net` 서버블록이 들어있는 파일 경로를 찾습니다.

```bash
sudo grep -R "server_name www\\.likenovel\\.net" -n /etc/nginx
sudo grep -R "server_name partner\\.likenovel\\.net" -n /etc/nginx
sudo grep -R "server_name cms\\.likenovel\\.net" -n /etc/nginx
```

추가로, 실제 프록시 포트(3000/3001/3002)가 어디에서 설정되는지도 같이 찾으면 더 안전합니다.

```bash
sudo grep -R "proxy_pass" -n /etc/nginx | grep -E "3000|3001|3002"
```

#### 2.2) 편집 전 백업(필수)
찾아낸 nginx 설정 파일을 백업해둡니다.

```bash
sudo cp -a <nginx-conf-path> <nginx-conf-path>.bak.$(date +%F-%H%M%S)
```

#### 2.3) `.dev` 서버블록 추가(복사/수정 규칙)
아래 “규칙”만 지키면 됩니다(운영 `.net` 설정은 그대로 유지).

- ✅ 핵심: **기존 `.net` server block은 삭제/수정하지 않습니다.**  
  `.dev`용 block을 **새로 추가**하는 것이고, `.net`은 그대로 유지됩니다.

- ✅ 더 안전한 방법(권장): 기존 파일(`/etc/nginx/conf.d/ln_rp.conf`)을 직접 건드리기보다  
  **새 파일**(`/etc/nginx/conf.d/ln_rp_dev.conf`)을 만들어 `.dev` server block만 넣어도 됩니다.  
  이렇게 하면 `.net` 설정 파일은 그대로라서, 실수로 `.net`을 망가뜨릴 가능성이 거의 0입니다.

##### 2.3.1) 새 파일 생성(EC2에서 실행)
아래처럼 `sudo tee`로 새 파일을 만들 수 있습니다.  
운영(`ln_rp.conf`)과 동일하게 **443(SSL) 기반으로 라우팅**되도록 구성하고, 80은 dev 컨테이너로 프록시합니다(Cloudflare 설정에 상관없이 동작하도록 안전하게).

```bash
sudo tee /etc/nginx/conf.d/ln_rp_dev.conf > /dev/null <<'NGINX'
# likenovel.dev (staging) reverse proxy
# - NOTE: 운영(.net) 설정은 건드리지 않고, .dev server block만 추가합니다.

server {
  listen 80;
  server_name www.likenovel.dev likenovel.dev;

  location / {
    proxy_pass http://127.0.0.1:3100;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

server {
  listen 80;
  server_name partner.likenovel.dev;

  location / {
    proxy_pass http://127.0.0.1:3101;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

server {
  listen 80;
  server_name cms.likenovel.dev;

  location / {
    proxy_pass http://127.0.0.1:3102;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

# --- HTTPS (443) ---
# NOTE: 운영(.net)과 동일하게 Cloudflare Origin 인증서를 사용합니다.
#       cert 경로는 운영 `ln_rp.conf`와 동일한 값을 사용하세요.

server {
  listen 443 ssl;
  server_name www.likenovel.dev likenovel.dev;

  ssl_certificate /home/ln-admin/.ssh/cf_ssl.crt;
  ssl_certificate_key /home/ln-admin/.ssh/cf_ssl.pem;

  location /api/v1/ {
    proxy_set_header Host api.likenovel.net;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://api/v1/;
  }

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://127.0.0.1:3100;
  }
}

server {
  listen 443 ssl;
  server_name partner.likenovel.dev;

  ssl_certificate /home/ln-admin/.ssh/cf_ssl.crt;
  ssl_certificate_key /home/ln-admin/.ssh/cf_ssl.pem;

  location /api/v1/ {
    proxy_set_header Host api.likenovel.net;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://api/v1/;
  }

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://127.0.0.1:3101;
  }
}

server {
  listen 443 ssl;
  server_name cms.likenovel.dev;

  ssl_certificate /home/ln-admin/.ssh/cf_ssl.crt;
  ssl_certificate_key /home/ln-admin/.ssh/cf_ssl.pem;

  location /api/v1/ {
    proxy_set_header Host api.likenovel.net;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://api/v1/;
  }

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://127.0.0.1:3102;
  }
}
NGINX
```

> `.dev` 443에서 Cloudflare가 526(Invalid SSL certificate)를 띄우면, Cloudflare SSL/TLS 모드(Full/Strict)와  
> Origin 인증서에 `.dev` 도메인이 포함되어 있는지부터 확인하세요.

- **user**:
  - `server_name` → `likenovel.dev www.likenovel.dev`
  - `proxy_pass` → `127.0.0.1:3100` (dev 컨테이너)
- **partner**:
  - `server_name` → `partner.likenovel.dev`
  - `proxy_pass` → `127.0.0.1:3101`
- **cms**:
  - `server_name` → `cms.likenovel.dev`
  - `proxy_pass` → `127.0.0.1:3102`

> SSL은 “기존 `.net` 서버블록의 SSL 설정”을 그대로 복사해서 쓰는 게 가장 안전합니다.  
> Cloudflare SSL/TLS가 `Full(strict)`라면, `.dev` 도메인을 포함하는 Origin 인증서/인증서 설정이 필요할 수 있습니다.

적용 후 테스트/리로드:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### 2.4) nginx 분기 로컬 확인(Host 헤더로 테스트)
DNS/Cloudflare와 무관하게 “nginx가 올바른 포트로 보내는지”를 서버에서 바로 확인할 수 있습니다.

```bash
curl -I http://127.0.0.1 -H "Host: likenovel.dev" | head
curl -I http://127.0.0.1 -H "Host: partner.likenovel.dev" | head
curl -I http://127.0.0.1 -H "Host: cms.likenovel.dev" | head
```

SSL(443)까지 확인이 필요하면(인증서 불일치가 있을 수 있어 `-k` 사용):

```bash
curl -kI https://127.0.0.1 -H "Host: likenovel.dev" | head
```

#### 2.5) 문제 생기면 즉시 롤백(운영 보호)
```bash
sudo cp -a <nginx-conf-path>.bak.<timestamp> <nginx-conf-path>
sudo nginx -t
sudo systemctl reload nginx
```

### 3) dev 도메인 접속 확인
아래 3개가 각각 다른 컨테이너(3100/3101/3102)로 붙는지 확인합니다.
- `likenovel.dev`
- `partner.likenovel.dev`
- `cms.likenovel.dev`

---

## 그 다음 단계: “진짜 스테이징(=dev 코드)”로 전환
위 1~3이 끝나면, dev 컨테이너의 이미지(`aiaracorp1/...`)를 우리가 빌드한 이미지로 교체합니다.

권장 흐름:
- GitHub Actions: `dev` 브랜치 push → Docker 이미지 build/push
- EC2(ln-web): `docker compose pull && docker compose up -d`로 dev 컨테이너만 갱신

> 운영과 동일하게 Docker 기반으로 가면, prod 전환도 같은 방식으로 안전하게 할 수 있습니다.

---

## (중요) 스테이징에서 “작품등록/유료전환(결제)”을 안전하게 테스트하려면: API/DB 분리
> LEGACY MANUAL STAGING PLAN - NOT CURRENT BACKEND DEV DEPLOYMENT PATH
> Current backend dev deployment uses the backend submodule `dev` branch,
> `likenovel-service-api/likenovel-service-api/.github/workflows/deploy_be_actions_dev.yml`,
> CodeDeploy, `likenovel-api-dev.service`, and
> `likenovel-service-api/likenovel-service-api/fastapi_be_server/dist/run_be.dev.sh`.
> Do not run the PM2 commands below unless a separate live server readback proves
> that this legacy manual staging path is the intended recovery target.

현재 dev 웹(`likenovel.dev`)은 프론트가 분리되어 있어도, **API가 운영(`api.likenovel.net`)을 바라보면 DB가 공유**됩니다.  
이 상태에서 dev에서 작품을 등록하거나 유료 전환/결제를 테스트하면 **운영 DB에 데이터가 들어갈 수 있습니다.**

따라서 “진짜 스테이징”을 위해 아래 3가지를 분리합니다.
- **dev DB**: 운영 RDS 스냅샷 복원으로 생성(개인정보 포함이므로 Public access 금지)
- **dev API**: ln-was에서 `api-dev` 프로세스를 별도 포트로 실행(예: 3011)
- **api.likenovel.dev**: ln-web Nginx에서 dev API로 프록시

### 1) dev RDS 생성(운영 스냅샷 복원)
- **Public access**: 반드시 `No`
- **VPC security group**: MySQL(3306) 인바운드는 **ln-was(10.0.100.110)만 허용**(가능하면 SG로 지정)
- Endpoint 예: `likenovel-dev.<...>.ap-northeast-2.rds.amazonaws.com`

> RDS의 비밀번호는 “조회”가 불가능합니다. 필요하면 dev RDS에서만 **재설정**하세요(운영 RDS에는 영향 없음).

### 2) ln-was에서 dev API(`api-dev`) 실행 (포트: 3011 권장)
운영 API는 `3010`을 사용하므로 dev는 `3011`로 분리합니다.

```bash
# ln-was(10.0.100.110)에서
cd /home/ln-admin/likenovel/api

# 기존 api-dev가 있으면 제거(환경변수 갱신 방지)
pm2 delete api-dev || true

# dev DB로 연결 + dev FE 도메인으로 리다이렉트 설정
DB_IP="<DEV_RDS_ENDPOINT>" \
DB_PORT="3306" \
DB_USER_ID="<DEV_DB_USER>" \
DB_USER_PW="<DEV_DB_PASSWORD>" \
FE_DOMAIN="https://likenovel.dev" \
FE_WWW_DOMAIN="https://www.likenovel.dev" \
pm2 start /home/ln-admin/likenovel/api/.venv/bin/gunicorn \
  --name api-dev \
  --interpreter /home/ln-admin/likenovel/api/.venv/bin/python \
  -- app.main:be_app \
  --bind 10.0.100.110:3011 \
  --workers 2 \
  --worker-class uvicorn.workers.UvicornWorker \
  --pid /home/ln-admin/likenovel/api/gunicorn-dev.pid \
  --log-level info \
  -c /home/ln-admin/likenovel/api/gconf.py

pm2 save
pm2 list
```

정상 확인(200이면 OK):

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://10.0.100.110:3011/docs
pm2 logs api-dev --lines 50
```

> ⚠️ 결제(PortOne) 테스트를 할 경우, dev에서는 반드시 **테스트 키/시크릿**으로 분리하세요.  
> (DB를 dev로 분리해도 “외부 결제”는 실제 결제가 발생할 수 있습니다)

### 3) ln-web Nginx에 `api.likenovel.dev` 추가
운영 `api.likenovel.net` 설정을 그대로 복사해서, `server_name`과 `proxy_pass`만 dev로 바꿉니다.  
운영을 건드리지 않도록 **새 파일**로 추가하는 것을 권장합니다.

```bash
sudo tee /etc/nginx/conf.d/ln_api_dev.conf > /dev/null <<'NGINX'
# FastAPI dev (api.likenovel.dev) -> ln-was api-dev(3011)
server {
  listen 443 ssl;
  server_name api.likenovel.dev;

  ssl_certificate /home/ln-admin/.ssh/cf_ssl.crt;
  ssl_certificate_key /home/ln-admin/.ssh/cf_ssl.pem;

  location / {
    if ($request_method = OPTIONS) {
      add_header 'Access-Control-Allow-Origin' "$cors_allow" always;
      add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE, PATCH' always;
      add_header 'Access-Control-Allow-Headers' 'Authorization,Content-Type,X-CSRF-Token,Access-Control-Allow-Credentials,Access-Control-Allow-Methods' always;
      add_header 'Access-Control-Max-Age' 86400 always;
      add_header 'Access-Control-Allow-Credentials' 'true' always;
      return 204;
    }

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://10.0.100.110:3011;

    add_header 'Access-Control-Allow-Origin' "$cors_allow" always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Vary' 'Origin' always;

    # cloudflare restoring original visitor IPs
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 2400:cb00::/32;
    set_real_ip_from 2606:4700::/32;
    set_real_ip_from 2803:f800::/32;
    set_real_ip_from 2405:b500::/32;
    set_real_ip_from 2405:8100::/32;
    set_real_ip_from 2a06:98c0::/29;
    set_real_ip_from 2c0f:f248::/32;

    real_ip_header CF-Connecting-IP;
  }
}
NGINX
```

적용:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

테스트(SNI까지 맞추기 위해 `--resolve` 사용 권장):

```bash
curl -kI https://api.likenovel.dev/docs --resolve api.likenovel.dev:443:127.0.0.1 | head
```

### 4) CORS 허용 도메인(`$cors_allow`)에 `.dev` 추가(필수)
`Access-Control-Allow-Origin`이 `$cors_allow`로 설정되어 있으므로, `.dev`와 로컬 도메인을 허용해야 브라우저에서 호출이 됩니다.

아래로 위치를 찾은 뒤:

```bash
sudo grep -R "cors_allow" -n /etc/nginx | head
```

`map $http_origin $cors_allow { ... }`에 다음 origin들을 추가하세요(예시):
- `https://likenovel.dev`, `https://www.likenovel.dev`
- `https://partner.likenovel.dev`
- `https://cms.likenovel.dev`
- `http://localhost:3000`, `http://localhost:3001`, `http://localhost:3002`

수정 후:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5) dev 프론트 env를 `api.likenovel.dev`로 전환
GitHub Secrets에서 dev 환경변수를 다음으로 교체한 뒤(dev 이미지 재빌드):
- user(`SERVICE_ENV_DEV`): `NEXT_PUBLIC_API_SERVER_URI`, `API_SERVER_URI` → `https://api.likenovel.dev`
- partner/cms(`PARTNER_ENV_DEV`, `CMS_ENV_DEV`): `NEXT_PUBLIC_API_URL` → `https://api.likenovel.dev`

그 다음 ln-web에서 dev 컨테이너만 `pull && up -d` 하면 dev는 dev DB로만 동작합니다.

## Docker 기반 CI/CD (권장: 현재 ln-web 운영 방식)
### 1) 브랜치 전략
- **dev**: 스테이징 이미지 빌드/푸시 (`.github/workflows/docker-dev.yml`)
- **prod**: 운영 이미지 빌드/푸시 (`.github/workflows/docker-prod.yml`)

### 2) GitHub Actions 워크플로
- `/.github/workflows/docker-dev.yml`
- `/.github/workflows/docker-prod.yml`

두 워크플로 모두:
- `service/`, `partner/`, `cms/`를 각각 Docker build
- AWS ECR에 push
  - dev: `dev-latest`, `dev-${GITHUB_SHA}`
  - prod: `prod-latest`, `prod-${GITHUB_SHA}`

> 운영 서버(ln-web)는 “이미지 pull + docker compose up -d”만 하면 됩니다.

### 3) dev/prod가 절대 덮어쓰지 않도록 하는 방식(중요)
현재 ln-web은 아래처럼 분리되어 있습니다.

- **prod**:
  - user: `3000` (container: `likenovel-user-production`)
  - partner: `3001` (container: `likenovel-partner`)
  - cms: `3002` (container: `likenovel-admin`)
- **dev(스테이징)**:
  - user-dev: `3100` (container: `likenovel-user-dev`)
  - partner-dev: `3101` (container: `likenovel-partner-dev`)
  - cms-dev: `3102` (container: `likenovel-admin-dev`)

Nginx(원본)에서도 Host 기반으로 아래처럼 분기되어야 합니다.
- `*.likenovel.net` → 3000/3001/3002
- `*.likenovel.dev` → 3100/3101/3102

### 4) 필수 GitHub Secrets (Docker/ECR)
아래 키를 GitHub Repository → Settings → Secrets and variables → Actions 에 등록하세요.

#### 4.1) AWS/ECR 공통
- **AWS_ACCESS_KEY_ID**
- **AWS_SECRET_ACCESS_KEY**
- **AWS_REGION** (예: `ap-northeast-2`)
- **ECR_REPO_SERVICE** (예: `likenovel-user`)
- **ECR_REPO_PARTNER** (예: `likenovel-partner`)
- **ECR_REPO_CMS** (예: `likenovel-cms`)

#### 4.2) 빌드용 환경변수(dev)
- **SERVICE_ENV_DEV** → `service/.env.production` 생성용
- **PARTNER_ENV_DEV** → `partner/.env.production` 생성용
- **CMS_ENV_DEV** → `cms/.env.production` 생성용

#### 4.3) 빌드용 환경변수(prod)
- **SERVICE_ENV_PROD**
- **PARTNER_ENV_PROD**
- **CMS_ENV_PROD**

> 각 앱의 환경변수 목록은 `service/ENV.example`, `partner/ENV.example`, `cms/ENV.example`를 참고하세요.

### 4) 유저웹 환경변수 목록
유저웹 폴더의 `ENV.example`를 참고해서 `.env` / `.env.production` 값을 구성하세요.

- `service/ENV.example`

### 5) EC2 런타임에서 환경변수는 어디에 두나요? (중요)
> LEGACY TROUBLESHOOTING ONLY - NOT CURRENT DEPLOYMENT PATH
> Current frontend deployment is Docker/ECR through `.github/workflows/docker-dev.yml`
> and `.github/workflows/docker-prod.yml`, then Docker Compose on ln-web.
> Do not run PM2 commands from this section before checking `docs/deployment-runbook.md`,
> `docs/wiki/deployment-and-batch.md`, and live Docker Compose/container state.

GitHub Actions는 **빌드용으로만** `service/.env.production`을 생성합니다.  
하지만 zip 번들에는 `**/.env` / `**/.env.*`가 **제외**되므로, EC2 런타임에서 사용할 환경변수는 **서버에 별도로 존재**해야 합니다.

> ✅ 현재 운영(ln-web)은 **PM2가 아니라 Docker Compose**로 유저/파트너/CMS를 실행 중인 것으로 확인되었습니다.
> - user: `aiaracorp1/likenovel-user:production` (port 3000)
> - partner: `aiaracorp1/likenovel-partner:prod` (port 3001)
> - cms: `aiaracorp1/likenovel-admin:production` (port 3002)
>
> 운영 서버에서 `ls -la .env*`가 비어 있는 것은 **정상**일 수 있습니다(이미지 빌드 시점에 `NEXT_PUBLIC_*` 값이 고정되거나, 컨테이너 내부 `.env.production` 파일로 로드되는 구조일 수 있음).

#### 5.1) 운영 폴더에 `.env*` 파일이 없을 때(외주에서 자주 하는 방식)
운영 서버에서 아래처럼 `.env*`가 없다면:

```bash
cd /home/ln-admin/likenovel/service
ls -la .env*
```

이 섹션은 오래된 PM2 기반 troubleshooting을 포함한다. 현재 ln-web 표준은 Docker Compose이므로 먼저 Docker/container 상태를 확인하고, PM2는 legacy 프로세스가 실제로 살아 있다는 readback이 있을 때만 본다.

Docker Compose 기준 확인:

```bash
sudo docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"
sudo docker inspect <container> --format '{{ index .Config.Labels "com.docker.compose.project.config_files" }}'
```

Legacy PM2 확인이 필요한 경우에만:

```bash
pm2 list
```

PM2에 프로세스가 보이면, `pm2 list`에서 나온 **name 또는 id**를 사용해서 확인합니다(시크릿이 출력될 수 있으니 캡처/공유 주의):

```bash
pm2 describe <name-or-id>
pm2 env <id> | grep -E "NEXT_PUBLIC_|API_SERVER_URI|IRON_SESSION|NICE_"
```

PM2가 비어 있으면 현재 표준 Docker 경로일 가능성이 높다. 어떤 프로세스가 포트를 잡고 있는지부터 확인하세요:

```bash
sudo ss -ltnp | egrep ':(80|443|3000|3001|3002)\b'
```

`docker-proxy`가 잡혀 있으면 Docker 기반입니다. 이 경우 위 Docker Compose file readback을 우선합니다.

> `pm2 restart`만 하면 기존 env를 그대로 유지합니다.  
> env를 바꿔야 하면 “어디에 env를 저장할지(파일 vs PM2)” 전략을 먼저 정하고 적용하세요.

#### 5.2) dev(스테이징) 첫 배포 전 체크
dev는 `/home/ln-admin/likenovel/service-dev`로 분리되어 있고, **최초 실행 시** `service-dev/.env.production`이 없으면 앱이 정상 동작하지 않습니다.  
그래서 `service/run_fe_dev.sh`는 **최초 실행 때 env 파일이 없으면 배포를 실패시키도록** 방어 로직이 들어있습니다.

dev 서버에 아래 파일을 **수동으로** 만들어 두세요(커밋 금지, 권한 최소화 권장):

```bash
cd /home/ln-admin/likenovel/service-dev
touch .env.production
chmod 600 .env.production
```

내용은 `service/ENV.example`를 기준으로, dev 도메인(`likenovel.dev`) 값을 채우면 됩니다.
