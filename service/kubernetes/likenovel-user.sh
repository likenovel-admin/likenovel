kubectl apply -f services/likenovel/user/likenovel-user-k8s.yaml
kubectl rollout restart deployment likenovel-user-service