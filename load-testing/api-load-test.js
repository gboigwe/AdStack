import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency', true);

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 50 },
    { duration: '5m', target: 100 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.1'],
  },
  tags: {
    testid: 'api-load-test',
  },
};

export default function () {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      'health status is 200': (r) => r.status === 200,
      'health response time < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(res.status !== 200);
    apiLatency.add(res.timings.duration);
  });

  group('Campaign Endpoints', () => {
    const listRes = http.get(`${BASE_URL}/api/campaigns`, {
      headers: { 'Content-Type': 'application/json' },
    });
    check(listRes, {
      'campaigns list status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'campaigns response time < 2000ms': (r) => r.timings.duration < 2000,
    });
    errorRate.add(listRes.status >= 500);
    apiLatency.add(listRes.timings.duration);
  });

  group('Subscription Endpoints', () => {
    const subRes = http.get(`${BASE_URL}/api/subscriptions`, {
      headers: { 'Content-Type': 'application/json' },
    });
    check(subRes, {
      'subscriptions status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'subscriptions response time < 2000ms': (r) => r.timings.duration < 2000,
    });
    errorRate.add(subRes.status >= 500);
    apiLatency.add(subRes.timings.duration);
  });

  group('Analytics Endpoints', () => {
    const analyticsRes = http.get(`${BASE_URL}/api/analytics/overview`, {
      headers: { 'Content-Type': 'application/json' },
    });
    check(analyticsRes, {
      'analytics status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(analyticsRes.status >= 500);
    apiLatency.add(analyticsRes.timings.duration);
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'load-testing/results/api-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, opts) {
  const metrics = data.metrics;
  let output = '\n=== Load Test Summary ===\n\n';
  output += `Total Requests: ${metrics.http_reqs?.values?.count || 0}\n`;
  output += `Failed Requests: ${metrics.http_req_failed?.values?.rate || 0}\n`;
  output += `Avg Duration: ${Math.round(metrics.http_req_duration?.values?.avg || 0)}ms\n`;
  output += `P95 Duration: ${Math.round(metrics.http_req_duration?.values?.['p(95)'] || 0)}ms\n`;
  output += `P99 Duration: ${Math.round(metrics.http_req_duration?.values?.['p(99)'] || 0)}ms\n`;
  return output;
}
