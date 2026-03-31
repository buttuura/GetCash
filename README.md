# Task Management Web Application

A modern full-stack web application with task management, user authentication, wallet interface, and comprehensive admin dashboard. Features include admin task creation, user subscription tracking, recharge notifications, and persistent database storage.

## 🚀 Features

- **Modern UI**: Glass morphism design with animated particles and floating labels
- **User Authentication**: Registration and login system with JWT tokens
- **Task Management**: Admin can upload tasks, users can complete them
- **Wallet Interface**: Track earnings and wallet balance with recharge system
- **Admin Dashboard**: Monitor user subscriptions, deposits, and job levels
- **Real-time Search**: Advanced search functionality for admin user management
- **Database Storage**: SQLite database for persistent data storage
- **Responsive Design**: Mobile-first responsive design for all devices

## 🌐 Live Demo

Deploy this application on Render.com in just a few clicks!

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

## 📦 Quick Deployment Guide

### Option 1: Deploy to Render.com (Recommended)

1. **Fork/Upload to GitHub:**
   - Create a new repository on GitHub
   - Upload your project files to the repository

2. **Deploy on Render:**
   - Go to [render.com](https://render.com) and sign up
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: `task-management-app`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: `Free`

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   JWT_SECRET=your_secure_random_jwt_secret_here
   CORS_ORIGIN=https://your-app-name.onrender.com
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Access your app at `https://your-app-name.onrender.com`

### Option 2: Deploy to Railway

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Deploy: `railway up`

### Option 3: Deploy to Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Deploy: `git push heroku main`

## 🔧 Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
# Required for production
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret
CORS_ORIGIN=https://your-domain.com
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Dynamic task lists and user activity

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: JWT tokens
- **Storage**: Database + localStorage fallback

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment (optional)**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   # or
   node server.js
   ```

5. **Access the application**
   - Open your browser and go to: `http://localhost:3300`
   - Register a new account or use existing credentials

## 🌍 Deployment Options

### Option 1: Heroku (Recommended for beginners)
```bash
# Install Heroku CLI first
heroku create your-app-name
git push heroku main
```

### Option 2: Railway
```bash
# Connect your GitHub repo to Railway
# Deploy automatically on push
```

### Option 3: Render
```bash
# Connect GitHub repo to Render
# Automatic deploys from main branch
```

### Option 4: VPS/Cloud Server
```bash
# For production deployment on your own server
pm2 start server.js --name "task-app"
```

## 📁 Project Structure

```
├── server.js              # Main server file
├── database.js            # Database management
├── package.json           # Dependencies and scripts
├── view-database.js       # Database viewer utility
├── public/                # Frontend files
│   ├── index.html         # Home page
│   ├── login-page.html    # Login interface
│   ├── registration.html  # User registration
│   ├── admin-tasks.html   # Admin task management
│   ├── task-list.html     # User task list
│   ├── wallet-interface.html # Wallet/profile page
│   ├── storage-manager.js # Client-side API handler
│   ├── getcash.css        # Main stylesheet
│   ├── getcash.js         # Frontend JavaScript
│   └── image/             # Static images
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables (.env)
```env
PORT=3300
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
NODE_ENV=production
DATABASE_URL=sqlite:./app_data.db
```

### Database Setup
The application automatically creates the SQLite database and tables on first run. No manual setup required!

## 👥 Multi-User Support

### Current Features:
- ✅ User registration and authentication
- ✅ Individual user sessions
- ✅ Per-user task completion tracking
- ✅ Secure JWT-based authentication
- ✅ Database isolation between users

### Admin Features:
- Upload new tasks with images
- View tasks by date
- Clear all tasks
- Access admin panel (username: `0776944`)

## 🛡️ Security Features

- JWT token-based authentication
- Password validation
- SQL injection protection (parameterized queries)
- CORS enabled for cross-origin requests
- Environment variable protection

## 📊 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task (admin)
- `GET /api/tasks/date/:date` - Get tasks by date
- `DELETE /api/tasks` - Clear all tasks (admin)

### User Progress
- `POST /api/tasks/:id/complete` - Mark task complete
- `GET /api/tasks/completed` - Get user's completed tasks
- `DELETE /api/tasks/:id/complete` - Remove completed task

### User Data
- `GET /api/user/data` - Get user wallet data
- `PUT /api/user/wallet` - Update wallet balance

## 🚀 Production Deployment

### For Heroku:
1. Create `Procfile`:
   ```
   web: node server.js
   ```

2. Set environment variables:
   ```bash
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set NODE_ENV=production
   ```

### For other platforms:
1. Set `NODE_ENV=production`
2. Configure your JWT secret
3. Ensure SQLite3 is available
4. Set up process management (PM2 recommended)

## 🧪 Development

### View Database Contents
```bash
# View all data
node view-database.js

# View storage statistics
node view-database.js --stats
```

### Reset Database
```bash
# Delete database file to reset
rm app_data.db
# Restart server to recreate
node server.js
```

## 📈 Scaling Considerations

### Current Limitations:
- SQLite database (single file, good for small-medium apps)
- File-based image storage (base64 in database)
- Single server instance

### Scaling Options:
1. **Database**: Migrate to PostgreSQL or MySQL
2. **Image Storage**: Use cloud storage (AWS S3, Cloudinary)
3. **Caching**: Add Redis for session management
4. **Load Balancing**: Multiple server instances
5. **CDN**: Serve static assets from CDN

## 🔍 Troubleshooting

### Common Issues:

1. **Port already in use**
   ```bash
   netstat -ano | findstr :3300
   taskkill /PID <PID_NUMBER> /F
   ```

2. **Database connection issues**
   ```bash
   # Check if database file exists
   ls -la app_data.db
   # View database status
   node view-database.js --stats
   ```

3. **Module not found**
   ```bash
   npm install
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review the console logs
3. Open an issue on GitHub
4. Contact the maintainers

## 🎯 Roadmap

### Upcoming Features:
- [ ] Password hashing (bcrypt)
- [ ] Email verification
- [ ] Password reset functionality
- [ ] User profile management
- [ ] Task categories and filtering
- [ ] File upload for images
- [ ] Real-time notifications
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

---

**Made with ❤️ by [Your Name]**