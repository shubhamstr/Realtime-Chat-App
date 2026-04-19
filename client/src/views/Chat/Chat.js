import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/styles';
import { Grid } from '@material-ui/core';
import { useSelector, useDispatch } from 'react-redux';

import { ChatScreen } from './components';
import { getAllUsersAPI } from '../../api/users';
import { setDetails } from '../../store/authSlice';

const useStyles = makeStyles(theme => ({
  root: {
    minHeight: '100vh',
    padding: theme.spacing(3),
    background:
      'radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 30%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)'
  }
}));

const Chat = () => {
  const dispatch = useDispatch();
  const classes = useStyles();

  const auth = useSelector(state => state.auth);
  const { userDetails, tokenDetails } = auth;

  const getUserDetails = () => {
    const resp = getAllUsersAPI({
      userId: tokenDetails.userId
    });
    resp.then(res => {
      if (res.err) {
        alert(res.msg);
      } else {
        dispatch(
          setDetails({
            type: 'userDetails',
            value: res.data[0]
          })
        );
      }
    });
  };

  useEffect(() => {
    if (Object.keys(userDetails).length === 0) {
      getUserDetails();
    }
  }, []);

  return (
    <div className={classes.root}>
      <Grid container spacing={4}>
        <Grid item lg={12} sm={12} xl={12} xs={12}>
          <ChatScreen />
        </Grid>
      </Grid>
    </div>
  );
};

export default Chat;
