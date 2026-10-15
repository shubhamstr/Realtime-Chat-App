import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import {
  sendMessageAPI,
  getAllChatAPI,
  deleteChatAPI,
  deleteRoomAPI,
  updateChatNotificationSettingsAPI
} from '../../../api/chat';
import { logOut } from '../../../store/authSlice';
import { touchChat, deleteSavedChat } from '../../../utils/chatStorage';

const API_URL = process.env.REACT_APP_API_URL;
const CLIENT_URL = process.env.REACT_APP_CLIENT_URL;
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const DEFAULT_USER_AVATAR = '/images/avatars/user.svg';
const INCOMING_USER_AVATAR = '/images/avatars/user-incoming.svg';
const OUTGOING_USER_AVATAR = '/images/avatars/user-outgoing.svg';
const APP_TITLE = 'Realtime Chat App';

const useStyles = makeStyles(() => ({
  shell: {
    position: 'relative',
    height: 'calc(100vh - 125px)',
    minHeight: 640,
    borderRadius: 24,
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.12)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    background: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(18px)',
    overflow: 'hidden'
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
    position: 'relative',
    '&:hover $messageActions': {
      opacity: 1,
      pointerEvents: 'auto'
    }
  },
  messageActions: {
    position: 'absolute',
    top: 6,
    right: 52,
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.15s ease',
    zIndex: 2
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: '1px solid rgba(148, 163, 184, 0.22)',
    background: 'rgba(255, 255, 255, 0.96)',
    color: '#64748b',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
    transition: 'color 0.15s ease, background 0.15s ease, border-color 0.15s ease',
    '&:hover': {
      color: '#dc2626',
      background: '#fef2f2',
      borderColor: 'rgba(239, 68, 68, 0.35)'
    },
    '&:focus': {
      outline: 'none',
      boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.25)'
    }
  },
  contextMenuItem: {
    fontSize: 14,
    gap: 10,
    color: '#dc2626'
  },
  contextMenuIcon: {
    fontSize: 18,
    marginRight: 10,
    color: '#dc2626'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  actionButton: {
    border: '1px solid rgba(148, 163, 184, 0.28)',
    background: '#fff',
    color: '#0f172a',
    borderRadius: 12,
    padding: '7px 12px',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.15s ease',
    '&:hover': {
      background: '#f8fafc',
      borderColor: '#94a3b8'
    }
  },
  deleteChatButton: {
    border: '1px solid rgba(239, 68, 68, 0.3)',
    background: '#fff',
    color: '#dc2626',
    borderRadius: 12,
    padding: '7px 12px',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.15s ease',
    '&:hover': {
      background: '#fef2f2',
      borderColor: '#ef4444'
    }
  },
  unreadBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ef4444',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 9999,
    padding: '2px 8px',
    marginLeft: 8,
    animation: '$pulse 2s infinite'
  },
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.05)' },
    '100%': { transform: 'scale(1)' }
  },
  onlineIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#94a3b8'
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
  const { userDetails } = auth;

  const [message, setMessage] = useState('');
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [attachment, setAttachment] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [emailAlertEnabled, setEmailAlertEnabled] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [messageMenu, setMessageMenu] = useState(null);

  // In-app notifications & online status
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const socketRef = useRef(null);
  if (!socketRef.current) {
    socketRef.current = io(API_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
  }
  const socket = socketRef.current;
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const avatar = userDetails.image ? userDetails.image : DEFAULT_USER_AVATAR;

  // Touch current chat in localStorage
  useEffect(() => {
    if (url) {
      touchChat(url);
    }
  }, [url, chatList.length]);

  // Document focus & In-App Notification count handling
  const resetNotifications = useCallback(() => {
    setUnreadCount(0);
    document.title = APP_TITLE;
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      resetNotifications();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        resetNotifications();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.title = APP_TITLE;
    };
  }, [resetNotifications]);

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
    updateChatNotificationSettingsAPI({
      id: userDetails.id || userDetails._id,
      email: notificationEmail,
      email_notification_flag: emailAlertEnabled ? 1 : 0
    })
      .then(res => {
        setSettingsSaving(false);
        if (res.err) {
          alert(res.msg);
          return;
        }
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

  const closeMessageMenu = () => setMessageMenu(null);

  const handleMessageContextMenu = (event, chat) => {
    event.preventDefault();
    setMessageMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      chat
    });
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

  const handleDeleteFromMenu = () => {
    if (messageMenu?.chat) {
      handleDeleteMessage(messageMenu.chat);
    }
    closeMessageMenu();
  };

  // Delete entire chat room messages and storage
  const handleDeleteChatRoom = () => {
    if (
      !window.confirm(
        'Are you sure you want to delete this chat? All messages in this room will be deleted.'
      )
    ) {
      return;
    }

    deleteRoomAPI({ room_id: url })
      .then(res => {
        if (res.err) {
          alert(res.msg);
          return;
        }
        setChatList([]);
        deleteSavedChat(url);
        alert('Chat deleted successfully');
      })
      .catch(err => {
        alert(err?.message || 'Failed to delete chat');
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
    resp
      .then(res => {
        if (res.err) {
          alert(res.msg);
        } else {
          setChatList(res.data);
        }
      })
      .finally(() => {
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

      // Update in-app notification count and tab title if document is hidden or inactive
      if (document.hidden) {
        setUnreadCount(prev => {
          const next = prev + 1;
          document.title = `(${next}) ${APP_TITLE}`;
          return next;
        });
      }

      setChatList(current => {
        const incomingId =
          data?.messageId ||
          `${data?.roomName || url}-${data?.username || 'Someone'}-${data?.message || ''}`;
        const alreadyExists = current.some(
          chat => chat.id === incomingId || chat.messageId === incomingId
        );

        if (alreadyExists) {
          return current;
        }

        const tempIndex = current.findIndex(
          chat =>
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

    const handleRoomCleared = data => {
      if (!url || data?.roomName !== url) {
        return;
      }
      setChatList([]);
    };

    const handleRoomUsers = data => {
      if (data?.roomName === url && Array.isArray(data.users)) {
        setOnlineUsers(data.users);
      }
    };

    const handleConnect = () => {
      if (url && userDetails.username) {
        socket.emit('joinRoom', {
          roomName: url,
          username: userDetails.username,
          userId: userDetails.id || userDetails._id
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
    socket.on('room-cleared', handleRoomCleared);
    socket.on('room-users', handleRoomUsers);
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
      socket.off('room-cleared', handleRoomCleared);
      socket.off('room-users', handleRoomUsers);
      socket.off('connect', handleConnect);
      socket.off('connect_error');
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, url, userDetails.username, userDetails.id, userDetails._id]);

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

  // Determine online status
  const otherUsersOnline = onlineUsers.filter(
    u => u.username !== userDetails.username
  );
  const isOtherUserOnline = otherUsersOnline.length > 0;
  const onlineCount = onlineUsers.length;

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
                status={isOtherUserOnline ? 'available' : 'dnd'}
              />
              <ConversationHeader.Content
                info={
                  typingUser ? (
                    `${typingUser} is typing...`
                  ) : (
                    <span className={classes.onlineIndicator}>
                      <span
                        className={
                          isOtherUserOnline ? classes.onlineDot : classes.offlineDot
                        }
                      />
                      {isOtherUserOnline
                        ? `Online (${onlineCount} active)`
                        : 'Offline (waiting for members)'}
                      {' • '}
                      {chatList.length} message{chatList.length === 1 ? '' : 's'}
                      {unreadCount > 0 && (
                        <span className={classes.unreadBadge}>
                          {unreadCount} new
                        </span>
                      )}
                    </span>
                  )
                }
                userName={`Room ID - (${url})`}
              />
              <ConversationHeader.Actions>
                <div className={classes.headerActions}>
                  <button
                    className={classes.actionButton}
                    onClick={() => {
                      setNotificationEmail(userDetails.email || '');
                      setEmailAlertEnabled(Boolean(userDetails.email_notification_flag));
                      setShowNotificationModal(true);
                    }}
                    title="Notification settings"
                    type="button"
                  >
                    Email Alerts
                  </button>
                  <button
                    className={classes.deleteChatButton}
                    onClick={handleDeleteChatRoom}
                    title="Delete entire chat history"
                    type="button"
                  >
                    <DeleteOutlineIcon style={{ fontSize: 16 }} />
                    Delete Chat
                  </button>
                  <SendButton
                    border
                    onClick={() => {
                      navigator.clipboard.writeText(`${CLIENT_URL}/chat/${url}`);
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
                </div>
              </ConversationHeader.Actions>
            </ConversationHeader>
            <MessageList>
              {chatList.length > 0 ? (
                chatList.map((chat, index) => {
                  const dir =
                    userDetails.id === chat.user_id ||
                    userDetails._id === chat.user_id
                      ? 'outgoing'
                      : 'incoming';

                  return (
                    <div
                      className={classes.messageShell}
                      key={`${chat.id || index}-${chat.created_on || 'msg'}`}
                      onContextMenu={
                        dir === 'outgoing'
                          ? event => handleMessageContextMenu(event, chat)
                          : undefined
                      }
                    >
                      {dir === 'outgoing' ? (
                        <div className={classes.messageActions}>
                          <button
                            aria-label="Delete message"
                            className={classes.deleteButton}
                            onClick={() => handleDeleteMessage(chat)}
                            title="Delete message"
                            type="button"
                          >
                            <DeleteOutlineIcon style={{ fontSize: 16 }} />
                          </button>
                        </div>
                      ) : null}
                      <Message
                        model={{
                          message: chat.message,
                          sentTime: 'just now',
                          sender: chat.username || 'Guest',
                          direction: dir
                        }}
                      >
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
                              <div
                                style={{
                                  marginTop: 8,
                                  wordBreak: 'break-word'
                                }}
                              >
                                {chat.message}
                              </div>
                            ) : null}
                          </Message.CustomContent>
                        ) : null}
                        <Avatar
                          src={
                            dir === 'outgoing'
                              ? userDetails.image || OUTGOING_USER_AVATAR
                              : INCOMING_USER_AVATAR
                          }
                        />
                      </Message>
                    </div>
                  );
                })
              ) : (
                <div className={classes.emptyState}>
                  No messages yet. Start the conversation.
                </div>
              )}
            </MessageList>
            <MessageInput
              attachButton
              onAttachClick={() =>
                fileInputRef.current && fileInputRef.current.click()
              }
              onChange={handleMsg}
              onSend={handleSend}
              placeholder="Type a message..."
              value={message}
            />
          </ChatContainer>
        )}
      </MainContainer>
      <Menu
        anchorPosition={
          messageMenu !== null
            ? { top: messageMenu.mouseY, left: messageMenu.mouseX }
            : undefined
        }
        anchorReference="anchorPosition"
        onClose={closeMessageMenu}
        open={messageMenu !== null}
      >
        <MenuItem
          className={classes.contextMenuItem}
          onClick={handleDeleteFromMenu}
        >
          <DeleteOutlineIcon className={classes.contextMenuIcon} />
          Delete
        </MenuItem>
      </Menu>

      {showNotificationModal ? (
        <div
          aria-modal="true"
          className={classes.modalBackdrop}
          onClick={() => setShowNotificationModal(false)}
          role="presentation"
        >
          <div
            className={classes.modal}
            onClick={e => e.stopPropagation()}
            role="dialog"
          >
            <div className={classes.modalTitle}>Email Notification Settings</div>
            <div className={classes.modalText}>
              Configure email alerts to receive incoming messages when you are offline.
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
            <div className={classes.modalActions}>
              <button
                className={classes.secondaryButton}
                onClick={() => setShowNotificationModal(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={classes.primaryButton}
                onClick={saveNotificationSettings}
                type="button"
              >
                {settingsSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className={classes.composer}>
        <input
          accept="image/*"
          className={classes.fileInput}
          onChange={handleAttachmentChange}
          ref={fileInputRef}
          type="file"
        />
        {attachmentName ? (
          <div className={classes.preview}>
            {attachment ? (
              <img
                alt={attachmentName}
                className={classes.previewImg}
                src={attachment}
              />
            ) : null}
            <span>{attachmentName}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ChatScreen;
