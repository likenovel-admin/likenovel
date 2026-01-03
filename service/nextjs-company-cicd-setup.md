---
description: How to setup CI/CD (Bitbucket pipelines, Dockerfile, deploy scripts)
auto_execution_mode: 1
---

This is step by step ci/cd setup, cclime-backend-renewal is the project name, please replace it with user's prompt
Refer to the environment and handle properly, default development, user can prompt staging or production (rare case)

## 1. Bitbucket pipelines

file: bitbucket-pipelines.yml:

````yaml
image: atlassian/default-image:3

options:
  size: 2x
definitions:
  services:
    docker:
      memory: 5120

pipelines:
  branches:
    develop:
      - step:
          size: 4x
          name: Build and Test
          script:
            - echo "Docker Build and Push"
            - echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USERNAME" --password-stdin
            - docker build --no-cache --rm -f Dockerfile -t aiaracorp1/cclime-admin:latest .
            - docker push aiaracorp1/cclime-admin:latest
          services:
            - docker
          caches:
            - docker
          when: on_success

      - step:
          name: Deploy to Production
          deployment: Production
          script:
            - echo -e "$AIARACORP_PEM" > aiaracorp.pem
            - chmod 400 aiaracorp.pem
            - ssh-keyscan $AIARA_IP >> ~/.ssh/known_hosts
            - scp -i aiaracorp.pem -r ./kubernetes/* aiara@$AIARA_IP:/home/aiara/service/cclime/cms
            - ssh -i aiaracorp.pem aiara@$AIARA_IP "export KUBECONFIG=/etc/rancher/k3s/k3s.yaml && sh -f service/cclime/cms/cclime.sh"
            - echo 'DONE DEPLOY LIVE'
          services:
            - docker
          when: on_success

## 2. Dockerfile

Refer to user prompt about the package manager project is using: npm, pnpm or yarn; Be aware of lockfile in the project, which one is correct to use, check if corepack is using for the project and edit or make properly dockerfile.


Front-end NextJS:

```Dockerfile
FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./

RUN corepack enable

#----
FROM base AS deps

RUN apk add libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

#----
FROM base AS build

WORKDIR /app

ARG GENERATE_SOURCEMAP=false
ARG NODE_OPTIONS=--max-old-space-size=16384

COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY .env.development .env.production

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
````

## 3. .dockerignore

Create a .dockerignore file to exclude unnecessary files from the Docker build context:

```
node_modules
.git
.gitignore
*.md
dist
.env.local
.env.development.local
.env.test.local
.env.production.local
npm-debug.log*
```

## k8s and scripts:

put files under kubernestes folder in project

cclime-cms-service.yaml:

```yaml
apiVersion: v1
kind: Service
metadata:
  labels:
    app: cclime-admin
  name: cclime-admin-service
spec:
  type: NodePort
  selector:
    app: cclime-admin
  ports:
    - port: 3039
      targetPort: 3000
```

cclime-cms-deployment.yaml:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  # labels:
  #   app: cclime-admin
  name: cclime-admin
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cclime-admin
  template:
    metadata:
      labels:
        app: cclime-admin
    spec:
      containers:
        - name: cclime-admin
          image: aiaracorp1/cclime-admin:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
```

cclime.sh:

```bash
kubectl apply -f service/cclime/cms/cclime-cms-deployment.yaml
kubectl rollout restart deployment cclime-admin
kubectl apply -f service/cclime/cms/cclime-cms-service.yaml
```
