# GetCash: MongoDB + Render.com Deployment Guide

This guide explains how to deploy GetCash with MongoDB database on Render.com.

## Prerequisites

- GitHub account
- Render.com account (free tier available)
- MongoDB Atlas account (free tier M0 available)
- Your GetCash repository pushed to GitHub

## Step 1: Set Up MongoDB Atlas (Database)

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Sign Up" and create an account
3. Verify your email

### 1.2 Create a Free Cluster
1. After signing in, click "Create a Deployment"
2. Select **M0 (Free)** tier
3. Choose your provider region (e.g., us-east-1)
4. Click "Create" (takes 5-10 minutes)

### 1.3 Create Database User
1. Go to **Database Access** in the left sidebar
2. Click "Add New Database User"
3. Create username and password (e.g., `getcash_user` / strong password)
4. Note these credentials - you'll need them next

### 1.4 Whitelist Network Access
1. Go to **Network Access** in the left sidebar
2. Click "Add IP Address"
3. Select "Allow access from anywhere" (0.0.0.0/0) for Render.com
4. Confirm

### 1.5 Get Connection String
1. Go to **Databases** overview
2. Click "Connect" on your cluster
3. Select "Drivers" option
4. Choose **Node.js** version **4.x or 5.x**
5. Copy the connection string, it looks like:
```
mongodb+srv://getcash_user:PASSWORD@cluster.mongodb.net/getcash?retryWrites=true&w=majority
```
6. Replace `PASSWORD` with your actual database user password
7. Keep this URL safe - you'll need it for Render

## Step 2: Deploy to Render.com

### 2.1 Connect GitHub Repository
1. Go to [Render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Click "Connect GitHub Account" if not already connected
4. Select your `GetCash` repository
5. Click "Connect"

### 2.2 Configure Service
Fill in the following configuration:

| Setting | Value |
|---------|-------|
| **Name** | getcash-backend |
| **Environment** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

### 2.3 Set Environment Variables
Click "Advanced" and add environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Generate a strong random string (or use the one in render.yaml) |
| `CORS_ORIGIN` | `https://buttuura.github.io` |
| `PORT` | `10000` |
| `MONGODB_URI` | Your MongoDB Atlas connection string from Step 1.5 |

### 2.4 Deploy
1. Click "Create Web Service"
2. Render will automatically start building and deploying
3. Wait for the green "Live" status (usually 3-5 minutes)
4. Your app URL will be something like: `https://getcash-backend.onrender.com`

## Step 3: Configure Frontend

### 3.1 Update API Endpoints
Your frontend needs to connect to the new Render backend. Update `getcash.js`:

```javascript
// Change the API base URL from localhost to Render URL
const API_BASE_URL = 'https://getcash-backend.onrender.com';
// or if using environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://getcash-backend.onrender.com';
```

### 3.2 Test the Connection
1. Open your GetCash app in browser
2. Try registering a new account
3. Try logging in
4. Monitor Render logs to verify requests

## Step 4: Local Development

### 4.1 Install Dependencies
```bash
npm install
```

### 4.2 Set Up Local MongoDB
Option A: Use MongoDB Atlas (same connection string)
- Set `MONGODB_URI` in `.env`

Option B: Use Local MongoDB
```bash
# Install MongoDB on your system
# Start MongoDB service
# Update .env: MONGODB_URI=mongodb://localhost:27017/getcash
```

### 4.3 Run Locally
```bash
npm run dev
# or
node server.js
```

## Step 5: Monitoring & Troubleshooting

### Check Render Logs
1. Go to your Render service
2. Click "Logs" tab
3. Watch for connection errors

### Common Issues

**Issue: "Cannot connect to MongoDB"**
- Verify MONGODB_URI is correct in Render environment variables
- Check IP whitelist in MongoDB Atlas (should include 0.0.0.0/0)
- Ensure database user password is correct

**Issue: "CORS error"**
- Verify CORS_ORIGIN in environment matches your frontend URL
- Check that Server.js has proper CORS configuration

**Issue: "JWT errors"**
- Ensure JWT_SECRET is set in Render
- For production, generate a strong random secret

## Step 6: Database Maintenance

### View Database Data
1. Go to MongoDB Atlas → Collections
2. Browse your `getcash` database
3. Collections include: users, tasks, completedtasks, userdatas

### Backup Data
1. In MongoDB Atlas → Backup (paid plans) or
2. Export data manually: Tools → Command Line Tools

### Reset Database
⚠️ **WARNING**: This deletes all data!
```bash
# In MongoDB Atlas, delete the database and recreate it
# Or use MongoDB Atlas UI to drop collections
```

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGODB_URI` | Database connection string | `mongodb+srv://user:pass@cluster.mongodb.net/getcash` |
| `NODE_ENV` | Environment type | `production` or `development` |
| `PORT` | Server port | `10000` or `3300` |
| `JWT_SECRET` | Authentication secret | Long random string |
| `CORS_ORIGIN` | Allowed frontend origin | `https://buttuura.github.io` |

## Performance Tips

1. **Indexes**: MongoDB automatically creates indexes on `_id` fields
2. **Query Optimization**: Consider adding indexes on frequently queried fields
3. **Cache**: Implement caching for frequently accessed data
4. **Rate Limiting**: Add rate limiting for API endpoints

## Next Steps

1. Test all features with MongoDB backend
2. Monitor performance on Render
3. Set up automated backups
4. Consider upgrading MongoDB tier if needed
5. Implement proper error handling and logging

## Support

For issues:
- Check Render logs: https://dashboard.render.com
- Check MongoDB Atlas status: https://www.mongodb.com/status
- Review error messages in browser console (F12)

---

**Project Successfully Converted from Demo Mode to Production MongoDB Backend!** 🎉
