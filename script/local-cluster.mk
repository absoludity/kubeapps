KUBE ?= ${HOME}/.kube
CLUSTER_NAME ?= kubeapps
CLUSTER_NAME_OIDC ?= kubeapps-oidc

CLUSTER_CONFIG = ${KUBE}/kind-config-${CLUSTER_NAME}
CLUSTER_CONFIG_OIDC = ${KUBE}/kind-config-${CLUSTER_NAME_OIDC}
# TODO (absoludity): make always considers a prerequisite new if it's the result of a shell, it seems?
# CLUSTER_CONFIG= "$(shell kind get kubeconfig-path --name=${CLUSTER_NAME})"

${CLUSTER_CONFIG}:
	kind create cluster --name ${CLUSTER_NAME}
local-cluster: ${CLUSTER_CONFIG}
local-cluster-delete:
	kind delete cluster --name ${CLUSTER_NAME}

${CLUSTER_CONFIG_OIDC}:
	# TODO: control-plane failing to start, need to debug and see if it's related to the extra config. First try without config.
	kind create cluster --name ${CLUSTER_NAME_OIDC} --config=./docs/user/manifests/kubeapps-local-dev-oidc-apiserver.yaml
local-cluster-oidc: ${CLUSTER_CONFIG_OIDC}
local-cluster-oidc-delete:
	kind delete cluster --name ${CLUSTER_NAME_OIDC}

local-kubeapps: ${CLUSTER_CONFIG}
	kubectl --kubeconfig=${CLUSTER_CONFIG} apply -f ./docs/user/manifests/kubeapps-local-dev-rbac.yaml
	helm --kubeconfig=${CLUSTER_CONFIG} init --service-account tiller --wait
	helm --kubeconfig=${CLUSTER_CONFIG} install ./chart/kubeapps --namespace kubeapps --name kubeapps \
		--values ./docs/user/manifests/kubeapps-local-dev-values.yaml
	echo "Ensure you first export KUBECONFIG=${CLUSTER_CONFIG}"

# TODO: Investigate possibility of using kubectl apply by generating the output with helm once and applying it for subsequent calls?
local-kubeapps-oidc: ${CLUSTER_CONFIG_OIDC}
	kubectl --kubeconfig=${CLUSTER_CONFIG_OIDC} apply -f ./docs/user/manifests/kubeapps-local-dev-rbac.yaml
	helm --kubeconfig=${CLUSTER_CONFIG_OIDC} init --service-account tiller --wait
	helm --kubeconfig=${CLUSTER_CONFIG_OIDC} install stable/dex --namespace dex --name dex \
		--values ./docs/user/manifests/kubeapps-local-dev-dex-values.yaml
	helm --kubeconfig=${CLUSTER_CONFIG_OIDC} install ./chart/kubeapps --namespace kubeapps --name kubeapps \
		--values ./docs/user/manifests/kubeapps-local-dev-values.yaml \
		--values ./docs/user/manifests/kubeapps-local-dev-auth-proxy-values.yaml
	@echo "Success!"
	@echo "Ensure you first export KUBECONFIG=${CLUSTER_CONFIG}, and then follow the notes to expose dex (the identity provider):"

.PHONY: local-cluster local-cluster-oidc local-cluster-delete local-helm local-kubeapps