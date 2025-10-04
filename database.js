const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'app_data.db');

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database at:', DB_PATH);
        this.createTables();
      }
    });
  }

  createTables() {
    // Users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tasks table (for admin uploaded tasks)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        price INTEGER NOT NULL,
        image_data TEXT NOT NULL,
        upload_date DATE DEFAULT (DATE('now')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Completed tasks table (tracks which user completed which task)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS completed_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (task_id) REFERENCES tasks (id),
        UNIQUE(user_id, task_id)
      )
    `);

    // User data table (for storing wallet info, earnings, etc.)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        income_wallet DECIMAL(10,2) DEFAULT 0.00,
        personal_wallet DECIMAL(10,2) DEFAULT 0.00,
        total_earnings DECIMAL(10,2) DEFAULT 0.00,
        total_withdrawals DECIMAL(10,2) DEFAULT 0.00,
        job_level VARCHAR(20) DEFAULT 'trainee',
        tasks_completed_today INTEGER DEFAULT 0,
        last_task_date DATE DEFAULT CURRENT_DATE,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id)
      )
    `);

    console.log('Database tables created successfully');
  }

  // User operations
  createUser(username, password, phone) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO users (username, password, phone) VALUES (?, ?, ?)',
        [username, password, phone],
        function(err) {
          if (err) {
            reject(err);
          } else {
            // Create initial user data entry
            const userId = this.lastID;
            resolve({ id: userId, username, phone });
          }
        }
      );
    });
  }

  getUserByCredentials(username, password) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  getUserByUsername(username) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  // Task operations
  createTask(title, price, imageData) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO tasks (title, price, image_data) VALUES (?, ?, ?)',
        [title, price, imageData],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, title, price, imageData });
          }
        }
      );
    });
  }

  getAllTasks() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM tasks ORDER BY created_at DESC', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  getTasksByDate(date) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM tasks WHERE upload_date = ? ORDER BY created_at DESC',
        [date],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  deleteTask(taskId) {
    return new Promise((resolve, reject) => {
      const db = this.db;
      db.run('DELETE FROM tasks WHERE id = ?', [taskId], function(err) {
        if (err) {
          reject(err);
        } else {
          const deletedCount = this.changes;
          // Also remove any completed task records for this task
          db.run('DELETE FROM completed_tasks WHERE task_id = ?', [taskId], (err2) => {
            if (err2) {
              reject(err2);
            } else {
              resolve({ deleted: deletedCount > 0, taskId });
            }
          });
        }
      });
    });
  }

  deleteAllTasks() {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM tasks', (err) => {
        if (err) {
          reject(err);
        } else {
          // Also clear completed tasks
          this.db.run('DELETE FROM completed_tasks', (err2) => {
            if (err2) {
              reject(err2);
            } else {
              resolve();
            }
          });
        }
      });
    });
  }

  // Completed task operations
  markTaskCompleted(userId, taskId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR IGNORE INTO completed_tasks (user_id, task_id) VALUES (?, ?)',
        [userId, taskId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ userId, taskId, completed: this.changes > 0 });
          }
        }
      );
    });
  }

  getCompletedTasks(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT task_id FROM completed_tasks WHERE user_id = ?',
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => row.task_id));
          }
        }
      );
    });
  }

  removeCompletedTask(userId, taskId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM completed_tasks WHERE user_id = ? AND task_id = ?',
        [userId, taskId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ removed: this.changes > 0 });
          }
        }
      );
    });
  }

  // User data operations
  getUserData(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM user_data WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            // Create initial user data if doesn't exist
            this.db.run(
              'INSERT INTO user_data (user_id) VALUES (?)',
              [userId],
              function(err2) {
                if (err2) {
                  reject(err2);
                } else {
                  resolve({
                    user_id: userId,
                    income_wallet: 0.00,
                    personal_wallet: 0.00,
                    total_earnings: 0.00,
                    total_withdrawals: 0.00
                  });
                }
              }
            );
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  updateUserWallet(userId, incomeWallet, personalWallet, totalEarnings) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE user_data 
         SET income_wallet = ?, personal_wallet = ?, total_earnings = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`,
        [incomeWallet, personalWallet, totalEarnings, userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ updated: this.changes > 0 });
          }
        }
      );
    });
  }

  updateUserJobLevel(userId, jobLevel) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE user_data 
         SET job_level = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`,
        [jobLevel, userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ updated: this.changes > 0 });
          }
        }
      );
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

module.exports = Database;