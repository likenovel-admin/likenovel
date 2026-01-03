---
description: Setup CI/CD for NestJS back-end services at Aiara (Dockerfile, pipelines, scripts)
---

This is step by step ci/cd setup, cclime-backend-renewal is the project name, please replace it with user's prompt
Refer to the environment and handle properly, default development, user can prompt staging or production (rare case)

How to setup CI/CD for cclime-backend-renewal
This guide provides a step-by-step CI/CD setup for the cclime-backend-renewal project. These instructions can be adapted for development, staging, or production environments.

1. Bitbucket Pipelines
   Create or update your
   bitbucket-pipelines.yml
   file with the following configuration:

yaml
image: atlassian/default-image:3

options:
size: 4x
definitions:
services:
docker:
memory: 5120

pipelines:
branches:
main: - step:
name: Build and Push Docker Image
script: - echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USERNAME" --password-stdin - docker build --no-cache --rm -f Dockerfile -t aiaracorp1/cclime-backend-renewal:latest . - docker push aiaracorp1/cclime-backend-renewal:latest
services: - docker
caches: - docker

      - step:
          name: Deploy to Production
          deployment: Production
          script:
            - chmod 400 aiaracorp.pem
            - ssh-keyscan $AIARA_IP >> ~/.ssh/known_hosts
            - scp -i aiaracorp.pem -r ./kubernetes/* aiara@$AIARA_IP:/home/aiara/service/cclime/rn-was
            - ssh -i aiaracorp.pem aiara@$AIARA_IP "export KUBECONFIG=/etc/rancher/k3s/k3s.yaml && sh -f service/cclime/rn-was/cclime-backend-renewal.sh"
            - echo 'DONE DEPLOY LIVE'
          services:
            - docker
          when: on_success

      - step:
          name: Send Slack Notification - Deploy End
          script:
            - echo "Send Slack Notification with CURL - Deploy End"
            - curl --location "https://slack.aiaracorp.com/api/v1/deploy" --header "Content-Type:application/json" --data '{"name":"끌리메 - ADMIN","code":"KFMOA","message":"CCLIME-ADMIN-BACKEND 배포가 완료되었습니다."}'

    # Optional: Add a staging branch pipeline for staging deployments
    staging:
      - step:
          name: Build and Push Docker Image (Staging)
          script:
            - echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USERNAME" --password-stdin
            - docker build --no-cache --rm -f Dockerfile -t aiaracorp1/cclime-backend-renewal:staging --build-arg NODE_ENV=staging .
            - docker push aiaracorp1/cclime-backend-renewal:staging
          services:
            - docker
          caches:
            - docker

      - step:
          name: Deploy to Staging
          deployment: Staging
          script:
            - echo -e "$AIARACORP_PEM" > aiaracorp.pem
            - chmod 400 aiaracorp.pem
            - ssh-keyscan $AIARA_IP >> ~/.ssh/known_hosts
            - scp -i aiaracorp.pem -r ./kubernetes/* aiara@$AIARA_IP:/home/aiara/service/cclime/rn-was-stg
            - ssh -i aiaracorp.pem aiara@$AIARA_IP "export KUBECONFIG=/etc/rancher/k3s/k3s.yaml && sh -f service/cclime/rn-was-stg/cclime-back-end-stg.sh"
            - echo 'DONE DEPLOY STAGING'
          services:
            - docker
          when: on_success

      - step:
          name: Send Slack Notification - Deploy End (Staging)
          script:
            - echo "Send Slack Notification with CURL - Deploy End"
            - curl --location "https://slack.aiaracorp.com/api/v1/deploy" --header "Content-Type:application/json" --data '{"name":"끌리메 - ADMIN","code":"KFMOA","message":"CCLIME-ADMIN-BACKEND STAGING 배포가 완료되었습니다."}'

2. Dockerfile
   Create or update your
   Dockerfile
   with the following configuration for a NestJS backend using Yarn:

Dockerfile
FROM node:21-alpine AS base

# Install pnpm

RUN npm install -g pnpm

FROM base AS dependencies

WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

FROM base AS build
WORKDIR /app

COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN pnpm build

FROM base AS prod

WORKDIR /app

# Use build arg to set environment (defaults to development)

ARG NODE_ENV=development
ENV NODE_ENV ${NODE_ENV}

COPY --from=build /app .

RUN touch /app/ormlogs.log && chown node:node /app/ormlogs.log

USER node

EXPOSE 8000

ENV PORT 8000

CMD ["node", "dist/main"]

3. Kubernetes Configuration
   Production Environment
   Create the following files in the kubernetes directory:

cclime-backend-renewal.yaml
yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
labels:
app: cclime-backend-renewal
name: cclime-backend-renewal
spec:
replicas: 1
selector:
matchLabels:
app: cclime-backend-renewal
template:
metadata:
labels:
app: cclime-backend-renewal
spec:
containers: - name: cclime-backend-renewal
env: - name: TZ
value: Asia/Seoul
image: aiaracorp1/cclime-backend-renewal:latest
ports: - containerPort: 8080
cclime-backend-renewal-service.yaml
yaml
apiVersion: v1
kind: Service
metadata:
labels:
app: cclime-backend-renewal
name: cclime-backend-renewal-service
spec:
type: NodePort
selector:
app: cclime-backend-renewal
ports: - port: 8033
targetPort: 8080
cclime-backend-renewal.sh
bash
kubectl delete -f service/cclime/rn-was/cclime-backend-renewal.yaml

sleep 10

echo aiara8282 | sudo -S k3s crictl rmi --prune
kubectl apply -f service/cclime/rn-was/cclime-backend-renewal.yaml
kubectl apply -f service/cclime/rn-was/cclime-backend-renewal-service.yaml
Staging Environment
cclime-backend-stg.yaml
yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
labels:
app: cclime-backend-stg
name: cclime-backend-stg
spec:
replicas: 1
selector:
matchLabels:
app: cclime-backend-stg
template:
metadata:
labels:
app: cclime-backend-stg
spec:
containers: - name: cclime-backend-stg
env: - name: TZ
value: Asia/Seoul
image: aiaracorp1/cclime-backend-renewal:staging
ports: - containerPort: 8080
cclime-backend-stg-service.yaml
yaml
apiVersion: v1
kind: Service
metadata:
labels:
app: cclime-backend-stg
name: cclime-backend-stg-service
spec:
type: NodePort
selector:
app: cclime-backend-stg
ports: - port: 8034
targetPort: 8080
cclime-back-end-stg.sh
bash
kubectl delete -f service/cclime/rn-was-stg/cclime-backend-stg.yaml

sleep 10

echo aiara8282 | sudo -S k3s crictl rmi --prune
kubectl apply -f service/cclime/rn-was-stg/cclime-backend-stg.yaml
kubectl apply -f service/cclime/rn-was-stg/cclime-backend-stg-service.yaml
