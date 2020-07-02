import { shallow } from "enzyme";
import { Location } from "history";
import * as React from "react";
import { IAuthState } from "reducers/auth";
import { IClustersState } from "reducers/cluster";
import { IConfigState } from "reducers/config";
import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import LoginForm from "./LoginFormContainer";

const mockStore = configureMockStore([thunk]);

const makeStore = (
  sessionExpired: boolean,
  authenticated: boolean,
  authenticating: boolean,
  oidcAuthenticated: boolean,
  authenticationError: string,
  defaultNamespace: string,
  authProxyEnabled: boolean,
  oauthLoginURI: string,
) => {
  const auth: IAuthState = {
    sessionExpired,
    authenticated,
    authenticating,
    oidcAuthenticated,
    authenticationError,
    defaultNamespace,
  };
  const config: IConfigState = {
    authProxyEnabled,
    oauthLoginURI,
    loaded: true,
    namespace: "",
    appVersion: "",
    oauthLogoutURI: "",
    featureFlags: { operators: false, additionalClusters: [], ui: "hex" },
  };
  const clusters: IClustersState = {
    currentCluster: "default",
    clusters: {
      default: {
        currentNamespace: "default",
        namespaces: [],
      },
    },
  };
  return mockStore({ auth, config, clusters });
};

const emptyLocation: Location = {
  hash: "",
  pathname: "",
  search: "",
  state: "",
};

describe("LoginFormContainer props", () => {
  it("maps authentication redux states to props", () => {
    const authProxyEnabled = true;
    const store = makeStore(
      true,
      true,
      true,
      true,
      "It's a trap",
      "",
      authProxyEnabled,
      "/myoauth/start",
    );
    const wrapper = shallow(<LoginForm store={store} location={emptyLocation} />);
    const form = wrapper.find("LoginForm");
    expect(form).toHaveProp({
      authenticated: true,
      authenticating: true,
      authenticationError: "It's a trap",
      oauthLoginURI: "/myoauth/start",
    });
  });

  it("does not receive oauthLoginURI if authProxyEnabled is false", () => {
    const authProxyEnabled = false;
    const store = makeStore(
      true,
      true,
      true,
      true,
      "It's a trap",
      "",
      authProxyEnabled,
      "/myoauth/start",
    );
    const wrapper = shallow(<LoginForm store={store} location={emptyLocation} />);
    const form = wrapper.find("LoginForm");
    expect(form).toHaveProp({
      authenticated: true,
      authenticating: true,
      authenticationError: "It's a trap",
      oauthLoginURI: "",
    });
  });
});
