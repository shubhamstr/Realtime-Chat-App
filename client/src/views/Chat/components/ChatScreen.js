import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { sendMessageAPI, getAllChatAPI } from '../../../api/chat';
import { logOut } from '../../../store/authSlice';

const BASE_URL = process.env.REACT_APP_BASE_URL;
console.log(BASE_URL, 'BASE_URL');
const CLIENT_URL = process.env.REACT_APP_CLIENT_URL;
console.log(CLIENT_URL, 'CLIENT_URL');
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

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
  const { userDetails } = auth;
  const socket = useMemo(() => io(BASE_URL, { transports: ['websocket'] }), []);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const avatar = userDetails.image
    ? userDetails.image
    : '/images/avatars/avatar_11.png';

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

    // console.log(userDetails)
    const resp = sendMessageAPI({
      user_id: userDetails.id || userDetails._id,
      room_id: url,
      message: message,
      attachment
    });
    socket.emit('stopTyping', {
      roomName: url,
      username: userDetails.username || 'Someone'
    });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('message', message);
    resp.then(res => {
      if (res.err) {
        alert(res.msg);
      } else {
        setMessage('');
        setAttachment('');
        setAttachmentName('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        loadChat();
      }
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
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    setTypingUser('');

    if (url && userDetails.username) {
      socket.emit('joinRoom', {
        roomName: url,
        username: userDetails.username
      });
    }

    const handleIncomingMessage = () => {
      if (url) {
        loadChat();
      }
    };

    socket.on('message', handleIncomingMessage);
    socket.on('typing', data => {
      if (data?.roomName === url && data?.username !== userDetails.username) {
        setTypingUser(data.username);
      }
    });
    socket.on('stopTyping', data => {
      if (data?.roomName === url) {
        setTypingUser(current => (current === data.username ? '' : current));
      }
    });

    return () => {
      socket.off('message', handleIncomingMessage);
      socket.off('typing');
      socket.off('stopTyping');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.disconnect();
    };
  }, [socket, url, userDetails.username]);

  useEffect(() => {
    if (url) {
      loadChat();
    }
  }, [url, userDetails]);

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
                    <Message
                      key={`${chat.id || index}-${chat.created_on || 'msg'}`}
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
                      <Avatar src={dir === 'outgoing' ? avatar : '/images/avatars/avatar_8.png'} />
                    </Message>
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
