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
      const dbSize = await this.getDatabaseSize();
      
      return {
        users,
        tasks,
        completedTasks,
        databaseSize: dbSize,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }

  // User management
  async getUserCount() {
    return new Promise((resolve, reject) => {
      this.db.db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
  }

  async getTaskCount() {
    return new Promise((resolve, reject) => {
      this.db.db.get('SELECT COUNT(*) as count FROM tasks', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
  }

  async getCompletedTaskCount() {
    return new Promise((resolve, reject) => {
      this.db.db.get('SELECT COUNT(*) as count FROM completed_tasks', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
  }

  async getDatabaseSize() {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const dbPath = path.join(__dirname, 'app_data.db');
      const stats = fs.statSync(dbPath);
      return {
        bytes: stats.size,
        mb: (stats.size / (1024 * 1024)).toFixed(2),
        kb: (stats.size / 1024).toFixed(2)
      };
    } catch (error) {
      return { bytes: 0, mb: '0.00', kb: '0.00' };
    }
  }

  // Data export for backup
  async exportAllData() {
    try {
      const users = await new Promise((resolve, reject) => {
        this.db.db.all('SELECT id, username, phone, created_at FROM users', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      const tasks = await new Promise((resolve, reject) => {
        this.db.db.all('SELECT * FROM tasks', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      const completedTasks = await new Promise((resolve, reject) => {
        this.db.db.all('SELECT * FROM completed_tasks', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      const userData = await new Promise((resolve, reject) => {
        this.db.db.all('SELECT * FROM user_data', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

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
      const cutoff = cutoffDate.toISOString();

      // Remove old completed tasks
      const result = await new Promise((resolve, reject) => {
        this.db.db.run(
          'DELETE FROM completed_tasks WHERE completed_at < ?',
          [cutoff],
          function(err) {
            if (err) reject(err);
            else resolve(this.changes);
          }
        );
      });

      console.log(`Cleaned up ${result} old completed tasks`);
      return result;
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

  async close() {
    this.db.close();
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
          console.log(`💾 Database Size: ${stats.databaseSize.mb} MB`);
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
    } finally {
      await manager.close();
    }
  }

  runCommand();
}

module.exports = DatabaseManager;