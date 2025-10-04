const express = require('express');
const DatabaseManager = require('./database-manager');

// Enhanced health check and status endpoints
const createHealthRoutes = (app) => {
  const dbManager = new DatabaseManager();

  // Basic health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // Detailed status with database info
  app.get('/api/status', async (req, res) => {
    try {
      const stats = await dbManager.getStats();
      
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: {
          connected: true,
          users: stats.users,
          tasks: stats.tasks,
          completedTasks: stats.completedTasks,
          size: stats.databaseSize
        },
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          platform: process.platform,
          nodeVersion: process.version
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed',
        details: error.message
      });
    }
  });

  // Ready check for deployment platforms
  app.get('/ready', async (req, res) => {
    try {
      // Test database connection
      await dbManager.getStats();
      res.status(200).send('Ready');
    } catch (error) {
      res.status(503).send('Not Ready');
    }
  });

  // Metrics endpoint (basic)
  app.get('/api/metrics', async (req, res) => {
    try {
      const stats = await dbManager.getStats();
      
      // Basic metrics in Prometheus-like format
      const metrics = [
        `# HELP app_users_total Total number of registered users`,
        `# TYPE app_users_total counter`,
        `app_users_total ${stats.users}`,
        ``,
        `# HELP app_tasks_total Total number of tasks created`,
        `# TYPE app_tasks_total counter`,
        `app_tasks_total ${stats.tasks}`,
        ``,
        `# HELP app_completed_tasks_total Total number of completed tasks`,
        `# TYPE app_completed_tasks_total counter`,
        `app_completed_tasks_total ${stats.completedTasks}`,
        ``,
        `# HELP app_database_size_bytes Database file size in bytes`,
        `# TYPE app_database_size_bytes gauge`,
        `app_database_size_bytes ${stats.databaseSize.bytes}`,
        ``
      ].join('\n');

      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    } catch (error) {
      res.status(500).send('# Error collecting metrics');
    }
  });
};

module.exports = createHealthRoutes;