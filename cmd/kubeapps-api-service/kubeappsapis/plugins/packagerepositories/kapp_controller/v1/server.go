package v1

import (
	"context"
	"fmt"

	// v1 "github.com/kubeapps/kubeapps/cmd/kubeapps-api-service/kubeappsapis/core/packagerepositories/v1"
	// *sigh*, seems different versions of the k8s client.go (at the time of writing, kapp-controller
	// is using client-go v0.19.2) means that we can't use the client here directly, as get errors like:
	/*
				gitub.com/vmware-tanzu/carvel-kapp-controller@v0.18.0/pkg/client/clientset/versioned/typed/kappctrl/v1alpha1/app.go:58:5: not enough arguments in call to c.client.Get().Namespace(c.ns).Resource("apps").Name(name).VersionedParams(&options, scheme.ParameterCodec).Do
		        have ()
		        want (context.Context)
	*/
	// So instead we use the dynamic (untyped) client.
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"

	v1 "github.com/kubeapps/kubeapps/cmd/kubeapps-api-service/kubeappsapis/core/packagerepositories/v1"
	"k8s.io/client-go/rest"
)

// Server implements the helm packages v1 interface.
type Server struct {
	UnimplementedPackageRepositoriesServiceServer
}

// GetAvailablePackages streams the available packages based on the request.
func (s *Server) GetAvailablePackages(request *v1.GetAvailablePackagesRequest, stream PackageRepositoriesService_GetAvailablePackagesServer) error {
	// TODO: replace incluster config with the user config using token from request meta.
	config, err := rest.InClusterConfig()
	if err != nil {
		return fmt.Errorf("unable to create incluster config: %w", err)
	}

	client, err := dynamic.NewForConfig(config)
	if err != nil {
		return fmt.Errorf("unable to create dynamic client: %w", err)
	}

	PackageResource := schema.GroupVersionResource{Group: "kappctrl.k14s.io", Version: "v1alpha1", Resource: "packages"}

	pkgs, err := client.Resource(PackageResource).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return fmt.Errorf("unable to list kapp-controller packages: %w", err)
	}

	for _, pkgUnstructured := range pkgs.Items {
		pkg := &v1.AvailablePackage{}
		name, found, err := unstructured.NestedString(pkgUnstructured.Object, "spec", "publicName")
		if err != nil || !found {
			return fmt.Errorf("required field publicName not found on kapp-controller package: %w:\n%v", err, pkgUnstructured.Object)
		}
		pkg.Name = name

		version, found, err := unstructured.NestedString(pkgUnstructured.Object, "spec", "version")
		if err != nil || !found {
			return fmt.Errorf("required field version not found on kapp-controller package: %w:\n%v", err, pkgUnstructured.Object)
		}
		pkg.LatestVersion = version
		stream.Send(&v1.AvailablePackage{
			Name: pkg.Name,
		})
	}
	return nil
}
