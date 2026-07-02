import { Client } from '@stomp/stompjs';

export const createStompClient = () => {
  const token = localStorage.getItem('token');
  const client = new Client({
    brokerURL: 'ws://localhost:8080/ws/mitra',
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
