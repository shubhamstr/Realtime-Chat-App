import React, { Component } from 'react';
import { Router } from 'react-router-dom';
import { connect } from 'react-redux';
import { createBrowserHistory } from 'history';
import propTypes from 'prop-types';
import { jwtDecode } from 'jwt-decode';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import axiosClient from './api/api-client';

import './assets/index.css';
import Routes from './Routes';
import { logIn, setDetails } from './store/authSlice';

const browserHistory = createBrowserHistory();
const theme = createMuiTheme({
  palette: {
    background: {
      default: '#f8fafc'
    },
    primary: {
      main: '#2563eb'
    }
  }
});

class App extends Component {
  setHeaderToken = token => {
    axiosClient.defaults.headers.common.Authorization = token;
  };

  checkAuthAndRedirect = () => {
    const token = localStorage.getItem('chatToken');
    const chatURL = localStorage.getItem('chatURL');
    if (token && token !== 'undefined' && token !== 'null') {
      this.setHeaderToken(token);
      const tokenDetails = jwtDecode(token);
      this.props.setDetails({
        type: 'userType',
        value: 'user'
      });
      this.props.setDetails({
        type: 'tokenDetails',
        value: tokenDetails
      });
      this.props.logIn();
      browserHistory.push(`/chat/${chatURL}`);
    }
  };

  componentDidMount() {
    this.checkAuthAndRedirect();
  }

  render() {
    return (
      <ThemeProvider theme={theme}>
        <Router history={browserHistory}>
          <Routes />
        </Router>
      </ThemeProvider>
    );
  }
}

App.propTypes = {
  logIn: propTypes.func,
  setDetails: propTypes.func
};

const mapDispatchToProps = {
  logIn,
  setDetails
};

export default connect(
  null,
  mapDispatchToProps
)(App);
