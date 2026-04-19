import React from 'react';
import { Switch, Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { RouteWithLayout, PrivateRouteWithLayout } from './components';
import { Minimal as MinimalLayout } from './layouts';

import { Chat as ChatView, LogIn as LogInView } from './views';

const Routes = () => {
  const auth = useSelector(state => state.auth);
  const chatURL = localStorage.getItem('chatURL');
  return (
    <Switch>
      <Redirect
        exact
        from="/"
        to={auth.isLoggedIn ? `/chat/${chatURL}` : 'login'}
      />
      <RouteWithLayout
        component={LogInView}
        exact
        layout={MinimalLayout}
        path="/login"
      />
      <RouteWithLayout
        component={LogInView}
        exact
        layout={MinimalLayout}
        path="/login/:url"
      />

      <PrivateRouteWithLayout
        component={ChatView}
        exact
        layout={MinimalLayout}
        path="/chat/:url"
      />
    </Switch>
  );
};

export default Routes;
