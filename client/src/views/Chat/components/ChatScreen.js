import React, { useEffect, useRef, useState } from 'react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  Avatar,
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  SendButton,
  ArrowButton,
  ConversationHeader
} from '@chatscope/chat-ui-kit-react';
import { makeStyles } from '@material-ui/styles';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import {
  sendMessageAPI,
  getAllChatAPI,
  deleteChatAPI,
  updateChatNotificationSettingsAPI
} from '../../../api/chat';
import { logOut } from '../../../store/authSlice';

const BASE_URL = process.env.REACT_APP_BASE_URL;
console.log(BASE_URL, 'BASE_URL');
const CLIENT_URL = process.env.REACT_APP_CLIENT_URL;
console.log(CLIENT_URL, 'CLIENT_URL');
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const DEFAULT_USER_AVATAR = '/images/avatars/user.svg';
const INCOMING_USER_AVATAR = '/images/avatars/user-incoming.svg';
const OUTGOING_USER_AVATAR = '/images/avatars/user-outgoing.svg';

const useStyles = makeStyles(() => ({
  shell: {
    position: 'relative',
    // height: 'calc(100vh - 64px)',
    // overflow: 'hidden',
    height: 'calc(100vh - 125px)',
    minHeight: 640,
    borderRadius: 24,
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.12)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    background: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(18px)'
  },
  container: {
    height: '100%'
  },
  emptyState: {
    width: '100%',
    display: 'grid',
    placeItems: 'center',
    color: '#475569',
    fontSize: 14,
    letterSpacing: 0.2
  },
  composer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px 16px',
    borderTop: '1px solid rgba(148, 163, 184, 0.14)',
    background: 'rgba(255, 255, 255, 0.85)'
  },
  fileInput: {
    display: 'none'
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: '1px solid rgba(148, 163, 184, 0.28)',
    background: '#fff',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    color: '#0f172a',
    fontSize: 18,
    flexShrink: 0
  },
  preview: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 12,
    background: 'rgba(226, 232, 240, 0.7)',
    fontSize: 12,
    color: '#334155',
    maxWidth: 220
  },
  previewImg: {
    width: 34,
    height: 34,
    borderRadius: 8,
    objectFit: 'cover',
    flexShrink: 0
  },
  messageShell: {
    position: 'relative'
  },
  deleteButton: {
    position: 'absolute',
    top: -6,
    right: 40,
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '1px solid rgba(239, 68, 68, 0.28)',
    background: '#fff',
    color: '#dc2626',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    fontSize: 14,
    lineHeight: 1,
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.12)'
  },
  settingsButton: {
    border: '1px solid rgba(148, 163, 184, 0.28)',
    background: '#fff',
    color: '#0f172a',
    borderRadius: 12,
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 13
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.42)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 30
  },
  modal: {
    width: 'min(92vw, 420px)',
    borderRadius: 20,
    background: '#fff',
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.24)',
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 6
  },
  modalText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 16,
    lineHeight: 1.5
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 14
  },
  label: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: 600
  },
  input: {
    border: '1px solid rgba(148, 163, 184, 0.4)',
    borderRadius: 12,
    padding: '10px 12px',
    fontSize: 14,
    outline: 'none'
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
    fontSize: 14,
    color: '#0f172a'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10
  },
  secondaryButton: {
    border: '1px solid rgba(148, 163, 184, 0.28)',
    background: '#fff',
    borderRadius: 12,
    padding: '10px 14px',
    cursor: 'pointer'
  },
  primaryButton: {
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    borderRadius: 12,
    padding: '10px 14px',
    cursor: 'pointer'
  }
}));

const ChatScreen = () => {
  const url = window.location.pathname.split('/')[2];
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const classes = useStyles();
  const [message, setMessage] = useState('');
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [attachment, setAttachment] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [emailAlertEnabled, setEmailAlertEnabled] = useState(false);
  const [browserAlertEnabled, setBrowserAlertEnabled] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [browserPermissionState, setBrowserPermissionState] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const { userDetails } = auth;
  const socketRef = useRef(null);
  if (!socketRef.current) {
    socketRef.current = io(BASE_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
  }
  const socket = socketRef.current;
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const avatar = userDetails.image
    ? userDetails.image
    : DEFAULT_USER_AVATAR;

  const syncBrowserPermission = () => {
    if (typeof window === 'undefined' || typeof window.Notification === 'undefined') {
      setBrowserPermissionState('unsupported');
      setBrowserAlertEnabled(false);
      return 'unsupported';
    }

    const permission = window.Notification.permission;
    setBrowserPermissionState(permission);
    if (permission !== 'granted') {
      setBrowserAlertEnabled(false);
    }
    return permission;
  };

  const requestBrowserAlerts = async () => {
    if (typeof window === 'undefined' || typeof window.Notification === 'undefined') {
      alert('This browser does not support notifications.');
      return false;
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      alert('Browser notifications require HTTPS or localhost.');
      return false;
    }

    const permission = await window.Notification.requestPermission();
    setBrowserPermissionState(permission);
    if (permission !== 'granted') {
      setBrowserAlertEnabled(false);
      alert('Browser notifications were not allowed.');
      return false;
    }

    setBrowserAlertEnabled(true);
    return true;
  };

  const showBrowserNotification = data => {
    if (!browserAlertEnabled) {
      return;
    }

    if (typeof window === 'undefined' || typeof window.Notification === 'undefined') {
      return;
    }

    if (window.Notification.permission !== 'granted') {
      return;
    }

    if (data?.username === userDetails.username) {
      return;
    }

    const title = `New message in room ${url}`;
    const body = data?.message
      ? `${data.username || 'Someone'}: ${data.message}`
      : `${data.username || 'Someone'} sent a new message`;

    try {
      const notification = new window.Notification(title, {
        body,
        icon: userDetails.image || DEFAULT_USER_AVATAR,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.log('Browser notification failed:', err);
      alert(body);
    }
  };

  const handleMsg = value => {
    setMessage(value);

    if (!url) {
      return;
    }

    const currentUser = userDetails.username || 'Someone';

    if (value && value.trim()) {
      socket.emit('typing', {
        roomName: url,
        username: currentUser
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', {
          roomName: url,
          username: currentUser
        });
      }, 1200);
    } else {
      socket.emit('stopTyping', {
        roomName: url,
        username: currentUser
      });
    }
  };

  const handleSend = () => {
    if (!message.trim() && !attachment) {
      return;
    }

    const optimisticMessage = {
      id: `tmp-${Date.now()}`,
      user_id: userDetails.id || userDetails._id,
      room_id: url,
      message: message,
      attachment,
      username: userDetails.username || 'Someone',
      created_on: new Date().toISOString()
    };

    setChatList(current => [...current, optimisticMessage]);

    const resp = sendMessageAPI({
      user_id: userDetails.id || userDetails._id,
      room_id: url,
      message: message,
      attachment,
      username: userDetails.username || 'Someone',
      emailAlertTo: notificationEmail,
      enableEmailAlert: emailAlertEnabled ? 1 : 0
    });
    socket.emit('stopTyping', {
      roomName: url,
      username: userDetails.username || 'Someone'
    });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    resp.then(res => {
      if (res.err) {
        setChatList(current => current.filter(chat => chat.id !== optimisticMessage.id));
        alert(res.msg);
      } else {
        const persistedMessage = res?.data || {};
        const persistedId = persistedMessage._id || persistedMessage.id || optimisticMessage.id;

        setChatList(current =>
          current.map(chat =>
            chat.id === optimisticMessage.id
              ? {
                ...chat,
                ...persistedMessage,
                id: persistedId,
                _id: persistedMessage._id || chat._id || persistedId
              }
              : chat
          )
        );
        setMessage('');
        setAttachment('');
        setAttachmentName('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  };

  const saveNotificationSettings = () => {
    setSettingsSaving(true);
    const permissionPromise = browserAlertEnabled ? requestBrowserAlerts() : Promise.resolve(true);

    permissionPromise
      .then(canEnableBrowserAlerts => updateChatNotificationSettingsAPI({
        id: userDetails.id || userDetails._id,
        email: notificationEmail,
        email_notification_flag: emailAlertEnabled ? 1 : 0,
        push_notification_flag: canEnableBrowserAlerts && browserAlertEnabled ? 1 : 0
      }))
      .then(res => {
        setSettingsSaving(false);
        if (res.err) {
          alert(res.msg);
          return;
        }

        syncBrowserPermission();
        setShowNotificationModal(false);
        alert('Notification settings saved');
      })
      .catch(err => {
        setSettingsSaving(false);
        alert(err?.message || 'Unable to save notification settings');
      });
  };

  const handleAttachmentChange = event => {
    const file = event.target.files && event.target.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      alert('Please choose an image smaller than 2 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment(reader.result || '');
      setAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteMessage = chat => {
    const messageId = chat._id || chat.id;

    if (!messageId) {
      alert('This message cannot be deleted.');
      return;
    }

    if (String(messageId).startsWith('tmp-')) {
      setChatList(current => current.filter(item => (item._id || item.id) !== messageId));
      return;
    }

    if (!window.confirm('Delete this message?')) {
      return;
    }

    deleteChatAPI({
      id: messageId,
      user_id: userDetails.id || userDetails._id,
      room_id: url
    }).then(res => {
      if (res.err) {
        alert(res.msg);
        return;
      }

      setChatList(current =>
        current.filter(item => {
          const itemId = item._id || item.id;
          return String(itemId) !== String(messageId);
        })
      );
    });
  };

  const handleLogOut = () => {
    localStorage.removeItem('chatToken');
    dispatch(logOut());
  };

  const loadChat = () => {
    setLoading(true);
    const resp = getAllChatAPI({
      room_id: url
    });
    resp.then(res => {
      if (res.err) {
        alert(res.msg);
      } else {
        setChatList(res.data);
      }
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    const handleIncomingMessage = data => {
      if (!url || data?.roomName !== url) {
        return;
      }

      if (data?.username === userDetails.username) {
        return;
      }

      setChatList(current => {
        const incomingId = data?.messageId || `${data?.roomName || url}-${data?.username || 'Someone'}-${data?.message || ''}`;
        const alreadyExists = current.some(chat => chat.id === incomingId || chat.messageId === incomingId);

        if (alreadyExists) {
          return current;
        }

        const tempIndex = current.findIndex(chat =>
          String(chat.id || '').startsWith('tmp-') &&
          chat.user_id === data?.user_id &&
          chat.room_id === (data?.roomName || url) &&
          chat.message === (data?.message || '') &&
          chat.attachment === (data?.attachment || '')
        );

        if (tempIndex >= 0) {
          const next = [...current];
          next[tempIndex] = {
            ...next[tempIndex],
            id: incomingId,
            _id: data?.messageId || next[tempIndex]._id || incomingId,
            user_id: data?.user_id || next[tempIndex].user_id,
            room_id: data?.roomName || url,
            message: data?.message || next[tempIndex].message,
            attachment: data?.attachment || next[tempIndex].attachment,
            username: data?.username || next[tempIndex].username,
            created_on: data?.created_on || next[tempIndex].created_on
          };
          return next;
        }

        return [
          ...current,
          {
            id: incomingId,
            user_id: data?.user_id || '',
            room_id: data?.roomName || url,
            message: data?.message || '',
            attachment: data?.attachment || '',
            username: data?.username || 'Someone',
            created_on: data?.created_on || new Date().toISOString()
          }
        ];
      });
    };

    const handleDeletedMessage = data => {
      if (!url || data?.roomName !== url) {
        return;
      }

      const deletedId = data?.messageId;
      if (!deletedId) {
        return;
      }

      setChatList(current =>
        current.filter(chat => String(chat._id || chat.id) !== String(deletedId))
      );
    };

    const handleConnect = () => {
      if (url && userDetails.username) {
        socket.emit('joinRoom', {
          roomName: url,
          username: userDetails.username
        });
      }
    };

    const handleTyping = data => {
      if (data?.roomName === url && data?.username !== userDetails.username) {
        setTypingUser(data.username);
      }
    };

    const handleStopTyping = data => {
      if (data?.roomName === url) {
        setTypingUser(current => (current === data.username ? '' : current));
      }
    };

    socket.on('room-message', handleIncomingMessage);
    socket.on('message-deleted', handleDeletedMessage);
    socket.on('connect', handleConnect);
    socket.on('connect_error', err => {
      console.log('Socket connect error:', err?.message || err);
    });
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);

    handleConnect();

    return () => {
      socket.off('room-message', handleIncomingMessage);
      socket.off('message-deleted', handleDeletedMessage);
      socket.off('connect', handleConnect);
      socket.off('connect_error');
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, url, userDetails.username]);

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (url) {
      loadChat();
    }
  }, [url, userDetails.id, userDetails._id]);

  return (
    <div className={classes.shell}>
      <MainContainer className={classes.container}>
        {loading && <div className={classes.emptyState}>Loading conversation...</div>}
        {!loading && (
          <ChatContainer>
            <ConversationHeader>
              <Avatar
                name={userDetails.username}
                src={avatar}
              />
              <ConversationHeader.Content
                info={
                  typingUser
                    ? `${typingUser} is typing...`
                    : `${chatList.length} message${chatList.length === 1 ? '' : 's'} in this room`
                }
                userName={`Room ID - (${url})`}
              />
              <ConversationHeader.Actions>
                <button
                  className={classes.settingsButton}
                  onClick={() => {
                    setNotificationEmail(userDetails.email || '');
                    setEmailAlertEnabled(Boolean(userDetails.email_notification_flag));
                    setBrowserAlertEnabled(Boolean(userDetails.push_notification_flag));
                    syncBrowserPermission();
                    setShowNotificationModal(true);
                  }}
                  type="button"
                  title="Notification settings"
                >
                  Notifications
                </button>
                <SendButton
                  border
                  onClick={() => {
                    navigator.clipboard.writeText(`${CLIENT_URL}/login/${url}`);
                    alert('Chat link copied to clipboard');
                  }}
                  style={{ padding: '0px 10px' }}
                  title="Share Chat"
                />
                <ArrowButton
                  border
                  direction="right"
                  onClick={handleLogOut}
                  style={{ padding: '0px 10px' }}
                  title="Log Out"
                />
              </ConversationHeader.Actions>
            </ConversationHeader>
            <MessageList>
              {chatList.length > 0 ? (
                chatList.map((chat, index) => {
                  const dir =
                    (userDetails.id === chat.user_id || userDetails._id === chat.user_id)
                      ? 'outgoing'
                      : 'incoming';

                  return (
                    <div className={classes.messageShell} key={`${chat.id || index}-${chat.created_on || 'msg'}`}>
                      {dir === 'outgoing' ? (
                        <button
                          aria-label="Delete message"
                          className={classes.deleteButton}
                          onClick={() => handleDeleteMessage(chat)}
                          title="Delete message"
                          type="button"
                        >
                          ×
                        </button>
                      ) : null}
                      <Message
                        model={{
                          message: chat.message,
                          sentTime: 'just now',
                          sender: chat.username || 'Guest',
                          direction: dir
                        }}>
                        {chat.attachment ? (
                          <Message.CustomContent>
                            <img
                              alt={chat.message || 'attachment'}
                              src={chat.attachment}
                              style={{
                                maxWidth: 240,
                                maxHeight: 240,
                                borderRadius: 12,
                                display: 'block',
                                border: '1px solid rgba(148, 163, 184, 0.2)'
                              }}
                            />
                            {chat.message ? (
                              <div style={{ marginTop: 8, wordBreak: 'break-word' }}>{chat.message}</div>
                            ) : null}
                          </Message.CustomContent>
                        ) : null}
                        <Avatar
                          src={
                            dir === 'outgoing'
                              ? (userDetails.image || OUTGOING_USER_AVATAR)
                              : INCOMING_USER_AVATAR
                          }
                        />
                      </Message>
                    </div>
                  );
                })
              ) : (
                <div className={classes.emptyState}>No messages yet. Start the conversation.</div>
              )}
            </MessageList>
            <MessageInput
              attachButton={true}
              onChange={handleMsg}
              onSend={handleSend}
              onAttachClick={() => fileInputRef.current && fileInputRef.current.click()}
              placeholder="Type a message..."
              value={message}
            />
          </ChatContainer>
        )}
      </MainContainer>
      {showNotificationModal ? (
        <div className={classes.modalBackdrop} onClick={() => setShowNotificationModal(false)} role="presentation">
          <div className={classes.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className={classes.modalTitle}>Notification settings</div>
            <div className={classes.modalText}>
              Enable email alerts to receive each new message by email, or enable browser alerts for desktop popups.
            </div>
            <div className={classes.field}>
              <label className={classes.label} htmlFor="notification-email">
                Email address
              </label>
              <input
                className={classes.input}
                id="notification-email"
                onChange={e => setNotificationEmail(e.target.value)}
                placeholder="name@example.com"
                type="email"
                value={notificationEmail}
              />
            </div>
            <div className={classes.checkboxRow}>
              <input
                checked={emailAlertEnabled}
                id="email-alert"
                onChange={e => setEmailAlertEnabled(e.target.checked)}
                type="checkbox"
              />
              <label htmlFor="email-alert">Enable email alerts</label>
            </div>
            <div className={classes.checkboxRow}>
              <input
                checked={browserAlertEnabled}
                id="browser-alert"
                onChange={e => {
                  const enabled = e.target.checked;
                  setBrowserAlertEnabled(enabled);
                  if (enabled) {
                    requestBrowserAlerts();
                  }
                }}
                type="checkbox"
              />
              <label htmlFor="browser-alert">
                Enable browser alerts
                {browserPermissionState && browserPermissionState !== 'granted' ? ` (${browserPermissionState})` : ''}
              </label>
            </div>
            <button
              className={classes.secondaryButton}
              onClick={() => {
                requestBrowserAlerts().then(granted => {
                  if (granted) {
                    showBrowserNotification({
                      username: 'Test',
                      message: 'This is a browser notification test'
                    });
                  }
                });
              }}
              style={{ marginBottom: 18, width: '100%' }}
              type="button"
            >
              Test browser notification
            </button>
            <div className={classes.modalActions}>
              <button className={classes.secondaryButton} onClick={() => setShowNotificationModal(false)} type="button">
                Cancel
              </button>
              <button className={classes.primaryButton} onClick={saveNotificationSettings} type="button">
                {settingsSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className={classes.composer}>
        <input
          ref={fileInputRef}
          accept="image/*"
          className={classes.fileInput}
          onChange={handleAttachmentChange}
          type="file"
        />
        {/* <button
          aria-label="Attach image"
          className={classes.attachButton}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          type="button"
          title="Attach image"
        >
          +
        </button> */}
        {attachmentName ? (
          <div className={classes.preview}>
            {attachment ? <img alt={attachmentName} className={classes.previewImg} src={attachment} /> : null}
            <span>{attachmentName}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ChatScreen;
