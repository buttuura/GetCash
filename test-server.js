const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3300;

// CORS configuration for GitHub Pages
const corsOptions = {
  origin: ['https://buttuura.github.io', 'https://buttuura.github.io/GetCash', 'http://localhost:3300'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Basic health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'GetCash API Server Running',
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Server is healthy'
  });
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

// Simple login endpoint for testing
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }
  
  // Simple test response
  res.json({
    message: 'Login endpoint working',
    user: { username },
    status: 'success'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found', path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Time: ${new Date().toISOString()}`);
});