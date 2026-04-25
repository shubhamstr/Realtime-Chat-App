import axiosClient from './api-client';

export function sendMessageAPI(payload) {
  return axiosClient.post('/chat/insert', payload).then(resp => {
    // console.log(resp);
    return resp.data;
  });
}

export function getAllChatAPI(payload) {
  return axiosClient
    .get('/chat/get-all', {
      params: payload
    })
    .then(resp => {
      // console.log(resp);
      return resp.data;
    });
}

export function deleteChatAPI(payload) {
  return axiosClient.delete('/chat/delete', { data: payload }).then(resp => {
    return resp.data;
  });
}

export function updateChatNotificationSettingsAPI(payload) {
  return axiosClient.post('/chat/update-notification-email', payload).then(resp => {
    return resp.data;
  });
}
