# Production Flow - Subscription Bell

## 🔄 Complete Production Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────┘

1. Admin creates a new site
   POST /api/sites
   { name: "My Store", domain: "mystore.com" }
   → Returns: { id: 123, ... }

2. Admin configures subscription bell (optional - uses defaults if skipped)
   Visit: https://admin.pushsaas.com/sites/123/subscription-bell
   Or: http://localhost:3001/subs-bell.html?siteId=123
   
   Configure:
   - Style: Rounded/Square
   - Position: Bottom Right, etc.
   - Colors, text, behavior
   
   POST /api/subscription-bell/config
   { siteId: 123, style: "Rounded", themeColor: "#FF5733", ... }
   → Saves to database (subscription_bell_configs table)

3. Admin gets integration code
   Shows client how to embed:
   <meta name="pushsaas-site-id" content="123">
   <script src="https://api.pushsaas.com/pushsaas-widget.js"></script>


┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────┘

1. Client adds PushSaaS code to their website
   mystore.com/index.html:
   ┌─────────────────────────────────────────────────┐
   │ <head>                                          │
   │   <meta name="pushsaas-site-id" content="123"> │
   │ </head>                                         │
   │ <body>                                          │
   │   <!-- website content -->                      │
   │   <script src="https://api.../widget.js">      │
   │   </script>                                     │
   │ </body>                                         │
   └─────────────────────────────────────────────────┘

2. Widget loads when page opens
   Widget Script:
   - Reads siteId from meta tag
   - Calls: GET /api/subscription-bell/widget-config?siteId=123
   - Gets: { style: "Rounded", position: "Bottom Right", ... }
   - Renders bell icon with configured settings

3. User sees the bell 🔔 and clicks it
   Widget shows modal with:
   - Title from config
   - Button text from config
   - Custom colors from config

4. User clicks "SUBSCRIBE"
   Widget:
   - Requests notification permission
   - Gets VAPID key from server
   - Creates push subscription
   - Sends to server:
     POST /subscribe
     { endpoint: "...", p256dh: "...", auth: "...", siteId: 123 }
   - Subscription saved to database with siteId


┌─────────────────────────────────────────────────────────────────────┐
│                     DATABASE STRUCTURE                              │
└─────────────────────────────────────────────────────────────────────┘

Table: sites
┌─────┬──────────┬───────────────┐
│ id  │ user_id  │ domain        │
├─────┼──────────┼───────────────┤
│ 123 │ 5        │ mystore.com   │
└─────┴──────────┴───────────────┘

Table: subscription_bell_configs (NEW!)
┌─────┬─────────┬──────────┬──────────────────┬──────────────┬────────────┐
│ id  │ site_id │ style    │ position         │ theme_color  │ is_active  │
├─────┼─────────┼──────────┼──────────────────┼──────────────┼────────────┤
│ 1   │ 123     │ Rounded  │ Bottom Right     │ #FF5733      │ true       │
└─────┴─────────┴──────────┴──────────────────┴──────────────┴────────────┘
         ↑
         │ Foreign Key
         │
         └─ Links to sites.id (CASCADE on delete)

Table: subscriptions
┌─────┬──────────────┬─────────┬──────────────┐
│ id  │ endpoint     │ site_id │ p256dh       │
├─────┼──────────────┼─────────┼──────────────┤
│ 1   │ https://...  │ 123     │ BKxG...      │
│ 2   │ https://...  │ 123     │ ADf3...      │
└─────┴──────────────┴─────────┴──────────────┘
                          ↑
                          │ Foreign Key
                          │
                          └─ Also links to sites.id


┌─────────────────────────────────────────────────────────────────────┐
│                    SENDING CAMPAIGNS                                │
└─────────────────────────────────────────────────────────────────────┘

1. Admin creates campaign
   POST /api/campaigns
   {
     siteId: 123,
     title: "50% Off Sale!",
     body: "Limited time offer",
     clickUrl: "https://mystore.com/sale"
   }

2. System sends to all subscriptions with siteId=123
   SELECT * FROM subscriptions WHERE site_id = 123
   → Sends push notification to each subscriber

3. Subscribers receive notification
   - On their device (even if not on website)
   - Click → Opens clickUrl
   - Tracked in campaign_executions table


┌─────────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANCY IN ACTION                          │
└─────────────────────────────────────────────────────────────────────┘

Site A (mystore.com, id=123)
- Has its own bell config (red, bottom-right)
- Has its own subscribers (5,000 users)
- Receives its own campaigns

Site B (blog.com, id=456)  
- Has its own bell config (blue, top-left)
- Has its own subscribers (10,000 users)
- Receives its own campaigns

✅ No data mixing between sites
✅ Each site is isolated
✅ Admins can only modify their own sites
✅ Subscriptions tied to specific sites


┌─────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION ENDPOINTS                             │
└─────────────────────────────────────────────────────────────────────┘

Public (No Auth):
  GET  /api/subscription-bell/config?siteId=X
    → Used by settings page to load current config
  
  GET  /api/subscription-bell/widget-config?siteId=X
    → Used by widget to load appearance settings
  
  POST /subscribe
    → Used by widget to save subscription

Authenticated (Admin Only):
  POST /api/subscription-bell/config
    → Update bell configuration
  
  POST /api/subscription-bell/toggle
    → Enable/disable bell globally
  
  POST /api/sites
    → Create new site
  
  POST /api/campaigns
    → Send push notifications


┌─────────────────────────────────────────────────────────────────────┐
│                    KEY BENEFITS                                     │
└─────────────────────────────────────────────────────────────────────┘

✅ Data Persistence
   - Config survives server restarts
   - Stored in PostgreSQL, not memory

✅ Multi-Tenant Safe
   - Each site has isolated configuration
   - No data leakage between clients

✅ Easy Integration
   - Just 2 lines of code for clients
   - Auto-loads from database

✅ Customizable
   - Admin controls all appearance
   - Changes apply immediately

✅ Scalable
   - Database-backed
   - Can handle thousands of sites
   - Cacheable for performance


┌─────────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT CHECKLIST                             │
└─────────────────────────────────────────────────────────────────────┘

Production Server:
  [✓] Run migration: node scripts/migrate.js
  [✓] Verify table exists: subscription_bell_configs
  [✓] Update widget serverUrl to production domain
  [✓] Set debug: false in widget
  [✓] Configure CORS for client domains
  [✓] Setup CDN for widget.js file
  [✓] Enable HTTPS/SSL
  [✓] Add rate limiting
  [✓] Setup monitoring
  [✓] Configure backups

Client Integration:
  [✓] Get Site ID from dashboard
  [✓] Add meta tag with siteId
  [✓] Add script tag for widget
  [✓] Test on staging environment
  [✓] Deploy to production
  [✓] Verify bell appears correctly
  [✓] Test subscription flow
  [✓] Send test campaign
```

## 🎯 Summary

**In Production:**
1. Each client site has a unique `siteId`
2. Configuration is stored in database per site
3. Widget loads config from database when embedded
4. Subscriptions are tied to the site
5. Campaigns target subscribers of specific sites
6. Everything is isolated and multi-tenant safe!

**URLs:**
- Widget: `https://api.pushsaas.com/pushsaas-widget.js`
- Config API: `https://api.pushsaas.com/api/subscription-bell/widget-config?siteId=X`
- Settings: `https://admin.pushsaas.com/sites/X/subscription-bell`
