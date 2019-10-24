
deploy-kubeapps: ${KUBECONFIG}
	kubectl apply -f ./docs/user/manifests/kubeapps-local-dev-rbac.yaml
	helm init --service-account tiller --wait
	helm install ./chart/kubeapps --namespace kubeapps --name kubeapps \
		--values ./docs/user/manifests/kubeapps-local-dev-values.yaml

# TODO: Update to use kubectl apply by generating the output with helm once and applying it for subsequent calls.
# TODO: Update dex installation to use a generated cert
deploy-kubeapps-oidc: ${KUBECONFIG}
	kubectl apply -f ./docs/user/manifests/kubeapps-local-dev-rbac.yaml
	helm init --service-account tiller --wait
	helm install stable/dex --namespace dex --name dex \
		--values ./docs/user/manifests/kubeapps-local-dev-dex-values.yaml
	helm install ./chart/kubeapps --namespace kubeapps --name kubeapps \
		--values ./docs/user/manifests/kubeapps-local-dev-values.yaml \
		--values ./docs/user/manifests/kubeapps-local-dev-auth-proxy-values.yaml
	@echo "Success!"
	@echo "Ensure you follow the notes to expose dex (the identity provider):"
