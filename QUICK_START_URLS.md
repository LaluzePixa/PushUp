# 🚀 Quick Start - Test URLs

## ⚠️ Important: Port Configuration

Your application runs on **TWO different servers**:

```
┌─────────────────────────────────────────────────┐
│  Port 3000 - BACKEND (Express)                  │
│  ├─ API Endpoints                               │
│  ├─ Static Files (HTML, JS)                     │
│  └─ Subscription Bell Widget                    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Port 3001 - FRONTEND (Next.js)                 │
│  ├─ React Dashboard                             │
│  ├─ Admin Pages                                 │
│  └─ User Interface                              │
└─────────────────────────────────────────────────┘
```

## 🧪 Test the Subscription Bell

### 1. Client Demo Page (Embedded Widget)
```
http://localhost:3000/client-demo.html
```
**What it shows:**
- How the widget appears on a real website
- Complete integration example
- Interactive bell icon in bottom-right
- Subscribe/unsubscribe functionality

**Try this:**
1. Open the page
2. Look for 🔔 bell icon in bottom-right corner
3. Click it to see the subscription modal
4. Click "SUSCRIBIRSE" to subscribe
5. Grant notification permission
6. You'll see a success notification!

---

### 2. Admin Settings Page
```
http://localhost:3000/subs-bell.html?siteId=1
```
**What it shows:**
- Configuration interface
- Live preview panel
- Customization options

**Customize:**
- Style (Rounded/Square)
- Position (Bottom-Right, Top-Left, etc.)
- Theme (Dark/Light)
- Colors
- Text for all states
- Toggle notifications display

**Important:** You need to be authenticated to save changes.

---

### 3. Widget JavaScript File
```
http://localhost:3000/pushsaas-widget.js
```
**What it is:**
- The widget script that clients embed
- Auto-loads configuration from database
- Handles subscription flow

---

### 4. Widget Config API (JSON)
```
http://localhost:3000/api/subscription-bell/widget-config?siteId=1
```
**What it returns:**
```json
{
  "success": true,
  "data": {
    "style": "Rounded",
    "position": "Bottom Right",
    "theme": "Dark",
    "themeColor": "#4A90E2",
    "defaultTitle": "Suscríbete para recibir notificaciones...",
    "defaultButtonText": "SUSCRIBIRSE",
    "subscribedTitle": "Estás suscrito a las notificaciones push",
    "subscribedButtonText": "DESUSCRIBIRSE",
    "isActive": true,
    ...
  }
}
```

---

## 📝 Quick Testing Workflow

### Step 1: Configure the Bell
```
1. Open: http://localhost:3000/subs-bell.html?siteId=1
2. Change the theme color to red (#FF0000)
3. Change position to "Top Left"
4. Click "Actualizar Configuración"
```

### Step 2: See Changes on Client Page
```
1. Open: http://localhost:3000/client-demo.html
2. The bell should now be in top-left with red color!
3. Click the bell to test subscription
```

### Step 3: Verify Database Persistence
```
1. Stop the server (Ctrl+C)
2. Restart the server
3. Reload client-demo.html
4. The configuration should still be red and top-left! ✅
```

---

## 🔧 API Endpoints Summary

### Public (No Auth Required)
```bash
# Get widget config
GET http://localhost:3000/api/subscription-bell/widget-config?siteId=1

# Get config for settings page
GET http://localhost:3000/api/subscription-bell/config?siteId=1

# Subscribe user
POST http://localhost:3000/subscribe
```

### Authenticated (Requires JWT Token)
```bash
# Update bell config
POST http://localhost:3000/api/subscription-bell/config
Headers: Authorization: Bearer YOUR_TOKEN
Body: { siteId: 1, style: "Square", ... }

# Toggle visibility
POST http://localhost:3000/api/subscription-bell/toggle
Headers: Authorization: Bearer YOUR_TOKEN
Body: { siteId: 1, isActive: false }
```

---

## 🎯 Production URLs (When Deployed)

When you deploy to production, update these URLs:

### Client Embedding
```html
<!-- Development -->
<meta name="pushsaas-server-url" content="http://localhost:3000">
<script src="http://localhost:3000/pushsaas-widget.js"></script>

<!-- Production -->
<meta name="pushsaas-server-url" content="https://api.pushsaas.com">
<script src="https://api.pushsaas.com/pushsaas-widget.js"></script>
```

### Admin Settings
```
Development: http://localhost:3000/subs-bell.html?siteId=X
Production:  https://admin.pushsaas.com/sites/X/subscription-bell
```

---

## ✅ Checklist

- [ ] Backend server running on port 3000
- [ ] Frontend server running on port 3001 (optional for this feature)
- [ ] Database migration completed (subscription_bell_configs table exists)
- [ ] Test client-demo.html loads and shows bell
- [ ] Test customization in subs-bell.html
- [ ] Test subscription flow (click bell, subscribe)
- [ ] Verify config persists after server restart
- [ ] Check widget-config API returns JSON

---

## 🐛 Troubleshooting

**Bell not showing on client-demo.html?**
- Open browser console (F12)
- Check for errors
- Verify siteId in meta tag
- Verify server is running on port 3000

**Can't save settings?**
- You need to be authenticated
- For testing, you can bypass auth or use admin credentials
- Check browser console for 401/403 errors

**Config not persisting?**
- Run: `node scripts/test-subscription-bell.js`
- Verify migration ran: `node scripts/migrate.js`
- Check database has subscription_bell_configs table

**Wrong port?**
- Use **3000** for backend (API + widget)
- Use **3001** for frontend (React dashboard)
- Static files (.html) are served from backend (3000)

---

## 📚 Documentation

- **Full Guide:** `SUBSCRIPTION_BELL_PRODUCTION_GUIDE.md`
- **Flow Diagram:** `PRODUCTION_FLOW_DIAGRAM.md`
- **Migration Details:** `SUBSCRIPTION_BELL_MIGRATION.md`
- **Summary:** `SUBSCRIPTION_BELL_TODO_COMPLETE.md`
