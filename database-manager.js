const Database = require('./database');

class DatabaseManager {
  constructor() {
    this.db = new Database();
  }

  // Get comprehensive database statistics
  async getStats() {
    try {
      const users = await this.getUserCount();
      const tasks = await this.getTaskCount();
      const completedTasks = await this.getCompletedTaskCount();
      
      return {
        users,
        tasks,
        completedTasks,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }

  // User management (MongoDB queries)
  async getUserCount() {
    try {
      if (!this.db.User) throw new Error('Database not initialized');
      return await this.db.User.countDocuments();
    } catch (error) {
      console.error('Error counting users:', error);
      throw error;
    }
  }

  async getTaskCount() {
    try {
      if (!this.db.Task) throw new Error('Database not initialized');
      return await this.db.Task.countDocuments();
    } catch (error) {
      console.error('Error counting tasks:', error);
      throw error;
    }
  }

  async getCompletedTaskCount() {
    try {
      if (!this.db.CompletedTask) throw new Error('Database not initialized');
      return await this.db.CompletedTask.countDocuments();
    } catch (error) {
      console.error('Error counting completed tasks:', error);
      throw error;
    }
  }

  // Data export for backup (MongoDB)
  async exportAllData() {
    try {
      const users = await this.db.User.find({}, 'username phone created_at').lean();
      const tasks = await this.db.Task.find({}).lean();
      const completedTasks = await this.db.CompletedTask.find({}).lean();
      const userData = await this.db.UserData.find({}).lean();

      return {
        exportDate: new Date().toISOString(),
        users: users.length,
        tasks: tasks.length,
        completedTasks: completedTasks.length,
        data: {
          users,
          tasks,
          completedTasks,
          userData
        }
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Clean up old data (useful for maintenance)
  async cleanupOldData(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Remove old completed tasks
      const result = await this.db.CompletedTask.deleteMany({
        completed_at: { $lt: cutoffDate }
      });

      console.log(`Cleaned up ${result.deletedCount} old completed tasks`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      throw error;
    }
  }

  // Create admin user if doesn't exist
  async ensureAdminUser() {
    try {
      const adminUsername = process.env.ADMIN_USERNAME || '0776944';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Book@123';
      const adminPhone = process.env.ADMIN_PHONE || '0776944322';

      const existingAdmin = await this.db.getUserByUsername(adminUsername);
      
      if (!existingAdmin) {
        await this.db.createUser(adminUsername, adminPassword, adminPhone);
        console.log('✅ Admin user created');
        return true;
      } else {
        console.log('ℹ️  Admin user already exists');
        return false;
      }
    } catch (error) {
      console.error('Error ensuring admin user:', error);
      throw error;
    }
  }
}

// CLI interface for database management
if (require.main === module) {
  const manager = new DatabaseManager();
  const command = process.argv[2];

  async function runCommand() {
    try {
      switch (command) {
        case 'stats':
          const stats = await manager.getStats();
          console.log('\n=== DATABASE STATISTICS ===');
          console.log(`👥 Users: ${stats.users}`);
          console.log(`📋 Tasks: ${stats.tasks}`);
          console.log(`✅ Completed Tasks: ${stats.completedTasks}`);
          console.log(`📅 Last Updated: ${stats.timestamp}`);
          break;

        case 'export':
          const data = await manager.exportAllData();
          const filename = `backup_${new Date().toISOString().split('T')[0]}.json`;
          require('fs').writeFileSync(filename, JSON.stringify(data, null, 2));
          console.log(`✅ Data exported to ${filename}`);
          break;

        case 'cleanup':
          const days = parseInt(process.argv[3]) || 30;
          const cleaned = await manager.cleanupOldData(days);
          console.log(`✅ Cleaned up ${cleaned} old records (older than ${days} days)`);
          break;

        case 'admin':
          const created = await manager.ensureAdminUser();
          if (created) {
            console.log('✅ Admin user created successfully');
          }
          break;

        default:
          console.log('Available commands:');
          console.log('  node database-manager.js stats    - Show database statistics');
          console.log('  node database-manager.js export   - Export all data to JSON');
          console.log('  node database-manager.js cleanup [days] - Clean up old data');
          console.log('  node database-manager.js admin    - Ensure admin user exists');
      }
    } catch (error) {
      console.error('Command failed:', error.message);
    }
  }

  runCommand();
}

module.exports = DatabaseManager;