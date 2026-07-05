import { Client } from '@stomp/stompjs';

export const createStompClient = () => {
  const token = localStorage.getItem('token');
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8086/api/v1';
  
  let computedWsUrl = '';
  if (import.meta.env.VITE_WS_URL) {
    computedWsUrl = import.meta.env.VITE_WS_URL;
  } else {
    const protocol = apiBaseUrl.startsWith('https') ? 'wss' : 'ws';
    const host = apiBaseUrl.replace(/^https?:\/\//, '').split('/')[0];
    computedWsUrl = `${protocol}://${host}/ws/mitra`;
  }

  const client = new Client({
    brokerURL: computedWsUrl,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    debug: function (str) {
      console.log(str);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });
  
  return client;
};
