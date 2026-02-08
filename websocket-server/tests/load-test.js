/**
 * Load Testing Script for AdStack WebSocket Server
 *
 * This script tests the WebSocket server under various load conditions
 * to ensure it can handle production traffic.
 *
 * Usage:
 *   node tests/load-test.js [options]
 *
 * Options:
 *   --clients=N       Number of concurrent clients (default: 100)
 *   --duration=N      Test duration in seconds (default: 60)
 *   --ramp-up=N       Ramp-up time in seconds (default: 10)
 *   --url=URL         WebSocket server URL (default: http://localhost:3002)
 */

const { io } = require('socket.io-client');
const { performance } = require('perf_hooks');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value;
  return acc;
}, {});

const config = {
  clients: parseInt(args.clients) || 100,
  duration: parseInt(args.duration) || 60,
  rampUp: parseInt(args['ramp-up']) || 10,
  url: args.url || 'http://localhost:3002',
};

// Test metrics
const metrics = {
  connected: 0,
  disconnected: 0,
  errors: 0,
  eventsReceived: 0,
  messagesSent: 0,
  latencies: [],
  startTime: 0,
  endTime: 0,
};

// Active connections
const connections = [];

/**
 * Create a WebSocket client and connect
 */
function createClient(clientId) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();

    const socket = io(config.url, {
      transports: ['websocket', 'polling'],
      reconnection: false, // Disable for load testing
    });

    socket.on('connect', () => {
      const connectionTime = performance.now() - startTime;
      metrics.latencies.push(connectionTime);
      metrics.connected++;

      console.log(`✓ Client ${clientId} connected (${connectionTime.toFixed(2)}ms)`);

      // Subscribe to a test contract
      socket.emit('subscribe', {
        contractId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.campaigns',
        eventTypes: ['campaign_created', 'impression_tracked'],
      });
      metrics.messagesSent++;

      resolve(socket);
    });

    socket.on('event', (event) => {
      metrics.eventsReceived++;
    });

    socket.on('error', (error) => {
      metrics.errors++;
      console.error(`✗ Client ${clientId} error:`, error.message);
    });

    socket.on('disconnect', (reason) => {
      metrics.disconnected++;
      console.log(`- Client ${clientId} disconnected: ${reason}`);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!socket.connected) {
        metrics.errors++;
        socket.close();
        reject(new Error(`Client ${clientId} connection timeout`));
      }
    }, 10000);
  });
}

/**
 * Simulate client activity (sending messages periodically)
 */
function simulateActivity(socket, clientId) {
  const interval = setInterval(() => {
    if (!socket.connected) {
      clearInterval(interval);
      return;
    }

    // Randomly request history or stats
    const actions = [
      () => {
        socket.emit('getHistory', {
          contractId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.campaigns',
          limit: 10,
        });
        metrics.messagesSent++;
      },
      () => {
        socket.emit('getStats', {
          contractId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.campaigns',
        });
        metrics.messagesSent++;
      },
    ];

    const action = actions[Math.floor(Math.random() * actions.length)];
    action();
  }, 5000 + Math.random() * 5000); // 5-10 seconds

  return interval;
}

/**
 * Ramp up clients gradually
 */
async function rampUpClients() {
  console.log(`\n🚀 Starting ramp-up: ${config.clients} clients over ${config.rampUp}s`);

  const clientsPerSecond = config.clients / config.rampUp;
  const delayMs = 1000 / clientsPerSecond;

  for (let i = 0; i < config.clients; i++) {
    try {
      const socket = await createClient(i + 1);
      const interval = simulateActivity(socket, i + 1);
      connections.push({ socket, interval });

      // Delay before next client
      if (i < config.clients - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Failed to create client ${i + 1}:`, error.message);
    }
  }

  console.log(`\n✓ Ramp-up complete: ${metrics.connected}/${config.clients} clients connected\n`);
}

/**
 * Disconnect all clients
 */
function disconnectAll() {
  console.log('\n📡 Disconnecting all clients...');

  connections.forEach(({ socket, interval }) => {
    clearInterval(interval);
    socket.close();
  });

  connections.length = 0;
}

/**
 * Calculate statistics
 */
function calculateStats() {
  const latencies = metrics.latencies;

  if (latencies.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      p50: 0,
      p95: 0,
      p99: 0,
    };
  }

  latencies.sort((a, b) => a - b);

  return {
    min: latencies[0],
    max: latencies[latencies.length - 1],
    avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    p50: latencies[Math.floor(latencies.length * 0.5)],
    p95: latencies[Math.floor(latencies.length * 0.95)],
    p99: latencies[Math.floor(latencies.length * 0.99)],
  };
}

/**
 * Print final report
 */
function printReport() {
  const duration = (metrics.endTime - metrics.startTime) / 1000;
  const stats = calculateStats();

  console.log('\n' + '='.repeat(60));
  console.log('                    LOAD TEST REPORT');
  console.log('='.repeat(60));

  console.log('\n📊 TEST CONFIGURATION');
  console.log(`   Target Clients: ${config.clients}`);
  console.log(`   Duration: ${config.duration}s`);
  console.log(`   Ramp-up: ${config.rampUp}s`);
  console.log(`   URL: ${config.url}`);

  console.log('\n📈 CONNECTION METRICS');
  console.log(`   Connected: ${metrics.connected}`);
  console.log(`   Disconnected: ${metrics.disconnected}`);
  console.log(`   Errors: ${metrics.errors}`);
  console.log(`   Success Rate: ${((metrics.connected / config.clients) * 100).toFixed(2)}%`);

  console.log('\n⚡ LATENCY METRICS (Connection Time)');
  console.log(`   Min: ${stats.min.toFixed(2)}ms`);
  console.log(`   Max: ${stats.max.toFixed(2)}ms`);
  console.log(`   Average: ${stats.avg.toFixed(2)}ms`);
  console.log(`   p50: ${stats.p50.toFixed(2)}ms`);
  console.log(`   p95: ${stats.p95.toFixed(2)}ms`);
  console.log(`   p99: ${stats.p99.toFixed(2)}ms`);

  console.log('\n💬 MESSAGE METRICS');
  console.log(`   Events Received: ${metrics.eventsReceived}`);
  console.log(`   Messages Sent: ${metrics.messagesSent}`);
  console.log(`   Events/Second: ${(metrics.eventsReceived / duration).toFixed(2)}`);

  console.log('\n⏱️  DURATION');
  console.log(`   Total Time: ${duration.toFixed(2)}s`);
  console.log(`   Active Test: ${(duration - config.rampUp).toFixed(2)}s`);

  console.log('\n' + '='.repeat(60));

  // Performance assessment
  const avgLatency = stats.avg;
  const successRate = (metrics.connected / config.clients) * 100;

  console.log('\n🎯 PERFORMANCE ASSESSMENT');

  if (successRate < 95) {
    console.log('   ⚠️  WARNING: Low success rate - server may be overloaded');
  } else if (successRate < 99) {
    console.log('   ⚠️  GOOD: Acceptable success rate');
  } else {
    console.log('   ✓ EXCELLENT: High success rate');
  }

  if (avgLatency > 1000) {
    console.log('   ⚠️  WARNING: High latency - performance issues detected');
  } else if (avgLatency > 500) {
    console.log('   ⚠️  GOOD: Acceptable latency');
  } else {
    console.log('   ✓ EXCELLENT: Low latency');
  }

  if (metrics.errors > 0) {
    console.log(`   ⚠️  WARNING: ${metrics.errors} errors occurred`);
  } else {
    console.log('   ✓ EXCELLENT: No errors');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Print live statistics
 */
function printLiveStats() {
  const elapsed = (performance.now() - metrics.startTime) / 1000;

  console.log('\n' + '-'.repeat(60));
  console.log(`⏱️  Elapsed: ${elapsed.toFixed(1)}s | ` +
              `Connected: ${metrics.connected} | ` +
              `Events: ${metrics.eventsReceived} | ` +
              `Errors: ${metrics.errors}`);
  console.log('-'.repeat(60));
}

/**
 * Main test execution
 */
async function runLoadTest() {
  console.log('\n' + '='.repeat(60));
  console.log('          AdStack WebSocket Load Testing');
  console.log('='.repeat(60));

  metrics.startTime = performance.now();

  try {
    // Ramp up clients
    await rampUpClients();

    // Run test for specified duration
    console.log(`⏳ Running load test for ${config.duration - config.rampUp}s...\n`);

    const statsInterval = setInterval(printLiveStats, 10000); // Every 10 seconds

    await new Promise(resolve =>
      setTimeout(resolve, (config.duration - config.rampUp) * 1000)
    );

    clearInterval(statsInterval);

    // Cleanup
    disconnectAll();

    // Wait a bit for all disconnects to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    metrics.endTime = performance.now();

    // Print final report
    printReport();

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Load test failed:', error);
    disconnectAll();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user');
  disconnectAll();
  metrics.endTime = performance.now();
  printReport();
  process.exit(0);
});

// Run the test
runLoadTest();
