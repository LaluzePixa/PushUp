# Load Testing Suite

Comprehensive load testing tools for the PushSaaS campaign system.

## 🎯 Quick Start

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run artillery-campaign-load-test.yml

# Generate report
artillery run artillery-campaign-load-test.yml --output results.json
artillery report results.json --output report.html
```

```bash
# Install k6 (see main docs for installation)
# Run stress test
k6 run k6-campaign-stress.js
```

## 📁 Files

### `artillery-campaign-load-test.yml`
Production-grade load testing with Artillery.

**Features**:
- Realistic traffic patterns (warm-up, ramp-up, sustained, spike)
- Multiple campaign scenarios (small, medium, large audiences)
- Custom metrics and validation
- 7 different test scenarios

**Duration**: ~10 minutes  
**Recommended for**: CI/CD pipelines, regular performance checks

### `artillery-functions.js`
Helper functions for Artillery tests.

**Includes**:
- Date generation
- Random data creation
- Metrics logging
- Response validation

### `k6-campaign-stress.js`
Advanced stress testing with k6.

**Features**:
- 4 comprehensive test scenarios
- Custom metrics and thresholds
- HTML report generation
- SLA validation

**Duration**: ~65 minutes  
**Recommended for**: Weekly performance validation, capacity planning

## 📊 Test Scenarios

### Artillery Scenarios
1. **Small Audience** (1K users) - 50% weight
2. **Medium Audience** (10K users) - 30% weight
3. **Scheduled Campaigns** - 10% weight
4. **List Campaigns** - 5% weight
5. **Large Audience** (100K+ users) - 5% weight
6. **Concurrent Creation** - 3% weight
7. **Error Handling** - 2% weight

### k6 Scenarios
1. **Sustained Load**: Normal operation (9 min)
2. **Stress Test**: Push to limits (16 min)
3. **Spike Test**: Sudden traffic bursts (3 min)
4. **Soak Test**: Long-term stability (30 min)

## 🎯 Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Error Rate | < 2% | < 5% |
| P95 Response Time | < 3s | < 5s |
| P99 Response Time | < 7s | < 10s |
| Campaign Success Rate | > 90% | > 85% |
| Throughput | > 100 users/s | > 50 users/s |

## 🔧 Configuration

### Environment Variables

```bash
# Artillery
export TARGET_URL=http://localhost:3000
export TEST_EMAIL=admin@example.com
export TEST_PASSWORD=adminpassword

# k6
export API_URL=http://localhost:3000
export TEST_EMAIL=admin@example.com
export TEST_PASSWORD=adminpassword
```

### Custom Test Duration

```bash
# Artillery - custom phases
artillery run artillery-campaign-load-test.yml \
  --config config.phases[0].duration=120

# k6 - custom duration
k6 run k6-campaign-stress.js --duration 10m --vus 50
```

## 📈 Reports

### Artillery Reports

Reports are automatically generated in JSON format:
```bash
artillery run artillery-campaign-load-test.yml --output report.json
artillery report report.json --output report.html
```

Open `report.html` in your browser to view detailed metrics.

### k6 Reports

k6 generates three outputs:
- **Console**: Real-time metrics
- **JSON**: `load-test-results.json`
- **HTML**: `load-test-summary.html`

## 🚨 Troubleshooting

### Artillery: Connection Refused
```bash
# Ensure server is running
npm run dev

# Check server is accessible
curl http://localhost:3000/healthz
```

### k6: High Error Rate
```bash
# Run with verbose logging
k6 run --verbose k6-campaign-stress.js

# Check server logs for errors
tail -f server/logs/error.log
```

### Performance Issues
```bash
# Optimize database for testing
docker-compose -f docker-compose.test.yml up -d

# Increase Node.js memory
node --max-old-space-size=4096 server.js
```

## 📚 Additional Documentation

See [LOAD_TESTING.md](../LOAD_TESTING.md) for comprehensive documentation including:
- Detailed setup instructions
- Performance benchmarks
- Best practices
- CI/CD integration
- Monitoring recommendations

## 🔗 Related Tests

- **Unit Tests**: `server/src/__tests__/campaign-million-users.test.js`
- **Integration Tests**: `server/src/__tests__/campaign-scale.test.js`

## 📝 Notes

- Tests use mocked web-push for reproducibility
- Database should be optimized for testing (see docs)
- Large-scale tests (100K+) are skipped by default
- Always test in a non-production environment first

## 🤝 Contributing

When adding new test scenarios:
1. Add to appropriate file (Artillery or k6)
2. Update this README
3. Document expected results
4. Add to CI/CD pipeline if appropriate

---

**For detailed information, see [LOAD_TESTING.md](../LOAD_TESTING.md)**
