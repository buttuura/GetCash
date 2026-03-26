# GetCash MongoDB + Render Deployment - Quick Reference

## Deployment Checklist

### Phase 1: MongoDB Atlas Setup (5-10 minutes)
- [ ] Create MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
- [ ] Create M0 (free) cluster
- [ ] Create database user with username and password
- [ ] Whitelist network (0.0.0.0/0 for Render)
- [ ] Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/getcash?retryWrites=true&w=majority`
- [ ] Test connection string is valid

### Phase 2: GitHub & Render Setup (5 minutes)
- [ ] Ensure getcommit changes pushed to GitHub:
  ```bash
  git add .
  git commit -m "feat: migrate to MongoDB and Render.com deployment"
  git push origin main
  ```

### Phase 3: Render.com Deployment (15-20 minutes)
- [ ] Create Render account at https://render.com
- [ ] Connect GitHub repository
- [ ] Create new Web Service with:
  - Build Command: `npm install`
  - Start Command: `npm start`
- [ ] Set environment variables:
  - `NODE_ENV` = `production`
  - `MONGODB_URI` = Your connection string
  - `JWT_SECRET` = (from render.yaml)
  - `CORS_ORIGIN` = `https://buttuura.github.io`
  - `PORT` = `10000`
- [ ] Wait for "Live" status (green)
- [ ] Note your Render URL: `https://getcash-backend.onrender.com`

### Phase 4: Frontend Configuration (2-3 minutes)
- [ ] Update API endpoint in `getcash.js` to Render URL
- [ ] Test in browser: try registration and login
- [ ] Check Render logs for any errors

### Phase 5: Verification (5 minutes)
- [ ] Test registration with new user
- [ ] Test login
- [ ] Test task completion and earnings
- [ ] Test wallet functionality
- [ ] Check MongoDB Atlas to see data being saved

## Important URLs

- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **Render Dashboard**: https://dashboard.render.com
- **Your Backend**: https://getcash-backend.onrender.com
- **Frontend**: https://buttuura.github.io/GetCash

## Environment Variables to Copy

```env
NODE_ENV=production
JWT_SECRET=bd5adcbf0e26a5711c43a9eef90fa395a872f153265e2af574e74e092e45da31ae15f1b163df8624c7cb437c6528d604fb70b010d4ace879dae4f8aa62181a4d
CORS_ORIGIN=https://buttuura.github.io
PORT=10000
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/getcash?retryWrites=true&w=majority
```

## Database Collections

After deployment, MongoDB will have:
- **users** - User accounts (username, password, phone)
- **tasks** - Tasks posted by admin (title, price, image)
- **completedtasks** - Track which user completed which task
- **userdatas** - User wallets and job levels

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "ECONNREFUSED" | Check MONGODB_URI is correct in Render |
| "Auth failed" | Verify database user password in connection string |
| "IP whitelist" | Add 0.0.0.0/0 to MongoDB Atlas Network Access |
| "CORS error" | Check CORS_ORIGIN matches frontend URL |
| "Port already in use" | Change PORT env var or restart service |

## File Changes Made

✅ Updated files:
- `package.json` - Replaced sqlite3 with mongoose
- `database.js` - Converted from SQLite to MongoDB
- `server.js` - Added dotenv support
- `render.yaml` - Added MONGODB_URI
- Multiple HTML files - Removed demo-mode.js

✅ New files created:
- `.env` - Local development variables
- `.env.example` - Example configuration
- `MONGODB_RENDER_SETUP.md` - Full setup guide

## Next: Deploy Locally First

Before deploying to Render, test locally:

```bash
# 1. Install dependencies
npm install

# 2. Start local MongoDB (if using local) or update .env with Atlas URI

# 3. Run development server
npm run dev

# 4. Test at http://localhost:3300
```

## Testing the Production API

After Render deployment, test with curl:

```bash
# Test health endpoint
curl https://getcash-backend.onrender.com/health

# Test registration
curl -X POST https://getcash-backend.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass","phone":"256700000000"}'

# Test login
curl -X POST https://getcash-backend.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

---

**Your GetCash app is now ready for production with MongoDB and Render.com!** 🚀
