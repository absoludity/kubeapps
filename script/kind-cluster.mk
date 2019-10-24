KUBE ?= ${HOME}/.kube
CLUSTER_NAME ?= kubeapps
CLUSTER_NAME_OIDC ?= kubeapps-oidc

CLUSTER_CONFIG = ${KUBE}/kind-config-${CLUSTER_NAME}
CLUSTER_CONFIG_OIDC = ${KUBE}/kind-config-${CLUSTER_NAME_OIDC}

${CLUSTER_CONFIG}:
	kind create cluster --name ${CLUSTER_NAME}
cluster-kind: ${CLUSTER_CONFIG}
	@echo 'Ensure that you run:'
	@echo 'export KUBECONFIG="$$(kind get kubeconfig-path --name="kubeapps")"'
delete-cluster-kind:
	kind delete cluster --name ${CLUSTER_NAME}

${CLUSTER_CONFIG_OIDC}:
	# TODO: Need to update the yaml to include the ca-file and figure out how
	# to get the CA file accessible to the api server. See the following for options.
	# https://github.com/dexidp/dex/blob/master/Documentation/kubernetes.md#configure-the-api-server
	kind create cluster --name ${CLUSTER_NAME_OIDC} --loglevel debug --config=./docs/user/manifests/kubeapps-local-dev-oidc-apiserver.yaml
cluster-kind-oidc: ${CLUSTER_CONFIG_OIDC}
delete-cluster-kind-oidc:
	kind delete cluster --name ${CLUSTER_NAME_OIDC}

.PHONY: cluster-kind cluster-kind-oidc cluster-kind-delete local-helm local-kubeapps