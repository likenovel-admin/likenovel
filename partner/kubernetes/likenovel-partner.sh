#!/bin/bash

kubectl apply -f services/likenovel/partner/likenovel-partner-deployment.yaml
kubectl rollout restart deployment likenovel-partner
kubectl apply -f services/likenovel/partner/likenovel-partner-service.yaml
