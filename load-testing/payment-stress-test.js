import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const paymentLatency = new Trend('payment_latency', true);

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '2m', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    http_req_failed: ['rate<0.02'],
    errors: ['rate<0.05'],
    payment_latency: ['p(95)<3000'],
  },
};

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`,
};

export default function () {
  const createPaymentRes = http.post(`${BASE_URL}/api/payments/intent`, JSON.stringify({
    amount: Math.floor(Math.random() * 10000) + 100,
    currency: 'usd',
    description: `Load test payment ${Date.now()}`,
  }), { headers });

  check(createPaymentRes, {
    'payment intent created': (r) => r.status === 200 || r.status === 201 || r.status === 401,
    'payment response time < 3000ms': (r) => r.timings.duration < 3000,
  });

  errorRate.add(createPaymentRes.status >= 500);
  paymentLatency.add(createPaymentRes.timings.duration);

  const listPaymentsRes = http.get(`${BASE_URL}/api/payments`, { headers });
  check(listPaymentsRes, {
    'list payments status ok': (r) => r.status === 200 || r.status === 401,
  });
  errorRate.add(listPaymentsRes.status >= 500);

  sleep(2);
}
