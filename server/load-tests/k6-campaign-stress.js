/**
 * k6 Load Testing Script for Campaign API
 * 
 * This script performs comprehensive stress testing on the campaign system
 * to validate performance under extreme load conditions.
 * 
 * Usage:
 *   k6 run k6-campaign-stress.js
 *   k6 run k6-campaign-stress.js --vus 100 --duration 5m
 *   k6 run k6-campaign-stress.js --out json=results.json
 * 
 * Scenarios tested:
 * - Sustained load (normal operation)
 * - Stress test (push system to limits)
 * - Spike test (sudden traffic bursts)
 * - Soak test (long-duration stability)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom metrics
const campaignCreationRate = new Rate('campaign_creation_success');
const campaignSendRate = new Rate('campaign_send_success');
const notificationsSent = new Counter('notifications_sent_total');
const notificationsFailed = new Counter('notifications_failed_total');
const campaignDuration = new Trend('campaign_send_duration');
const throughput = new Trend('notifications_per_second');

// Test configuration
export const options = {
    scenarios: {
        // Scenario 1: Sustained Load Test
        sustained_load: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 20 },   // Ramp up to 20 users
                { duration: '5m', target: 20 },   // Stay at 20 users
                { duration: '2m', target: 0 },    // Ramp down
            ],
            gracefulRampDown: '30s',
            exec: 'sustainedLoad',
        },

        // Scenario 2: Stress Test - Push to limits
        stress_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 50 },   // Ramp up to 50
                { duration: '5m', target: 50 },   // Stay at 50
                { duration: '2m', target: 100 },  // Push to 100
                { duration: '5m', target: 100 },  // Maintain 100
                { duration: '2m', target: 150 },  // Push to 150
                { duration: '3m', target: 150 },  // Brief period at 150
                { duration: '2m', target: 0 },    // Ramp down
            ],
            gracefulRampDown: '1m',
            exec: 'stressTest',
            startTime: '10m', // Start after sustained load
        },

        // Scenario 3: Spike Test - Sudden load
        spike_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '10s', target: 5 },    // Normal load
                { duration: '10s', target: 200 },  // Sudden spike!
                { duration: '1m', target: 200 },   // Maintain spike
                { duration: '10s', target: 5 },    // Drop back down
                { duration: '1m', target: 5 },     // Normal again
                { duration: '10s', target: 0 },    // End
            ],
            exec: 'spikeTest',
            startTime: '30m', // Start after stress test
        },

        // Scenario 4: Soak Test - Long duration stability
        soak_test: {
            executor: 'constant-vus',
            vus: 30,
            duration: '30m',
            exec: 'soakTest',
            startTime: '35m', // Start after spike test
        },
    },

    // Thresholds - Define SLA requirements
    thresholds: {
        http_req_failed: ['rate<0.05'],              // Less than 5% error rate
        http_req_duration: ['p(95)<5000', 'p(99)<10000'], // 95% < 5s, 99% < 10s
        campaign_creation_success: ['rate>0.90'],    // 90% success rate for creation
        campaign_send_success: ['rate>0.85'],        // 85% success rate for sending
        campaign_send_duration: ['p(95)<30000'],     // 95% of campaigns sent in < 30s
    },
};

// Base URL configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Test data
const credentials = {
    email: __ENV.TEST_EMAIL || 'admin@example.com',
    password: __ENV.TEST_PASSWORD || 'adminpassword',
};

// Helper function to authenticate
function authenticate() {
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(credentials), {
        headers: { 'Content-Type': 'application/json' },
    });

    check(loginRes, {
        'login successful': (r) => r.status === 200,
        'token received': (r) => r.json('token') !== undefined,
    });

    return loginRes.json('token');
}

// Helper function to create campaign
function createCampaign(token, campaignData) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    const payload = JSON.stringify(campaignData);
    const res = http.post(`${BASE_URL}/campaigns`, payload, { headers });

    const success = check(res, {
        'campaign created': (r) => r.status === 201,
        'has campaign id': (r) => r.json('campaign.id') !== undefined,
        'has execution data': (r) => r.json('execution') !== undefined,
    });

    campaignCreationRate.add(success);

    if (success && res.json('execution')) {
        const execution = res.json('execution');
        const sent = execution.sent || 0;
        const failed = execution.failed || 0;
        const total = execution.total || 0;

        notificationsSent.add(sent);
        notificationsFailed.add(failed);

        if (total > 0) {
            const sendSuccess = sent / total > 0.8; // 80% success threshold
            campaignSendRate.add(sendSuccess);
        }
    }

    return res;
}

/**
 * Scenario 1: Sustained Load Test
 * Tests normal operation with consistent load
 */
export function sustainedLoad() {
    const token = authenticate();

    if (!token) {
        sleep(1);
        return;
    }

    // Create small to medium campaigns
    const campaignSize = Math.random() < 0.7 ? 'small' : 'medium';
    const siteId = Math.floor(Math.random() * 3) + 1; // Sites 1-3

    const campaignData = {
        name: `Sustained Load - ${campaignSize} - ${Date.now()}`,
        title: 'Regular Campaign',
        body: 'This is a regular campaign under normal load',
        siteId: siteId,
        sendType: 'immediate',
        clickUrl: 'https://example.com/campaign',
    };

    const startTime = Date.now();
    const res = createCampaign(token, campaignData);
    const duration = Date.now() - startTime;

    campaignDuration.add(duration);

    if (res.json('execution.total') > 0) {
        const usersPerSecond = res.json('execution.total') / (duration / 1000);
        throughput.add(usersPerSecond);
    }

    sleep(Math.random() * 3 + 2); // 2-5 seconds think time
}

/**
 * Scenario 2: Stress Test
 * Pushes system to its limits
 */
export function stressTest() {
    const token = authenticate();

    if (!token) {
        sleep(0.5);
        return;
    }

    // Create medium to large campaigns
    const campaignTypes = ['medium', 'large', 'large', 'xlarge'];
    const campaignSize = campaignTypes[Math.floor(Math.random() * campaignTypes.length)];
    const siteId = Math.floor(Math.random() * 5) + 1; // Sites 1-5

    const campaignData = {
        name: `Stress Test - ${campaignSize} - ${Date.now()}`,
        title: 'High Load Campaign',
        body: 'Testing system under stress conditions',
        siteId: siteId,
        sendType: 'immediate',
        iconUrl: 'https://example.com/icon.png',
        clickUrl: 'https://example.com/stress-test',
    };

    const startTime = Date.now();
    const res = createCampaign(token, campaignData);
    const duration = Date.now() - startTime;

    campaignDuration.add(duration);

    check(res, {
        'stress test response time acceptable': (r) => duration < 60000, // < 1 minute
    });

    sleep(Math.random() * 2 + 1); // 1-3 seconds think time
}

/**
 * Scenario 3: Spike Test
 * Tests behavior during sudden traffic spikes
 */
export function spikeTest() {
    const token = authenticate();

    if (!token) {
        sleep(0.2);
        return;
    }

    // Quick campaign creation
    const siteId = Math.floor(Math.random() * 3) + 1;

    const campaignData = {
        name: `Spike Test - ${Date.now()}`,
        title: 'Spike Traffic',
        body: 'Campaign during traffic spike',
        siteId: siteId,
        sendType: 'immediate',
        clickUrl: 'https://example.com/spike',
    };

    const startTime = Date.now();
    const res = createCampaign(token, campaignData);
    const duration = Date.now() - startTime;

    campaignDuration.add(duration);

    check(res, {
        'spike handled gracefully': (r) => r.status === 201 || r.status === 429 || r.status === 503,
        'spike response time': (r) => duration < 30000, // Should respond within 30s even under spike
    });

    sleep(Math.random() * 0.5); // Minimal think time during spike
}

/**
 * Scenario 4: Soak Test
 * Tests long-duration stability and memory leaks
 */
export function soakTest() {
    const token = authenticate();

    if (!token) {
        sleep(1);
        return;
    }

    // Mix of campaign sizes
    const campaignSizes = ['small', 'small', 'medium', 'medium', 'large'];
    const campaignSize = campaignSizes[Math.floor(Math.random() * campaignSizes.length)];
    const siteId = Math.floor(Math.random() * 3) + 1;

    const campaignData = {
        name: `Soak Test - ${campaignSize} - ${Date.now()}`,
        title: 'Long Duration Test',
        body: 'Testing system stability over time',
        siteId: siteId,
        sendType: 'immediate',
        clickUrl: 'https://example.com/soak',
    };

    const startTime = Date.now();
    const res = createCampaign(token, campaignData);
    const duration = Date.now() - startTime;

    campaignDuration.add(duration);

    check(res, {
        'soak test successful': (r) => r.status === 201,
        'soak test consistent performance': (r) => duration < 45000, // Should stay consistent
    });

    sleep(Math.random() * 5 + 3); // 3-8 seconds think time
}

/**
 * Setup function - runs once before test
 */
export function setup() {
    console.log('🚀 Starting k6 Campaign Load Tests');
    console.log(`📍 Target: ${BASE_URL}`);
    console.log(`⏱️  Duration: ~65 minutes total`);
    console.log('');
    console.log('Scenarios:');
    console.log('  1. Sustained Load: 9 min');
    console.log('  2. Stress Test: 16 min');
    console.log('  3. Spike Test: 3 min');
    console.log('  4. Soak Test: 30 min');
    console.log('');
}

/**
 * Teardown function - runs once after test
 */
export function teardown(data) {
    console.log('');
    console.log('✅ k6 Campaign Load Tests completed');
}

/**
 * Handle summary for custom reporting
 */
export function handleSummary(data) {
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
        'load-test-results.json': JSON.stringify(data),
        'load-test-summary.html': htmlReport(data),
    };
}

// Helper function for text summary
function textSummary(data, options) {
    let summary = '\n';
    summary += '═══════════════════════════════════════════════════\n';
    summary += '          CAMPAIGN LOAD TEST RESULTS\n';
    summary += '═══════════════════════════════════════════════════\n\n';

    // HTTP metrics
    summary += '📊 HTTP Metrics:\n';
    summary += `   Requests: ${data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0}\n`;
    summary += `   Failed: ${data.metrics.http_req_failed ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) : 0}%\n`;
    summary += `   Duration p95: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'].toFixed(2) : 0}ms\n`;
    summary += `   Duration p99: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(99)'].toFixed(2) : 0}ms\n\n`;

    // Campaign metrics
    summary += '📧 Campaign Metrics:\n';
    summary += `   Creation Success: ${data.metrics.campaign_creation_success ? (data.metrics.campaign_creation_success.values.rate * 100).toFixed(2) : 0}%\n`;
    summary += `   Send Success: ${data.metrics.campaign_send_success ? (data.metrics.campaign_send_success.values.rate * 100).toFixed(2) : 0}%\n`;
    summary += `   Notifications Sent: ${data.metrics.notifications_sent_total ? data.metrics.notifications_sent_total.values.count : 0}\n`;
    summary += `   Notifications Failed: ${data.metrics.notifications_failed_total ? data.metrics.notifications_failed_total.values.count : 0}\n`;

    if (data.metrics.notifications_per_second) {
        summary += `   Avg Throughput: ${data.metrics.notifications_per_second.values.avg.toFixed(2)} notifications/s\n`;
    }

    summary += '\n═══════════════════════════════════════════════════\n';

    return summary;
}

// Helper function for HTML report
function htmlReport(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>k6 Campaign Load Test Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 3px solid #7d64ff; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; min-width: 200px; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .metric-value { font-size: 24px; font-weight: bold; color: #7d64ff; }
    .pass { color: #28a745; }
    .fail { color: #dc3545; }
    .warn { color: #ffc107; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #7d64ff; color: white; }
    tr:hover { background-color: #f5f5f5; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Campaign Load Test Results</h1>
    <p><strong>Test Date:</strong> ${new Date().toISOString()}</p>
    
    <h2>Summary Metrics</h2>
    <div class="metric">
      <div class="metric-label">Total Requests</div>
      <div class="metric-value">${data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Error Rate</div>
      <div class="metric-value ${data.metrics.http_req_failed && data.metrics.http_req_failed.values.rate < 0.05 ? 'pass' : 'fail'}">
        ${data.metrics.http_req_failed ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) : 0}%
      </div>
    </div>
    <div class="metric">
      <div class="metric-label">Notifications Sent</div>
      <div class="metric-value">${data.metrics.notifications_sent_total ? data.metrics.notifications_sent_total.values.count : 0}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Campaign Success Rate</div>
      <div class="metric-value ${data.metrics.campaign_send_success && data.metrics.campaign_send_success.values.rate > 0.85 ? 'pass' : 'warn'}">
        ${data.metrics.campaign_send_success ? (data.metrics.campaign_send_success.values.rate * 100).toFixed(2) : 0}%
      </div>
    </div>

    <h2>Performance Metrics</h2>
    <table>
      <tr>
        <th>Metric</th>
        <th>Min</th>
        <th>Avg</th>
        <th>Median</th>
        <th>P95</th>
        <th>P99</th>
        <th>Max</th>
      </tr>
      <tr>
        <td>HTTP Request Duration (ms)</td>
        <td>${data.metrics.http_req_duration ? data.metrics.http_req_duration.values.min.toFixed(2) : 0}</td>
        <td>${data.metrics.http_req_duration ? data.metrics.http_req_duration.values.avg.toFixed(2) : 0}</td>
        <td>${data.metrics.http_req_duration ? data.metrics.http_req_duration.values.med.toFixed(2) : 0}</td>
        <td>${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'].toFixed(2) : 0}</td>
        <td>${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(99)'].toFixed(2) : 0}</td>
        <td>${data.metrics.http_req_duration ? data.metrics.http_req_duration.values.max.toFixed(2) : 0}</td>
      </tr>
      <tr>
        <td>Campaign Send Duration (ms)</td>
        <td>${data.metrics.campaign_send_duration ? data.metrics.campaign_send_duration.values.min.toFixed(2) : 0}</td>
        <td>${data.metrics.campaign_send_duration ? data.metrics.campaign_send_duration.values.avg.toFixed(2) : 0}</td>
        <td>${data.metrics.campaign_send_duration ? data.metrics.campaign_send_duration.values.med.toFixed(2) : 0}</td>
        <td>${data.metrics.campaign_send_duration ? data.metrics.campaign_send_duration.values['p(95)'].toFixed(2) : 0}</td>
        <td>${data.metrics.campaign_send_duration ? data.metrics.campaign_send_duration.values['p(99)'].toFixed(2) : 0}</td>
        <td>${data.metrics.campaign_send_duration ? data.metrics.campaign_send_duration.values.max.toFixed(2) : 0}</td>
      </tr>
    </table>

    <h2>Test Conclusion</h2>
    <p>${data.metrics.http_req_failed && data.metrics.http_req_failed.values.rate < 0.05 ?
            '✅ <strong class="pass">Test PASSED</strong> - System performed within acceptable thresholds' :
            '❌ <strong class="fail">Test FAILED</strong> - System exceeded acceptable error rates'}</p>
  </div>
</body>
</html>
  `;
}
