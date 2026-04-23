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
import { Grid, Button, TextField, Typography } from '@material-ui/core';

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
    height: '100%'
  },
  grid: {
    height: '100%'
  },
  quoteContainer: {
    [theme.breakpoints.down('md')]: {
      display: 'none'
    }
  },
  quote: {
    backgroundColor: theme.palette.neutral,
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundImage: 'url(/images/auth.jpg)',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center'
  },
  quoteInner: {
    textAlign: 'center',
    flexBasis: '600px'
  },
  quoteText: {
    color: theme.palette.white,
    fontWeight: 300
  },
  name: {
    marginTop: theme.spacing(3),
    color: theme.palette.white
  },
  bio: {
    color: theme.palette.white
  },
  contentContainer: {},
  content: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  contentHeader: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: theme.spacing(5),
    paddingBototm: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2)
  },
  logoImage: {
    marginLeft: theme.spacing(4)
  },
  contentBody: {
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    [theme.breakpoints.down('md')]: {
      justifyContent: 'center'
    }
  },
  form: {
    paddingLeft: 100,
    paddingRight: 100,
    paddingBottom: 125,
    flexBasis: 700,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2)
    }
  },
  title: {
    marginTop: theme.spacing(3)
  },
  subTitle: {
    marginTop: theme.spacing(2)
  },
  socialButtons: {
    marginTop: theme.spacing(3)
  },
  socialIcon: {
    marginRight: theme.spacing(1)
  },
  sugestion: {
    marginTop: theme.spacing(2)
  },
  textField: {
    marginTop: theme.spacing(2)
  },
  logInButton: {
    margin: theme.spacing(2, 0)
  },
  btnGroup: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  linkText: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3)
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

  // const handleBack = () => {
  //   history.goBack();
  // };

  // const changeLoginType = loginType => {
  //   setLoginType(loginType);
  // };

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
      // eslint-disable-next-line no-console
      // console.log(tokenDetails);
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
      <Grid className={classes.grid} container>
        <Grid className={classes.quoteContainer} item lg={5}>
          <div className={classes.quote}>
            <div className={classes.quoteInner}>
              <Typography className={classes.quoteText} variant="h1">
                Hella narwhal Cosby sweater McSweeney's, salvia kitsch before
                they sold out High Life.
              </Typography>
              <div className={classes.person}>
                <Typography className={classes.name} variant="body1">
                  Takamaru Ayako
                </Typography>
                <Typography className={classes.bio} variant="body2">
                  Manager at inVision
                </Typography>
              </div>
            </div>
          </div>
        </Grid>
        <Grid className={classes.content} item lg={7} xs={12}>
          <div className={classes.content}>
            <div className={classes.contentBody}>
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
                  align="center"
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
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

LogIn.propTypes = {
  history: PropTypes.object
};

export default withRouter(LogIn);
