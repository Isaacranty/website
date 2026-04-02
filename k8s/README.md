# Kubernetes Deployment (Polyglot Website)

This folder contains Kubernetes manifest examples to run the app cluster in Kubernetes.

## Apply manifests

```bash
kubectl apply -f k8s/base
```

## Cleanup

```bash
kubectl delete -f k8s/base
```

## Access

- Frontend via Traefik ingress host `polyglot.local` (update local /etc/hosts to point to minikube/Docker Desktop IP)
- Health endpoints:
  - `http://polyglot.local/api/node/status`
  - `http://polyglot.local/api/python/status`
  - `http://polyglot.local/api/go/status`
  - `http://polyglot.local/api/php/status`
