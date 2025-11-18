# Subscription Bell Configuration - Database Migration

## Overview
Successfully migrated subscription bell configuration from in-memory storage to PostgreSQL database, resolving the critical TODO that prevented data persistence across server restarts.

## Changes Made

### 1. Database Schema (`server/scripts/migrate.js`)
Created new table `subscription_bell_configs`:

```sql
CREATE TABLE subscription_bell_configs (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  style VARCHAR(50) NOT NULL DEFAULT 'Rounded',
  position VARCHAR(50) NOT NULL DEFAULT 'Bottom Right',
  theme VARCHAR(50) NOT NULL DEFAULT 'Dark',
  theme_color VARCHAR(20) NOT NULL DEFAULT '#4A90E2',
  popup_style VARCHAR(50) NOT NULL DEFAULT 'Standard',
  x_axis VARCHAR(10) NOT NULL DEFAULT '15',
  y_axis VARCHAR(10) NOT NULL DEFAULT '15',
  default_title VARCHAR(500) NOT NULL,
  default_button_text VARCHAR(100) NOT NULL,
  subscribed_title VARCHAR(500) NOT NULL,
  subscribed_button_text VARCHAR(100) NOT NULL,
  unsubscribed_title VARCHAR(500) NOT NULL,
  unsubscribed_button_text VARCHAR(100) NOT NULL,
  show_last_notifications BOOLEAN NOT NULL DEFAULT true,
  default_heading VARCHAR(255) NOT NULL,
  subscribed_heading VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id)
);
```

**Key Features:**
- ✅ Multi-tenant safe (per-site configuration)
- ✅ Foreign key constraint to `sites` table
- ✅ Cascade deletion when site is deleted
- ✅ Unique constraint ensures one config per site
- ✅ Audit trail with `created_at` and `updated_at`

### 2. Database Service (`server/src/services/subscriptionBellService.js`)
Created dedicated service class with methods:

- `getConfigBySiteId(siteId)` - Fetch config for specific site
- `getOrCreateConfig(siteId)` - Get existing or create default config
- `createDefaultConfig(siteId)` - Initialize with sensible defaults
- `updateConfig(siteId, configData)` - Update configuration
- `toggleVisibility(siteId, isActive)` - Toggle bell visibility
- `formatConfig(row)` - Convert DB row to camelCase object

### 3. Updated API Routes (`server/src/routes/subscriptionBell.js`)

**Breaking Changes:**
All endpoints now require `siteId` parameter.

#### GET `/api/subscription-bell/config`
- **Before:** No parameters
- **After:** Requires `?siteId=X` query parameter
- **Access:** Public (for HTML page)

#### POST `/api/subscription-bell/config`
- **Before:** Global configuration
- **After:** Requires `siteId` in request body
- **Access:** Authenticated (admin/superadmin only)
- **Validation:** Verifies site ownership

#### POST `/api/subscription-bell/toggle`
- **Before:** Global toggle
- **After:** Requires `siteId` in request body
- **Access:** Authenticated (admin/superadmin only)
- **Validation:** Verifies site ownership

#### GET `/api/subscription-bell/widget-config`
- **Before:** No parameters
- **After:** Requires `?siteId=X` query parameter
- **Access:** Public (for embedded widgets)

### 4. Updated UI (`server/public/subs-bell.html`)

**Required URL Parameter:**
```
http://localhost:3001/subs-bell.html?siteId=1
```

**Changes:**
- Extracts `siteId` from URL parameters on page load
- Passes `siteId` to all API requests
- Shows error if `siteId` is missing
- All configuration operations are now site-specific

## Migration Guide

### For Existing Deployments

1. **Run the migration:**
   ```bash
   cd server
   node scripts/migrate.js
   ```

2. **Verify table creation:**
   ```bash
   node scripts/check-table.js
   ```

3. **Test functionality:**
   ```bash
   node scripts/test-subscription-bell.js
   ```

### For Frontend Integration

**Old way (deprecated):**
```html
<iframe src="http://localhost:3001/subs-bell.html"></iframe>
```

**New way:**
```html
<iframe src="http://localhost:3001/subs-bell.html?siteId=1"></iframe>
```

### For API Clients

**Old way (deprecated):**
```javascript
// GET config
fetch('/api/subscription-bell/config')

// Update config
fetch('/api/subscription-bell/config', {
  method: 'POST',
  body: JSON.stringify({ style: 'Square' })
})
```

**New way:**
```javascript
// GET config
fetch('/api/subscription-bell/config?siteId=1')

// Update config
fetch('/api/subscription-bell/config', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
  body: JSON.stringify({ 
    siteId: 1,
    style: 'Square' 
  })
})
```

## Benefits

### ✅ Solved Issues
- **Data Persistence:** Configuration survives server restarts
- **Multi-Tenancy:** Each site has isolated configuration
- **Audit Trail:** Track creation and update timestamps
- **Data Integrity:** Foreign key constraints ensure referential integrity
- **Security:** Site ownership validation prevents unauthorized access

### ✅ Production Ready
- Database-backed storage
- Proper indexing for performance
- Transaction support
- Scalable architecture
- No shared global state

## Testing

### Manual Testing
1. Start the server
2. Visit: `http://localhost:3001/subs-bell.html?siteId=1`
3. Modify settings and save
4. Restart the server
5. Verify settings persisted

### Automated Testing
```bash
cd server
node scripts/test-subscription-bell.js
```

### Database Inspection
```bash
node scripts/list-sites.js         # List available sites
node scripts/check-table.js        # View table structure
```

## Security Considerations

1. **Authentication Required:** POST endpoints require JWT token
2. **Authorization:** Users can only modify their own sites
3. **Superadmin Override:** Superadmins can modify any site
4. **Input Validation:** All inputs validated before database operations
5. **SQL Injection Protection:** Parameterized queries used throughout

## Performance

- **Indexed Columns:** `site_id`, `is_active`
- **Query Optimization:** Single query for get-or-create
- **Connection Pooling:** Uses PostgreSQL connection pool
- **Caching Opportunity:** Consider Redis for frequently accessed configs

## Future Enhancements

- [ ] Add configuration versioning/history
- [ ] Implement configuration presets/templates
- [ ] Add A/B testing support for different configurations
- [ ] Create admin UI for managing multiple site configs
- [ ] Add webhook notifications on config changes
- [ ] Implement configuration import/export

## Rollback Plan

If issues arise, revert to in-memory storage:

1. Keep the database table (for future use)
2. Restore the old `subscriptionBell.js` from git history
3. Remove `import SubscriptionBellService` statements
4. Redeploy

## Files Modified

- ✏️ `server/scripts/migrate.js` - Added table creation
- ✏️ `server/src/routes/subscriptionBell.js` - Updated to use database
- ✏️ `server/public/subs-bell.html` - Added siteId parameter handling
- ➕ `server/src/services/subscriptionBellService.js` - New service layer

## Files Created (Testing/Utils)

- `server/scripts/check-table.js` - Verify table structure
- `server/scripts/list-sites.js` - List available sites
- `server/scripts/test-subscription-bell.js` - Comprehensive tests

---

**Status:** ✅ Complete and Production Ready  
**Migration Date:** November 12, 2025  
**Breaking Changes:** Yes (requires siteId parameter)  
**Database Changes:** Yes (new table added)
