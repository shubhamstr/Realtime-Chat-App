/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { logIn, setDetails } from '../../store/authSlice';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import validate from 'validate.js';
import { jwtDecode } from 'jwt-decode';
import { makeStyles } from '@material-ui/styles';
import axiosClient from '../../api/api-client';
import { signInApi } from '../../api/auth';
import {
  Button,
  TextField,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress
} from '@material-ui/core';
import ChatBubbleOutlineIcon from '@material-ui/icons/ChatBubbleOutline';
import MeetingRoomIcon from '@material-ui/icons/MeetingRoom';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import HistoryIcon from '@material-ui/icons/History';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import {
  getSavedChats,
  saveChat,
  deleteSavedChat
} from '../../utils/chatStorage';

const API_URL = process.env.REACT_APP_API_URL;

const schema = {
  userName: {
    presence: { allowEmpty: false, message: 'is required' },
    length: {
      maximum: 64
    }
  }
};

const formatTimeAgo = timestamp => {
  if (!timestamp) return 'Recently';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return 'Over a month ago';
};

const useStyles = makeStyles(theme => ({
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(3),
    background:
      'radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.12) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.14) 0%, transparent 40%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)'
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    padding: theme.spacing(4),
    background: 'rgba(255, 255, 255, 0.88)',
    backdropFilter: 'blur(20px)',
    boxShadow:
      '0 24px 70px -12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2.5),
    border: '1px solid rgba(226, 232, 240, 0.8)'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: theme.spacing(1)
  },
  brandIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 18,
    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
    display: 'grid',
    placeItems: 'center',
    color: '#ffffff',
    boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
    marginBottom: theme.spacing(0.5)
  },
  title: {
    fontWeight: 800,
    letterSpacing: -0.5,
    color: '#0f172a',
    fontSize: '1.75rem'
  },
  subTitle: {
    color: '#64748b',
    fontSize: '0.9rem'
  },
  roomBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 9999,
    background: 'rgba(37, 99, 235, 0.08)',
    color: '#2563eb',
    fontSize: '0.85rem',
    fontWeight: 600,
    border: '1px solid rgba(37, 99, 235, 0.2)',
    wordBreak: 'break-all'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2)
  },
  input: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 14,
      background: 'rgba(255, 255, 255, 0.9)',
      transition: 'all 0.2s ease',
      '&:hover': {
        background: '#ffffff'
      },
      '&.Mui-focused': {
        background: '#ffffff',
        boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.15)'
      }
    }
  },
  submitButton: {
    marginTop: theme.spacing(1),
    padding: theme.spacing(1.5),
    borderRadius: 14,
    fontSize: '1rem',
    fontWeight: 700,
    textTransform: 'none',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
    boxShadow: '0 10px 20px -3px rgba(37, 99, 235, 0.35)',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)',
      boxShadow: '0 12px 24px -3px rgba(37, 99, 235, 0.45)',
      transform: 'translateY(-1px)'
    },
    '&:disabled': {
      background: '#cbd5e1',
      color: '#94a3b8',
      boxShadow: 'none'
    }
  },
  savedSection: {
    marginTop: theme.spacing(1),
    paddingTop: theme.spacing(2),
    borderTop: '1px solid rgba(226, 232, 240, 0.8)'
  },
  savedHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#475569',
    fontSize: '0.85rem',
    fontWeight: 700,
    marginBottom: theme.spacing(1.5),
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  savedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    maxHeight: 180,
    overflowY: 'auto',
    paddingRight: 4
  },
  savedItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: 12,
    background: 'rgba(241, 245, 249, 0.8)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:hover': {
      background: '#ffffff',
      borderColor: '#93c5fd',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)',
      transform: 'translateX(2px)'
    }
  },
  savedItemInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginRight: 8
  },
  savedItemTitle: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: '#1e293b'
  },
  savedItemTime: {
    fontSize: '0.72rem',
    color: '#64748b'
  },
  savedItemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  deleteBtn: {
    padding: 6,
    color: '#94a3b8',
    '&:hover': {
      color: '#ef4444',
      background: 'rgba(239, 68, 68, 0.1)'
    }
  }
}));

const LogIn = props => {
  const urlFromPath = window.location.pathname.split('/')[2];
  const dispatch = useDispatch();
  const { history } = props;
  const classes = useStyles();

  const [targetRoom, setTargetRoom] = useState(urlFromPath || '');
  const [submitting, setSubmitting] = useState(false);
  const [savedChats, setSavedChats] = useState([]);

  const [formStateUserName, setFormStateUserName] = useState({
    isValid: false,
    values: {},
    touched: {},
    errors: {}
  });

  useEffect(() => {
    // Load saved chats and auto-clean ones older than 30 days
    const chats = getSavedChats();
    setSavedChats(chats);
  }, []);

  const handleChangeUserName = event => {
    event.persist();
    setFormStateUserName(prevState => ({
      ...prevState,
      values: {
        ...prevState.values,
        [event.target.name]: event.target.value
      },
      touched: {
        ...prevState.touched,
        [event.target.name]: true
      }
    }));
  };

  const handleSelectSavedChat = roomId => {
    setTargetRoom(roomId);
  };

  const handleDeleteSavedChat = (e, roomId) => {
    e.stopPropagation();
    if (window.confirm('Remove this chat from saved chats?')) {
      const updated = deleteSavedChat(roomId);
      setSavedChats(updated);
      if (targetRoom === roomId) {
        setTargetRoom('');
      }
    }
  };

  const setHeaderToken = token => {
    axiosClient.defaults.headers.common.Authorization = token;
  };

  const handleLogIn = async event => {
    event.preventDefault();
    if (!formStateUserName.isValid || submitting) return;

    setSubmitting(true);
    const username = formStateUserName.values.userName;
    const payload = {
      loginType: 'userName',
      userName: username
    };

    if (targetRoom && targetRoom.trim()) {
      payload['room_id'] = targetRoom.trim();
    }

    try {
      const resp = await signInApi(payload);
      if (resp.data.err) {
        alert(resp.data.msg);
        setSubmitting(false);
        return;
      }

      const roomURL = resp.data.chatURL;
      const token = resp.data.data;

      // Connect socket
      const socket = io(API_URL, { transports: ['websocket'] });
      socket.emit('connected', username);

      setHeaderToken(token);
      localStorage.setItem('chatToken', token);
      localStorage.setItem('chatURL', roomURL);

      // Save room into local storage with updated timestamp
      saveChat(roomURL, `Room ${roomURL.slice(0, 8)}...`);

      const tokenDetails = jwtDecode(token);
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
      history.push(`/chat/${roomURL}`);
    } catch (err) {
      alert(err?.response?.data?.msg || err?.message || 'Failed to log in');
      setSubmitting(false);
    }
  };

  const hasErrorUserName = field =>
    Boolean(formStateUserName.touched[field] && formStateUserName.errors[field]);

  useEffect(() => {
    const errors = validate(formStateUserName.values, schema);
    setFormStateUserName(prevState => ({
      ...prevState,
      isValid: !errors,
      errors: errors || {}
    }));
  }, [formStateUserName.values]);

  return (
    <div className={classes.root}>
      <div className={classes.card}>
        <div className={classes.header}>
          <div className={classes.brandIconWrapper}>
            <ChatBubbleOutlineIcon style={{ fontSize: 28 }} />
          </div>
          <Typography className={classes.title} variant="h1">
            Realtime Chat
          </Typography>
          <Typography className={classes.subTitle} variant="body2">
            Instant, lightweight collaboration rooms
          </Typography>

          {targetRoom ? (
            <div className={classes.roomBadge}>
              <MeetingRoomIcon style={{ fontSize: 16 }} />
              <span>Room: {targetRoom.length > 20 ? `${targetRoom.slice(0, 18)}...` : targetRoom}</span>
              <Tooltip title="Clear room selection">
                <span
                  onClick={() => setTargetRoom('')}
                  style={{ cursor: 'pointer', marginLeft: 4, fontWeight: 'bold' }}
                >
                  ✕
                </span>
              </Tooltip>
            </div>
          ) : null}
        </div>

        <form className={classes.form} onSubmit={handleLogIn}>
          <TextField
            autoFocus
            className={classes.input}
            error={hasErrorUserName('userName')}
            fullWidth
            helperText={
              hasErrorUserName('userName')
                ? formStateUserName.errors.userName[0]
                : null
            }
            label="Your Nickname"
            name="userName"
            onChange={handleChangeUserName}
            placeholder="e.g. Alice"
            type="text"
            value={formStateUserName.values.userName || ''}
            variant="outlined"
          />

          {!urlFromPath && (
            <TextField
              className={classes.input}
              fullWidth
              helperText="Leave empty to create a new private room"
              label="Room ID (Optional)"
              onChange={e => setTargetRoom(e.target.value)}
              placeholder="Paste room code or leave blank"
              type="text"
              value={targetRoom}
              variant="outlined"
            />
          )}

          <Button
            className={classes.submitButton}
            disabled={!formStateUserName.isValid || submitting}
            fullWidth
            size="large"
            type="submit"
            variant="contained"
          >
            {submitting ? (
              <CircularProgress color="inherit" size={24} />
            ) : (
              targetRoom ? 'Join Chat Room' : 'Start New Chat'
            )}
          </Button>
        </form>

        {savedChats.length > 0 && (
          <div className={classes.savedSection}>
            <div className={classes.savedHeader}>
              <HistoryIcon style={{ fontSize: 16 }} />
              <span>Saved Chats ({savedChats.length})</span>
            </div>
            <div className={classes.savedList}>
              {savedChats.map(item => (
                <div
                  className={classes.savedItem}
                  key={item.roomId}
                  onClick={() => handleSelectSavedChat(item.roomId)}
                  title="Click to open this room"
                >
                  <div className={classes.savedItemInfo}>
                    <span className={classes.savedItemTitle}>
                      {item.title || item.roomId}
                    </span>
                    <span className={classes.savedItemTime}>
                      {formatTimeAgo(item.lastUsed || item.createdAt)}
                    </span>
                  </div>
                  <div className={classes.savedItemActions}>
                    <Tooltip title="Delete saved chat">
                      <IconButton
                        className={classes.deleteBtn}
                        onClick={e => handleDeleteSavedChat(e, item.roomId)}
                        size="small"
                      >
                        <DeleteOutlineIcon style={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <ArrowForwardIcon style={{ fontSize: 18, color: '#2563eb' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

LogIn.propTypes = {
  history: PropTypes.object
};

export default withRouter(LogIn);
