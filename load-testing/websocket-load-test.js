import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const messagesReceived = new Counter('messages_received');

const WS_URL = __ENV.WS_URL || 'ws://localhost:3002';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '2m', target: 200 },
    { duration: '3m', target: 500 },
    { duration: '2m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    errors: ['rate<0.1'],
    messages_received: ['count>100'],
  },
};

export default function () {
  const res = ws.connect(WS_URL, {}, function (socket) {
    socket.on('open', () => {
      socket.send(JSON.stringify({
        type: 'subscribe',
        channel: 'campaigns',
      }));
    });

    socket.on('message', (msg) => {
      messagesReceived.add(1);
      try {
        JSON.parse(msg);
      } catch (e) {
        errorRate.add(1);
      }
    });

    socket.on('error', (e) => {
      errorRate.add(1);
    });

    sleep(30);
    socket.close();
  });

  check(res, {
    'websocket connected': (r) => r && r.status === 101,
  });
}
