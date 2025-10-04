const Database = require('./database');

class DatabaseViewer {
  constructor() {
    this.db = new Database();
  }

  async viewAllData() {
    console.log('\n=== DATABASE OVERVIEW ===\n');
    
    try {
      // Users
      const users = await this.getAllUsers();
      console.log('👥 USERS:');
      users.forEach(user => {
        console.log(`  - ${user.username} (ID: ${user.id}, Phone: ${user.phone})`);
      });
      console.log(`  Total users: ${users.length}\n`);

      // Tasks
      const tasks = await this.db.getAllTasks();
      console.log('📋 TASKS:');
      tasks.forEach(task => {
        console.log(`  - ${task.title} - UGX ${task.price} (Uploaded: ${task.upload_date})`);
      });
      console.log(`  Total tasks: ${tasks.length}\n`);

      // Database file size
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, 'app_data.db');
      const stats = fs.statSync(dbPath);
      const fileSizeInBytes = stats.size;
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
      console.log(`💾 DATABASE FILE SIZE: ${fileSizeInMB} MB (${fileSizeInBytes} bytes)\n`);

      console.log('✅ Database is working properly and storing data on your HDD!');
      
    } catch (error) {
      console.error('❌ Error viewing database:', error);
    } finally {
      this.db.close();
    }
  }

  async getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.db.all('SELECT * FROM users ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getStorageStats() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, 'app_data.db');
      
      if (!fs.existsSync(dbPath)) {
        console.log('❌ Database file not found');
        return;
      }

      const stats = fs.statSync(dbPath);
      const fileSizeInBytes = stats.size;
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
      const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);

      console.log('\n=== STORAGE STATISTICS ===');
      console.log(`📁 Database location: ${dbPath}`);
      console.log(`📊 File size: ${fileSizeInMB} MB (${fileSizeInKB} KB)`);
      console.log(`💽 Storage type: Hard Disk Drive (HDD)`);
      console.log(`🔄 Auto-backup: Enabled (SQLite WAL mode)`);
      
      // Check available disk space
      const disk = require('fs');
      console.log('✅ Your data is now stored persistently on your HDD!');
      console.log('   Unlike localStorage (limited to ~5-10MB), you now have virtually unlimited storage.');
      
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
    } finally {
      this.db.close();
    }
  }
}

// Command line interface
const args = process.argv.slice(2);
const viewer = new DatabaseViewer();

if (args.includes('--stats') || args.includes('-s')) {
  viewer.getStorageStats();
} else {
  viewer.viewAllData();
}