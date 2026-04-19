import React, { useEffect, useMemo, useState } from 'react';
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
import { BASE_URL, CLIENT_URL } from '../../../constants';

const useStyles = makeStyles(() => ({
  shell: {
    position: 'relative',
    height: 'calc(100vh - 64px)',
    minHeight: 640,
    borderRadius: 24,
    overflow: 'hidden',
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
  const { userDetails } = auth;
  const socket = useMemo(() => io(BASE_URL, { transports: ['websocket'] }), []);
  const avatar = userDetails.image
    ? userDetails.image
    : '/images/avatars/avatar_11.png';

  const handleMsg = value => {
    setMessage(value);
  };

  const handleSend = () => {
    const resp = sendMessageAPI({
      user_id: userDetails.id,
      room_id: url,
      message: message
    });
    socket.emit('message', message);
    resp.then(res => {
      if (res.err) {
        alert(res.msg);
      } else {
        loadChat();
      }
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
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    const handleIncomingMessage = () => {
      if (url) {
        loadChat();
      }
    };

    socket.on('message', handleIncomingMessage);

    return () => {
      socket.off('message', handleIncomingMessage);
      socket.disconnect();
    };
  }, [socket, url]);

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
                info={`${chatList.length} message${chatList.length === 1 ? '' : 's'} in this room`}
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
                    userDetails.id === parseInt(chat.user_id, 10)
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
                      <Avatar src={dir === 'outgoing' ? avatar : '/images/avatars/avatar_8.png'} />
                    </Message>
                  );
                })
              ) : (
                <div className={classes.emptyState}>No messages yet. Start the conversation.</div>
              )}
            </MessageList>
            <MessageInput
              attachButton={false}
              onChange={handleMsg}
              onSend={handleSend}
              placeholder="Type a message..."
            />
          </ChatContainer>
        )}
      </MainContainer>
    </div>
  );
};

export default ChatScreen;
