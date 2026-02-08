/**
 * Stress Testing Script for AdStack WebSocket Server
 *
 * This script progressively increases load until the server breaks
 * to find the maximum capacity.
 *
 * Usage:
 *   node tests/stress-test.js [options]
 *
 * Options:
 *   --start=N         Starting number of clients (default: 50)
 *   --increment=N     Clients to add each step (default: 50)
 *   --max=N           Maximum clients (default: 1000)
 *   --step-duration=N Duration of each step in seconds (default: 30)
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
  start: parseInt(args.start) || 50,
  increment: parseInt(args.increment) || 50,
  max: parseInt(args.max) || 1000,
  stepDuration: parseInt(args['step-duration']) || 30,
  url: args.url || 'http://localhost:3002',
};

// Test state
const state = {
  currentClients: 0,
  step: 0,
  connections: [],
  breakingPoint: null,
  stepMetrics: [],
};

// Current step metrics
let currentMetrics = {
  connected: 0,
  failed: 0,
  errors: 0,
  eventsReceived: 0,
  latencies: [],
};

/**
 * Create a WebSocket client
 */
function createClient(clientId) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();

    const socket = io(config.url, {
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 5000,
    });

    const timeout = setTimeout(() => {
      currentMetrics.failed++;
      socket.close();
      reject(new Error('Connection timeout'));
    }, 5000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      const connectionTime = performance.now() - startTime;
      currentMetrics.latencies.push(connectionTime);
      currentMetrics.connected++;

      // Subscribe to events
      socket.emit('subscribe', {
        contractId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.campaigns',
      });

      resolve(socket);
    });

    socket.on('event', () => {
      currentMetrics.eventsReceived++;
    });

    socket.on('error', (error) => {
      currentMetrics.errors++;
    });

    socket.on('disconnect', () => {
      currentMetrics.connected--;
    });
  });
}

/**
 * Add clients for current step
 */
async function addClients(count) {
  console.log(`\n📈 Adding ${count} clients...`);

  const promises = [];
  for (let i = 0; i < count; i++) {
    const clientId = state.currentClients + i + 1;
    promises.push(
      createClient(clientId).catch(err => {
        console.error(`Client ${clientId} failed: ${err.message}`);
        return null;
      })
    );

    // Small delay to avoid overwhelming the server
    if (i % 10 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const sockets = await Promise.all(promises);
  const successful = sockets.filter(s => s !== null);

  state.connections.push(...successful);
  state.currentClients = state.connections.length;

  console.log(`✓ Connected: ${currentMetrics.connected}/${count}`);

  return successful.length === count;
}

/**
 * Calculate step statistics
 */
function calculateStepStats() {
  const latencies = currentMetrics.latencies;

  if (latencies.length === 0) {
    return { min: 0, max: 0, avg: 0, p95: 0, p99: 0 };
  }

  latencies.sort((a, b) => a - b);

  return {
    min: latencies[0],
    max: latencies[latencies.length - 1],
    avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    p95: latencies[Math.floor(latencies.length * 0.95)],
    p99: latencies[Math.floor(latencies.length * 0.99)],
  };
}

/**
 * Run a single test step
 */
async function runStep() {
  state.step++;
  const targetClients = Math.min(
    config.start + (state.step - 1) * config.increment,
    config.max
  );
  const clientsToAdd = targetClients - state.currentClients;

  console.log('\n' + '='.repeat(60));
  console.log(`STEP ${state.step}: Testing with ${targetClients} clients`);
  console.log('='.repeat(60));

  // Reset metrics for this step
  currentMetrics = {
    connected: state.connections.length,
    failed: 0,
    errors: 0,
    eventsReceived: 0,
    latencies: [],
  };

  // Add new clients
  const success = await addClients(clientsToAdd);

  // Run for step duration
  console.log(`\n⏳ Running for ${config.stepDuration}s...`);
  const startEvents = currentMetrics.eventsReceived;
  const startTime = Date.now();

  await new Promise(resolve => setTimeout(resolve, config.stepDuration * 1000));

  const duration = (Date.now() - startTime) / 1000;
  const eventsPerSecond = (currentMetrics.eventsReceived - startEvents) / duration;

  // Calculate statistics
  const stats = calculateStepStats();
  const successRate = (currentMetrics.connected / targetClients) * 100;

  // Store step results
  const stepResult = {
    step: state.step,
    targetClients,
    connected: currentMetrics.connected,
    failed: currentMetrics.failed,
    errors: currentMetrics.errors,
    successRate,
    eventsPerSecond,
    latency: stats,
  };

  state.stepMetrics.push(stepResult);

  // Print step results
  console.log('\n📊 STEP RESULTS:');
  console.log(`   Clients: ${currentMetrics.connected}/${targetClients}`);
  console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
  console.log(`   Failed Connections: ${currentMetrics.failed}`);
  console.log(`   Errors: ${currentMetrics.errors}`);
  console.log(`   Events/Second: ${eventsPerSecond.toFixed(2)}`);
  console.log(`   Avg Latency: ${stats.avg.toFixed(2)}ms`);
  console.log(`   p95 Latency: ${stats.p95.toFixed(2)}ms`);

  // Check if we've reached breaking point
  const breaking = successRate < 90 || stats.p95 > 2000 || currentMetrics.errors > 10;

  if (breaking) {
    state.breakingPoint = {
      clients: targetClients,
      successRate,
      avgLatency: stats.avg,
      p95Latency: stats.p95,
      errors: currentMetrics.errors,
    };
    console.log('\n⚠️  BREAKING POINT DETECTED!');
    return false;
  }

  console.log('\n✓ Step passed');
  return targetClients < config.max && success;
}

/**
 * Cleanup all connections
 */
function cleanup() {
  console.log('\n🧹 Cleaning up connections...');
  state.connections.forEach(socket => socket.close());
  state.connections = [];
}

/**
 * Print final report
 */
function printFinalReport() {
  console.log('\n\n' + '='.repeat(60));
  console.log('              STRESS TEST FINAL REPORT');
  console.log('='.repeat(60));

  console.log('\n📊 TEST CONFIGURATION');
  console.log(`   Starting Clients: ${config.start}`);
  console.log(`   Increment: ${config.increment}`);
  console.log(`   Max Clients: ${config.max}`);
  console.log(`   Step Duration: ${config.stepDuration}s`);
  console.log(`   URL: ${config.url}`);

  console.log('\n📈 STEP-BY-STEP RESULTS\n');

  state.stepMetrics.forEach((step, index) => {
    const status = step.successRate >= 95 ? '✓' : '⚠️';
    console.log(`   ${status} Step ${step.step}: ${step.connected}/${step.targetClients} clients`);
    console.log(`      Success Rate: ${step.successRate.toFixed(2)}%`);
    console.log(`      Events/s: ${step.eventsPerSecond.toFixed(2)}`);
    console.log(`      Latency: ${step.latency.avg.toFixed(2)}ms (p95: ${step.latency.p95.toFixed(2)}ms)`);
    console.log(`      Errors: ${step.errors}`);
    console.log('');
  });

  if (state.breakingPoint) {
    console.log('⚠️  BREAKING POINT');
    console.log(`   Maximum Clients: ${state.breakingPoint.clients}`);
    console.log(`   Success Rate: ${state.breakingPoint.successRate.toFixed(2)}%`);
    console.log(`   Average Latency: ${state.breakingPoint.avgLatency.toFixed(2)}ms`);
    console.log(`   p95 Latency: ${state.breakingPoint.p95Latency.toFixed(2)}ms`);
    console.log(`   Errors: ${state.breakingPoint.errors}`);

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    const safeLimit = Math.max(config.start, state.breakingPoint.clients - config.increment);
    console.log(`   Safe Production Limit: ~${safeLimit} concurrent connections`);
    console.log(`   Recommended Limit (with buffer): ~${Math.floor(safeLimit * 0.75)} connections`);
  } else {
    console.log('✓ NO BREAKING POINT FOUND');
    console.log(`   Server handled ${state.currentClients} clients successfully`);
    console.log(`   Consider increasing --max to find the limit`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Main stress test execution
 */
async function runStressTest() {
  console.log('\n' + '='.repeat(60));
  console.log('        AdStack WebSocket Stress Testing');
  console.log('='.repeat(60));

  try {
    let continueTest = true;

    while (continueTest) {
      continueTest = await runStep();

      if (!continueTest) {
        break;
      }

      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    cleanup();
    printFinalReport();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Stress test failed:', error);
    cleanup();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user');
  cleanup();
  printFinalReport();
  process.exit(0);
});

// Run the test
runStressTest();
