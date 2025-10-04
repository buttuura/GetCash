const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Database = require('./database');
const createHealthRoutes = require('./health-routes');

const app = express();
const PORT = process.env.PORT || 3300;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security check for production
if (NODE_ENV === 'production' && JWT_SECRET === 'your_jwt_secret_key_change_this_in_production') {
  console.warn('⚠️  WARNING: Using default JWT secret in production! Set JWT_SECRET environment variable.');
}

// Initialize database
const db = new Database();

// CORS configuration
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? [process.env.CORS_ORIGIN || 'https://buttuura.github.io', 'https://buttuura.github.io/GetCash']
    : ['http://localhost:3300', 'http://127.0.0.1:3300'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Add health check and status routes
createHealthRoutes(app);

app.post('/api/register', async (req, res) => {
  const { username, password, phone } = req.body;
  if (!username || !password || !phone) {
    return res.status(400).json({ message: 'Username, password, and phone number required.' });
  }
  
  try {
    // Check if user already exists
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists.' });
    }
    
    // Create new user
    await db.createUser(username, password, phone);
    res.json({ message: 'Registration successful.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await db.getUserByCredentials(username, password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    
    // Create JWT token
    const token = jwt.sign({ username, userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful.', token, userId: user.id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided.' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token.' });
    }
    req.user = user;
    next();
  });
}

// Task management endpoints
app.post('/api/tasks', async (req, res) => {
  const { title, price, imageData } = req.body;
  
  if (!title || !price || !imageData) {
    return res.status(400).json({ message: 'Title, price, and image are required.' });
  }
  
  try {
    const task = await db.createTask(title, parseInt(price), imageData);
    res.json({ message: 'Task created successfully.', task });
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ message: 'Failed to create task.' });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await db.getAllTasks();
    // Convert database format to frontend format
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      price: task.price,
      img: task.image_data,
      uploadDate: task.upload_date
    }));
    res.json(formattedTasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Failed to retrieve tasks.' });
  }
});

app.get('/api/tasks/date/:date', async (req, res) => {
  const { date } = req.params;
  
  try {
    const tasks = await db.getTasksByDate(date);
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      price: task.price,
      img: task.image_data,
      uploadDate: task.upload_date
    }));
    res.json(formattedTasks);
  } catch (error) {
    console.error('Get tasks by date error:', error);
    res.status(500).json({ message: 'Failed to retrieve tasks.' });
  }
});

app.delete('/api/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  
  try {
    const result = await db.deleteTask(parseInt(taskId));
    if (result.deleted) {
      res.json({ message: 'Task deleted successfully.' });
    } else {
      res.status(404).json({ message: 'Task not found.' });
    }
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Failed to delete task.' });
  }
});

app.delete('/api/tasks', async (req, res) => {
  try {
    await db.deleteAllTasks();
    res.json({ message: 'All tasks deleted successfully.' });
  } catch (error) {
    console.error('Delete tasks error:', error);
    res.status(500).json({ message: 'Failed to delete tasks.' });
  }
});

// Job level earnings configuration
const JOB_LEVELS = {
  'trainee': { perTask: 500, dailyTasks: 5, investment: 0 },
  'junior': { perTask: 500, dailyTasks: 5, investment: 60000 },
  'senior': { perTask: 1000, dailyTasks: 10, investment: 250000 },
  'expert': { perTask: 1200, dailyTasks: 20, investment: 650000 },
  'master': { perTask: 2000, dailyTasks: 30, investment: 1500000 }
};

// Completed tasks endpoints
app.post('/api/tasks/:taskId/complete', authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  const { userId } = req.user;
  
  try {
    const result = await db.markTaskCompleted(userId, parseInt(taskId));
    if (result.completed) {
      // Get user's current job level (default to trainee)
      const userData = await db.getUserData(userId);
      const userJobLevel = userData.job_level || 'trainee';
      const earnings = JOB_LEVELS[userJobLevel].perTask;
      
      // Update user's wallet with earnings
      const newPersonalWallet = (userData.personal_wallet || 0) + earnings;
      const newTotalEarnings = (userData.total_earnings || 0) + earnings;
      
      await db.updateUserWallet(userId, userData.income_wallet, newPersonalWallet, newTotalEarnings);
      
      res.json({ 
        message: 'Task completed successfully!', 
        earnings: earnings,
        newBalance: newPersonalWallet,
        jobLevel: userJobLevel
      });
    } else {
      res.json({ message: 'Task was already completed.' });
    }
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ message: 'Failed to mark task as completed.' });
  }
});

app.get('/api/tasks/completed', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  
  try {
    const completedTaskIds = await db.getCompletedTasks(userId);
    res.json(completedTaskIds);
  } catch (error) {
    console.error('Get completed tasks error:', error);
    res.status(500).json({ message: 'Failed to retrieve completed tasks.' });
  }
});

app.delete('/api/tasks/:taskId/complete', authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  const { userId } = req.user;
  
  try {
    await db.removeCompletedTask(userId, parseInt(taskId));
    res.json({ message: 'Task removed from completed list.' });
  } catch (error) {
    console.error('Remove completed task error:', error);
    res.status(500).json({ message: 'Failed to remove completed task.' });
  }
});

// User data endpoints
app.get('/api/user/data', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  
  try {
    const userData = await db.getUserData(userId);
    res.json(userData);
  } catch (error) {
    console.error('Get user data error:', error);
    res.status(500).json({ message: 'Failed to retrieve user data.' });
  }
});

app.put('/api/user/wallet', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const { incomeWallet, personalWallet, totalEarnings } = req.body;
  
  try {
    await db.updateUserWallet(userId, incomeWallet, personalWallet, totalEarnings);
    res.json({ message: 'Wallet updated successfully.' });
  } catch (error) {
    console.error('Update wallet error:', error);
    res.status(500).json({ message: 'Failed to update wallet.' });
  }
});

// Job level management
app.post('/api/user/upgrade-job', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const { jobLevel, investmentAmount } = req.body;
  
  try {
    if (!JOB_LEVELS[jobLevel]) {
      return res.status(400).json({ message: 'Invalid job level' });
    }
    
    const requiredInvestment = JOB_LEVELS[jobLevel].investment;
    if (investmentAmount < requiredInvestment) {
      return res.status(400).json({ 
        message: `Insufficient investment. Required: UGX ${requiredInvestment.toLocaleString()}` 
      });
    }
    
    // Update user's job level (this would be stored in the database)
    // For now, we'll use a simple approach
    await db.updateUserJobLevel(userId, jobLevel);
    
    res.json({ 
      message: `Successfully upgraded to ${jobLevel} level!`,
      jobLevel: jobLevel,
      perTaskEarning: JOB_LEVELS[jobLevel].perTask
    });
  } catch (error) {
    console.error('Job upgrade error:', error);
    res.status(500).json({ message: 'Failed to upgrade job level' });
  }
});

app.get('/api/job-levels', (req, res) => {
  res.json(JOB_LEVELS);
});

// Withdrawal endpoints
app.post('/api/withdrawal/request', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const { amount, phone, recipientName, network } = req.body;
  
  try {
    // Validate input
    if (!amount || amount < 10000) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is UGX 10,000' });
    }
    
    if (!phone || !recipientName || !network) {
      return res.status(400).json({ message: 'Phone number, recipient name, and network provider are required' });
    }
    
    // Get user data to check balance
    const userData = await db.getUserData(userId);
    const currentBalance = userData.personal_wallet || 0;
    
    if (amount > currentBalance) {
      return res.status(400).json({ 
        message: `Insufficient balance. Available: UGX ${currentBalance.toLocaleString()}` 
      });
    }
    
    // Calculate fees
    const processingFee = Math.round(amount * 0.02); // 2% fee
    const finalAmount = amount - processingFee;
    
    // Update user balance (deduct withdrawal amount)
    const newBalance = currentBalance - amount;
    await db.updateUserWallet(userId, userData.income_wallet, newBalance, userData.total_earnings);
    
    // Create withdrawal record (in a real app, you'd have a withdrawals table)
    const withdrawalRecord = {
      id: Date.now(),
      userId: userId,
      amount: amount,
      fee: processingFee,
      finalAmount: finalAmount,
      phone: phone,
      recipientName: recipientName,
      network: network,
      status: 'Processing',
      timestamp: new Date().toISOString()
    };
    
    res.json({ 
      message: 'Withdrawal request submitted successfully',
      withdrawal: withdrawalRecord,
      newBalance: newBalance
    });
    
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ message: 'Failed to process withdrawal request' });
  }
});

app.get('/api/withdrawal/history', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  
  try {
    // In a real app, you'd query a withdrawals table
    // For now, return empty array or demo data
    res.json([]);
  } catch (error) {
    console.error('Get withdrawal history error:', error);
    res.status(500).json({ message: 'Failed to retrieve withdrawal history' });
  }
});

// Example protected route
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Protected data', user: req.user });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  db.close();
  process.exit(0);
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`💾 Database storage enabled - data persists on disk`);
  
  if (NODE_ENV === 'production') {
    console.log('🌐 Production server ready for GetCash app!');
    console.log('🔗 Accessible from: https://buttuura.github.io/GetCash');
  } else {
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
  }
});

// Handle server shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    db.close();
    process.exit(0);
  });
});