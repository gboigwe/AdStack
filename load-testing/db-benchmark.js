import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const queryLatency = new Trend('db_query_latency', true);

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    read_heavy: {
      executor: 'constant-vus',
      vus: 30,
      duration: '5m',
      tags: { scenario: 'read_heavy' },
    },
    write_heavy: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      startTime: '1m',
      tags: { scenario: 'write_heavy' },
    },
  },
  thresholds: {
    'http_req_duration{scenario:read_heavy}': ['p(95)<1000'],
    'http_req_duration{scenario:write_heavy}': ['p(95)<2000'],
  },
};

export default function () {
  const scenario = __ENV.SCENARIO || 'read_heavy';

  if (scenario === 'write_heavy' || exec.scenario.name === 'write_heavy') {
    const res = http.post(`${BASE_URL}/api/campaigns`, JSON.stringify({
      name: `Benchmark Campaign ${Date.now()}`,
      budget: Math.floor(Math.random() * 10000),
      status: 'draft',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, { 'write status ok': (r) => r.status < 500 });
    queryLatency.add(res.timings.duration);
  } else {
    const res = http.get(`${BASE_URL}/api/campaigns?limit=20`);
    check(res, { 'read status ok': (r) => r.status < 500 });
    queryLatency.add(res.timings.duration);
  }

  sleep(0.5);
}

import exec from 'k6/execution';
