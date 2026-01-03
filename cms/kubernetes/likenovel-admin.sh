#!/usr/bin/env sh
# set -euo pipefail

# Apply Deployment and Service, then restart deployment to pick up the latest image
kubectl apply -f services/likenovel/admin/likenovel-admin-deployment.yaml
kubectl rollout restart deployment likenovel-admin
kubectl apply -f services/likenovel/admin/likenovel-admin-service.yaml
