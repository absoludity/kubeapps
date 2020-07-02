import { Kube } from "./Kube";
import ResourceRef, { fromCRD } from "./ResourceRef";
import { IClusterServiceVersionCRDResource, IResource } from "./types";

describe("ResourceRef", () => {
  describe("constructor", () => {
    it("it returns a ResourceRef with the correct details", () => {
      const r = {
        cluster: "default",
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: {
          name: "foo",
          namespace: "bar",
        },
      } as IResource;

      const ref = new ResourceRef(r);
      expect(ref).toBeInstanceOf(ResourceRef);
      expect(ref).toEqual({
        cluster: r.cluster,
        apiVersion: r.apiVersion,
        kind: r.kind,
        name: r.metadata.name,
        namespace: r.metadata.namespace,
      });
    });

    it("sets a default namespace if not in the resource", () => {
      const r = {
        cluster: "default",
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: {
          name: "foo",
        },
      } as IResource;

      const ref = new ResourceRef(r, "default");
      expect(ref.namespace).toBe("default");
    });

    it("allows the default namespace to be provided", () => {
      const r = {
        cluster: "default",
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: {
          name: "foo",
        },
      } as IResource;

      const ref = new ResourceRef(r, "bar");
      expect(ref.namespace).toBe("bar");
    });

    describe("fromCRD", () => {
      it("creates a resource ref with ownerReference", () => {
        const r = {
          cluster: "default",
          kind: "Deployment",
          name: "",
          version: "",
        } as IClusterServiceVersionCRDResource;
        const ownerRef = {
          metadata: {
            name: "test",
          },
        };
        const res = fromCRD(r, "default", ownerRef);
        expect(res).toMatchObject({
          apiVersion: "apps/v1",
          kind: "Deployment",
          name: undefined,
          namespace: "default",
          filter: { metadata: { ownerReferences: [ownerRef] } },
        });
      });

      it("skips the namespace for a non namespaced element", () => {
        const r = {
          kind: "ClusterRole",
          name: "",
          version: "",
        } as IClusterServiceVersionCRDResource;
        const ownerRef = {
          metadata: {
            name: "test",
          },
        };
        const res = fromCRD(r, "default", ownerRef);
        expect(res).toMatchObject({
          apiVersion: "rbac.authorization.k8s.io/v1",
          kind: "ClusterRole",
          name: undefined,
          namespace: "",
          filter: { metadata: { ownerReferences: [ownerRef] } },
        });
      });
    });
  });

  describe("getResourceURL", () => {
    let kubeGetResourceURLMock: jest.Mock;
    beforeEach(() => {
      kubeGetResourceURLMock = jest.fn();
      Kube.getResourceURL = kubeGetResourceURLMock;
    });
    afterEach(() => {
      jest.resetAllMocks();
    });
    it("calls Kube.getResourceURL with the correct arguments", () => {
      const r = {
        cluster: "default",
        apiVersion: "v1",
        kind: "Service",
        metadata: {
          name: "foo",
          namespace: "bar",
        },
      } as IResource;

      const ref = new ResourceRef(r);

      ref.getResourceURL();
      expect(kubeGetResourceURLMock).toBeCalledWith("default", "v1", "services", "bar", "foo");
    });
  });

  describe("watchResourceURL", () => {
    let kubeWatchResourceURLMock: jest.Mock;
    beforeEach(() => {
      kubeWatchResourceURLMock = jest.fn();
      Kube.watchResourceURL = kubeWatchResourceURLMock;
    });
    afterEach(() => {
      jest.resetAllMocks();
    });
    it("calls Kube.watchResourceURL with the correct arguments", () => {
      const r = {
        cluster: "default",
        apiVersion: "v1",
        kind: "Service",
        metadata: {
          name: "foo",
          namespace: "bar",
        },
      } as IResource;

      const ref = new ResourceRef(r);

      ref.watchResourceURL();
      expect(kubeWatchResourceURLMock).toBeCalledWith("default", "v1", "services", "bar", "foo");
    });
  });

  describe("getResource", () => {
    let kubeGetResourceMock: jest.Mock;
    beforeEach(() => {
      kubeGetResourceMock = jest.fn(() => {
        return { metadata: { name: "foo" } };
      });
      Kube.getResource = kubeGetResourceMock;
    });
    afterEach(() => {
      jest.resetAllMocks();
    });
    it("calls Kube.getResource with the correct arguments", () => {
      const r = {
        cluster: "default",
        apiVersion: "v1",
        kind: "Service",
        metadata: {
          name: "foo",
          namespace: "bar",
        },
      } as IResource;

      const ref = new ResourceRef(r);

      ref.getResource();
      expect(kubeGetResourceMock).toBeCalledWith("default", "v1", "services", "bar", "foo");
    });

    it("filters out the result when receiving a list", async () => {
      const r = {
        apiVersion: "v1",
        kind: "Service",
        metadata: {
          name: "foo",
          namespace: "bar",
        },
      } as IResource;

      const ref = new ResourceRef(r);
      ref.filter = { metadata: { name: "bar" } };
      Kube.getResource = jest.fn().mockReturnValue({
        items: [r],
      });
      const res = await ref.getResource();
      expect(res).toEqual({ items: [] });
    });
  });

  describe("watchResource", () => {
    let kubeWatchResourceMock: jest.Mock;
    beforeEach(() => {
      kubeWatchResourceMock = jest.fn();
      Kube.watchResource = kubeWatchResourceMock;
    });
    afterEach(() => {
      jest.resetAllMocks();
    });
    it("calls Kube.watchResource with the correct arguments", () => {
      const r = {
        apiVersion: "v1",
        kind: "Service",
        metadata: {
          name: "foo",
          namespace: "bar",
        },
      } as IResource;

      const ref = new ResourceRef(r);

      ref.watchResource();
      expect(kubeWatchResourceMock).toBeCalledWith("v1", "services", "bar", "foo");
    });
  });
});
