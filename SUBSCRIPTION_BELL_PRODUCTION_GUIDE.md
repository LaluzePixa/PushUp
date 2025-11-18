# Subscription Bell - Production Deployment Guide

## 🌐 How It Works in Production

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT WEBSITE                          │
│                                                             │
│  1. Embed Widget Script                                    │
│     <meta name="pushsaas-site-id" content="123">          │
│     <script src="https://pushsaas.com/widget.js"></script> │
│                                                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Loads Config & Subscribes
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              PUSHSAAS API SERVER                            │
│                                                             │
│  GET /api/subscription-bell/widget-config?siteId=123       │
│  POST /subscribe (with siteId)                             │
│  POST /api/subscription-bell/config (admin only)           │
│                                                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Reads/Writes
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL DATABASE                        │
│                                                             │
│  Table: subscription_bell_configs                          │
│  ├─ id, site_id (FK to sites)                             │
│  ├─ style, position, theme, theme_color                    │
│  ├─ titles, button texts, headings                         │
│  └─ is_active, created_at, updated_at                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Production Deployment Steps

### 1. Database Setup

**Run migration on production database:**
```bash
# SSH into production server
ssh user@production-server

# Navigate to server directory
cd /path/to/pushsaas/server

# Run migration (creates subscription_bell_configs table)
NODE_ENV=production node scripts/migrate.js
```

**Verify table creation:**
```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Check table exists
\dt subscription_bell_configs

# View structure
\d subscription_bell_configs

# Exit
\q
```

### 2. Environment Variables

**Required environment variables:**
```bash
# .env file or hosting platform config
DATABASE_URL=postgresql://user:pass@host:5432/database
NODE_ENV=production
PORT=3000
```

### 3. Widget Deployment

**Update widget CDN URLs:**

In production, the widget needs to be accessible via CDN:

```javascript
// Option 1: Self-hosted
<script src="https://your-pushsaas-domain.com/pushsaas-widget.js"></script>

// Option 2: CDN (recommended)
<script src="https://cdn.your-domain.com/pushsaas/widget.js"></script>
```

**Update serverUrl in widget:**
```javascript
// In pushsaas-widget.js
const config = {
    siteId: siteIdMeta.getAttribute('content'),
    serverUrl: serverUrlMeta ? 
        serverUrlMeta.getAttribute('content') : 
        'https://api.pushsaas.com', // Production API URL
    debug: false // MUST be false in production
};
```

### 4. Admin Settings Page

**Access control for settings page:**

The `/subs-bell.html` page requires authentication. Update your routing:

```javascript
// Option 1: Serve through authenticated admin panel
// Frontend dashboard at: https://admin.pushsaas.com/settings/subscription-bell?siteId=123

// Option 2: Add auth middleware to the HTML route
app.get('/subs-bell.html', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/subs-bell.html'));
});
```

**Better approach - Integrate into main admin dashboard:**
Instead of standalone HTML, integrate into your React/Next.js admin panel:

```typescript
// frontend/src/app/dashboard/sites/[siteId]/subscription-bell/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function SubscriptionBellSettings({ params }) {
  const [config, setConfig] = useState(null);
  const siteId = params.siteId;

  useEffect(() => {
    // Load config from API
    fetch(`/api/subscription-bell/config?siteId=${siteId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setConfig(data.data));
  }, [siteId]);

  // Render settings UI...
}
```

## 🔐 Security Considerations

### 1. CORS Configuration

**Allow widget to load from client domains:**

```javascript
// server/src/index.js
import cors from 'cors';

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests from registered client domains
    pool.query('SELECT domain FROM sites WHERE is_active = true')
      .then(result => {
        const allowedDomains = result.rows.map(r => r.domain);
        if (!origin || allowedDomains.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      });
  },
  credentials: true
}));
```

### 2. Rate Limiting

**Protect the widget-config endpoint:**

```javascript
import rateLimit from 'express-rate-limit';

const widgetLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: 'Too many requests from this IP'
});

app.get('/api/subscription-bell/widget-config', widgetLimiter, async (req, res) => {
  // ... handler code
});
```

### 3. API Authentication

**Admin endpoints already protected:**
```javascript
// ✅ Already implemented
router.post('/config', authenticateToken, authorizeRoles('admin', 'superadmin'), ...)
router.post('/toggle', authenticateToken, authorizeRoles('admin', 'superadmin'), ...)
```

**Public endpoints (no auth needed):**
```javascript
// These must remain public for widget to work
router.get('/config', ...) // Used by settings page
router.get('/widget-config', ...) // Used by embedded widget
```

## 🚀 Client Integration

### For Website Owners

**Step 1: Get your Site ID**
```
Login to PushSaaS Dashboard → Sites → Your Site → Copy Site ID
```

**Step 2: Add meta tags to website**
```html
<!DOCTYPE html>
<html>
<head>
  <!-- PushSaaS Configuration -->
  <meta name="pushsaas-site-id" content="123">
  <meta name="pushsaas-server-url" content="https://api.pushsaas.com">
</head>
<body>
  <!-- Your content -->
  
  <!-- Load PushSaaS Widget (before closing body tag) -->
  <script src="https://api.pushsaas.com/pushsaas-widget.js"></script>
</body>
</html>
```

**Step 3: Configure appearance**
```
Login → Sites → Select Site → Subscription Bell Settings
- Choose style (Rounded/Square)
- Choose position (Bottom Right, etc.)
- Customize colors and text
- Save changes
```

### Alternative: Manual Initialization

For more control:

```html
<script src="https://api.pushsaas.com/pushsaas-widget.js"></script>
<script>
  // Manual initialization
  const widget = new PushSaaSWidget({
    siteId: 123,
    serverUrl: 'https://api.pushsaas.com',
    debug: false
  });
</script>
```

## 📊 Production Workflow

### 1. Admin Creates Site
```javascript
POST /api/sites
{
  "name": "My Website",
  "domain": "example.com",
  "description": "Main corporate website"
}

Response: { success: true, data: { id: 123, ... } }
```

### 2. Admin Configures Subscription Bell
```javascript
// First access creates default config automatically
GET /api/subscription-bell/config?siteId=123

// Or customize via settings page
POST /api/subscription-bell/config
{
  "siteId": 123,
  "style": "Rounded",
  "position": "Bottom Right",
  "theme": "Dark",
  "themeColor": "#4A90E2",
  "defaultTitle": "Subscribe to our updates!",
  "defaultButtonText": "SUBSCRIBE NOW",
  ...
}
```

### 3. Client Embeds Widget
```html
<meta name="pushsaas-site-id" content="123">
<script src="https://api.pushsaas.com/pushsaas-widget.js"></script>
```

### 4. Widget Loads on Client Site
```
1. Widget reads siteId from meta tag
2. Fetches config: GET /api/subscription-bell/widget-config?siteId=123
3. Renders bell icon with configured style
4. User clicks → Shows subscription modal
5. User subscribes → POST /subscribe (with siteId)
6. Subscription saved to database
```

### 5. Send Campaigns
```javascript
POST /api/campaigns
{
  "siteId": 123,
  "title": "New Product Launch!",
  "body": "Check out our latest product",
  ...
}
```

## 🔧 Production Optimizations

### 1. Caching

**Cache widget config:**
```javascript
import NodeCache from 'node-cache';
const configCache = new NodeCache({ stdTTL: 300 }); // 5 minutes

router.get('/widget-config', async (req, res) => {
  const { siteId } = req.query;
  const cacheKey = `widget-config-${siteId}`;
  
  // Check cache first
  let config = configCache.get(cacheKey);
  
  if (!config) {
    const service = new SubscriptionBellService(pool);
    config = await service.getOrCreateConfig(parseInt(siteId));
    configCache.set(cacheKey, config);
  }
  
  res.json({ success: true, data: config });
});
```

**Invalidate cache on update:**
```javascript
router.post('/config', authenticateToken, async (req, res) => {
  // ... update config
  
  // Invalidate cache
  configCache.del(`widget-config-${siteId}`);
  
  // ... return response
});
```

### 2. CDN Setup

**Serve static widget via CDN:**

```nginx
# nginx.conf
location /pushsaas-widget.js {
    alias /var/www/pushsaas/public/pushsaas-widget.js;
    expires 1d;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
}
```

Or use CloudFlare, AWS CloudFront, etc.

### 3. Database Indexing

**Already created in migration:**
```sql
CREATE INDEX idx_subscription_bell_configs_site_id ON subscription_bell_configs (site_id);
CREATE INDEX idx_subscription_bell_configs_is_active ON subscription_bell_configs (is_active);
```

### 4. Monitoring

**Add logging for production:**
```javascript
router.get('/widget-config', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // ... fetch config
    
    logger.info({
      action: 'widget_config_loaded',
      siteId,
      duration: Date.now() - startTime
    });
  } catch (error) {
    logger.error({
      action: 'widget_config_error',
      siteId,
      error: error.message
    });
  }
});
```

## 🐛 Common Production Issues

### Issue 1: Widget not loading
**Cause:** CORS blocking the widget script
**Solution:** 
```javascript
// Add proper CORS headers
app.use('/pushsaas-widget.js', cors({ origin: '*' }));
```

### Issue 2: Config not persisting
**Cause:** Migration not run on production database
**Solution:**
```bash
NODE_ENV=production node scripts/migrate.js
```

### Issue 3: Multiple sites showing same config
**Cause:** Not passing siteId parameter
**Solution:**
```html
<!-- Must include siteId in meta tag -->
<meta name="pushsaas-site-id" content="123">
```

### Issue 4: Unauthorized errors on settings page
**Cause:** Not logged in or wrong permissions
**Solution:**
- Ensure user is authenticated
- Verify user owns the site (or is superadmin)
- Check JWT token is valid

## 📈 Scaling Considerations

### For 1000+ Sites

1. **Database Connection Pooling**
```javascript
const pool = new Pool({
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

2. **Redis Caching**
```javascript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache widget configs in Redis
await redis.setex(`config:${siteId}`, 300, JSON.stringify(config));
```

3. **Read Replicas**
```javascript
// Use read replica for widget-config endpoint
const readPool = new Pool({ 
  connectionString: process.env.DATABASE_READ_URL 
});

// Use write pool for updates
const writePool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});
```

## ✅ Production Checklist

- [ ] Run database migration
- [ ] Update widget serverUrl to production API
- [ ] Set debug: false in widget
- [ ] Configure CORS for allowed domains
- [ ] Add rate limiting to public endpoints
- [ ] Setup CDN for widget script
- [ ] Enable caching (Redis or in-memory)
- [ ] Configure SSL/HTTPS
- [ ] Setup monitoring and logging
- [ ] Test widget on sample client site
- [ ] Document client integration steps
- [ ] Create admin UI in main dashboard
- [ ] Setup automated backups
- [ ] Add error tracking (Sentry, etc.)
- [ ] Load test the endpoints
- [ ] Setup alerts for errors

## 🎯 Summary

**Production URL Structure:**
- Widget Script: `https://api.pushsaas.com/pushsaas-widget.js`
- Widget Config API: `https://api.pushsaas.com/api/subscription-bell/widget-config?siteId=X`
- Admin Settings: `https://admin.pushsaas.com/sites/X/subscription-bell`
- Subscribe Endpoint: `https://api.pushsaas.com/subscribe`

**Data Flow:**
1. Client embeds widget with their siteId
2. Widget loads config from database (via API)
3. User subscribes → Saved to database with siteId
4. Admin modifies config → Updates database
5. Widget auto-reloads new config (cached for performance)

**Multi-Tenancy:**
- ✅ Each site has isolated configuration
- ✅ One subscription bell config per site
- ✅ Site ownership verified on updates
- ✅ Cascade deletion when site is removed
