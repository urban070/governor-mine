import React, { Component, Suspense, lazy } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Loader from "./loader";

// ROUTES
import OnPageChange from "../utilities/hocs/OnPageChange";

// HEADER & FOOTER
import Header from "../components/header/Header";

// LAZY IMPORT
const Farm = lazy(() => import("../components/farm"));

class Routes extends Component {
  render() {
    return (
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <OnPageChange>
            <Header />
            <Switch>
              <Route exact path={"/"} render={() => <Farm {...this.props} />} />
              <Route
                component={() => {
                  window.location.href = "https://governordao.org";
                  return null;
                }}
              />
            </Switch>
          </OnPageChange>
        </Suspense>
      </BrowserRouter>
    );
  }
}

export default Routes;
