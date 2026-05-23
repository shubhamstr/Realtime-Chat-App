/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { logIn, setDetails } from '../../store/authSlice';
// eslint-disable-next-line no-unused-vars
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import validate from 'validate.js';
import { jwtDecode } from 'jwt-decode';
import { makeStyles } from '@material-ui/styles';
import axiosClient from '../../api/api-client';
import { signInApi } from '../../api/auth';
import { Button, TextField, Typography } from '@material-ui/core';

const BASE_URL = process.env.REACT_APP_BASE_URL;
console.log(BASE_URL, 'BASE_URL');

const schema = {
  userName: {
    presence: { allowEmpty: false, message: 'is required' },
    length: {
      maximum: 64
    }
  }
};

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.background.default,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(2)
  },
  form: {
    width: '100%',
    maxWidth: 400
  },
  title: {
    marginBottom: theme.spacing(1),
    textAlign: 'center'
  },
  subTitle: {
    marginTop: theme.spacing(1),
    textAlign: 'center'
  },
  sugestion: {
    marginTop: theme.spacing(2),
    textAlign: 'center'
  },
  textField: {
    marginTop: theme.spacing(2)
  },
  logInButton: {
    margin: theme.spacing(2, 0)
  }
}));

const LogIn = props => {
  const url = window.location.pathname.split('/')[2];
  const dispatch = useDispatch();
  const socket = io(BASE_URL, { transports: ['websocket'] });

  const { history } = props;

  const classes = useStyles();

  const [formStateUserName, setFormStateUserName] = useState({
    isValid: false,
    values: {},
    touched: {},
    errors: {}
  });

  const handleChangeUserName = event => {
    event.persist();

    setFormStateUserName(formStateUserName => ({
      ...formStateUserName,
      values: {
        ...formStateUserName.values,
        [event.target.name]:
          event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value
      },
      touched: {
        ...formStateUserName.touched,
        [event.target.name]: true
      }
    }));
  };

  const setHeaderToken = token => {
    axiosClient.defaults.headers.common.Authorization = token;
  };

  const setToken = userToken => {
    localStorage.setItem('chatToken', userToken);
  };

  const handleLogIn = async (event, type) => {
    event.preventDefault();
    // eslint-disable-next-line no-console
    console.log('handleLogIn', type, formStateUserName.values.userName);
    const payload = {
      loginType: type,
      userName: formStateUserName.values.userName
    };
    if (url && url.length) {
      payload['room_id'] = url;
    }
    const resp = await signInApi(payload);
    if (resp.data.err) {
      alert(resp.data.msg);
    } else {
      socket.emit('connected', formStateUserName.values.userName);
      setHeaderToken(resp.data.data);
      setToken(resp.data.data);
      localStorage.setItem('chatURL', resp.data.chatURL);
      const tokenDetails = jwtDecode(resp.data.data);
      dispatch(
        setDetails({
          type: 'userType',
          value: 'user'
        })
      );
      dispatch(
        setDetails({
          type: 'tokenDetails',
          value: tokenDetails
        })
      );
      dispatch(logIn());
      history.push(`/chat/${resp.data.chatURL}`);
    }
  };

  const hasErrorUserName = field =>
    formStateUserName.touched[field] && formStateUserName.errors[field]
      ? true
      : false;

  useEffect(() => {
    const errors = validate(formStateUserName.values, schema);

    setFormStateUserName(formStateUserName => ({
      ...formStateUserName,
      isValid: errors ? false : true,
      errors: errors || {}
    }));
  }, [formStateUserName.values]);

  return (
    <div className={classes.root}>
      <form className={classes.form}>
        <Typography className={classes.title} variant="h2">
          Log in
        </Typography>
        {url && url.length && (
          <Typography className={classes.subTitle} variant="h6">
            {`Room ID - ${url}`}
          </Typography>
        )}
        <Typography
          className={classes.sugestion}
          color="textSecondary"
          variant="body1">
          Log in with User Name
        </Typography>
        <TextField
          className={classes.textField}
          error={hasErrorUserName('userName')}
          fullWidth
          helperText={
            hasErrorUserName('userName')
              ? formStateUserName.errors.userName[0]
              : null
          }
          label="User Name"
          name="userName"
          onChange={handleChangeUserName}
          type="text"
          value={formStateUserName.values.userName || ''}
          variant="outlined"
        />
        <Button
          className={classes.logInButton}
          color="primary"
          disabled={!formStateUserName.isValid}
          fullWidth
          onClick={e => handleLogIn(e, 'userName')}
          size="large"
          type="submit"
          variant="contained">
          Log in
        </Button>
      </form>
    </div>
  );
};

LogIn.propTypes = {
  history: PropTypes.object
};

export default withRouter(LogIn);
