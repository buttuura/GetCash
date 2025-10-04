// API helper functions for communicating with the backend
class ApiClient {
  constructor() {
    // Detect if we're running locally or on GitHub Pages
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocal) {
      this.baseUrl = 'http://localhost:3300/api';
    } else {
      // Try multiple possible Render URLs
      this.possibleUrls = [
        'https://getcash-backend.onrender.com/api',
        'https://getcash.onrender.com/api',
        'https://getcash-backend-latest.onrender.com/api'
      ];
      this.baseUrl = this.possibleUrls[0]; // Start with first URL
      this.isDeployed = true;
      console.log('🌐 Trying deployed server:', this.baseUrl);
    }
    
    this.token = localStorage.getItem('authToken');
  }

  // Test server connectivity
  async testConnection() {
    if (!this.isDeployed) return true;
    
    for (const url of this.possibleUrls) {
      try {
        console.log('🔍 Testing connection to:', url);
        const response = await fetch(`${url.replace('/api', '')}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        });
        if (response.ok) {
          console.log('✅ Connected to:', url);
          this.baseUrl = url;
          return true;
        }
      } catch (error) {
        console.log('❌ Failed to connect to:', url);
      }
    }
    return false;
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Get authentication headers
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Generic API request handler
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    try {
      console.log('🔄 Making API request to:', url);
      
      // Add timeout for deployed requests
      if (this.isDeployed) {
        config.signal = AbortSignal.timeout(45000); // 45 second timeout for cold starts
      }
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 0 || !response.status) {
          throw new Error('🚨 Cannot connect to server. Make sure the backend is deployed and running.');
        }
        
        let errorMessage;
        try {
          const data = await response.json();
          errorMessage = data.message || `Server error: ${response.status}`;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('✅ API request successful');
      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // Check if we're trying to connect to deployed server
        if (this.isDeployed) {
          throw new Error('🚀 Server is starting up (this can take 30-60 seconds on first request). Please wait and try again.');
        } else {
          throw new Error('🌐 Cannot connect to local server. Make sure to run "npm start" in your backend folder.');
        }
      }
      
      throw error;
    }
  }

  // Authentication methods
  async register(username, password, phone) {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, phone })
    });
  }

  async login(username, password) {
    const data = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    if (data.token) {
      this.setToken(data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', username);
    }
    
    return data;
  }

  // Task management methods
  async createTask(title, price, imageData) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, price, imageData })
    });
  }

  async getAllTasks() {
    return this.request('/tasks');
  }

  async getTasksByDate(date) {
    return this.request(`/tasks/date/${date}`);
  }

  async deleteTask(taskId) {
    return this.request(`/tasks/${taskId}`, {
      method: 'DELETE'
    });
  }

  async deleteAllTasks() {
    return this.request('/api/tasks', {
      method: 'DELETE'
    });
  }

  // Completed tasks methods
  async markTaskCompleted(taskId) {
    return this.request(`/tasks/${taskId}/complete`, {
      method: 'POST'
    });
  }

  async getCompletedTasks() {
    return this.request('/tasks/completed');
  }

  async removeCompletedTask(taskId) {
    return this.request(`/tasks/${taskId}/complete`, {
      method: 'DELETE'
    });
  }

  // User data methods
  async getUserData() {
    return this.request('/user/data');
  }

  async updateWallet(incomeWallet, personalWallet, totalEarnings) {
    return this.request('/user/wallet', {
      method: 'PUT',
      body: JSON.stringify({ incomeWallet, personalWallet, totalEarnings })
    });
  }
}

// Create a global instance
const apiClient = new ApiClient();

// Data migration helper - migrates localStorage data to database
class DataMigration {
  static async migrateLocalStorageToDatabase() {
    try {
      // Check if migration is needed
      const migrationComplete = localStorage.getItem('migration_complete');
      if (migrationComplete) {
        console.log('Data already migrated to database');
        return;
      }

      console.log('Starting data migration from localStorage to database...');
      
      // Migrate admin tasks
      const adminTasks = JSON.parse(localStorage.getItem('adminTasks') || '[]');
      if (adminTasks.length > 0) {
        console.log(`Migrating ${adminTasks.length} admin tasks...`);
        for (const task of adminTasks) {
          try {
            await apiClient.createTask(task.title, task.price, task.img);
          } catch (error) {
            console.warn('Failed to migrate task:', task.title, error);
          }
        }
        console.log('Admin tasks migrated successfully');
      }

      // Mark migration as complete
      localStorage.setItem('migration_complete', 'true');
      console.log('Data migration completed successfully');
      
      // Optionally clear old localStorage data (uncomment if you want to clean up)
      // localStorage.removeItem('adminTasks');
      // localStorage.removeItem('completedTasks');
      
    } catch (error) {
      console.error('Data migration failed:', error);
    }
  }

  // Force re-migration (useful for testing)
  static resetMigration() {
    localStorage.removeItem('migration_complete');
  }
}

// Storage Manager - provides unified interface for data access
class StorageManager {
  constructor() {
    this.useDatabase = true; // Set to false to fall back to localStorage
  }

  // Task methods
  async getTasks() {
    if (this.useDatabase) {
      try {
        return await apiClient.getAllTasks();
      } catch (error) {
        console.warn('Database unavailable, falling back to localStorage:', error);
        return JSON.parse(localStorage.getItem('adminTasks') || '[]');
      }
    } else {
      return JSON.parse(localStorage.getItem('adminTasks') || '[]');
    }
  }

  async createTask(title, price, imageData) {
    if (this.useDatabase) {
      try {
        return await apiClient.createTask(title, price, imageData);
      } catch (error) {
        console.warn('Database unavailable, saving to localStorage:', error);
        // Fallback to localStorage
        const tasks = JSON.parse(localStorage.getItem('adminTasks') || '[]');
        const newTask = {
          id: Date.now(),
          title,
          price: parseInt(price),
          img: imageData,
          uploadDate: new Date().toISOString().split('T')[0]
        };
        tasks.push(newTask);
        localStorage.setItem('adminTasks', JSON.stringify(tasks));
        return { task: newTask };
      }
    } else {
      // localStorage implementation
      const tasks = JSON.parse(localStorage.getItem('adminTasks') || '[]');
      const newTask = {
        id: Date.now(),
        title,
        price: parseInt(price),
        img: imageData,
        uploadDate: new Date().toISOString().split('T')[0]
      };
      tasks.push(newTask);
      localStorage.setItem('adminTasks', JSON.stringify(tasks));
      return { task: newTask };
    }
  }

  async deleteTask(taskId) {
    if (this.useDatabase) {
      try {
        await apiClient.deleteTask(taskId);
        return;
      } catch (error) {
        console.warn('Database unavailable, using localStorage fallback:', error);
      }
    }
    // Fallback to localStorage
    const tasks = JSON.parse(localStorage.getItem('adminTasks') || '[]');
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    localStorage.setItem('adminTasks', JSON.stringify(updatedTasks));
  }

  async clearAllTasks() {
    if (this.useDatabase) {
      try {
        await apiClient.deleteAllTasks();
        return;
      } catch (error) {
        console.warn('Database unavailable, clearing localStorage:', error);
      }
    }
    // Fallback to localStorage
    localStorage.removeItem('adminTasks');
    localStorage.removeItem('completedTasks');
  }

  // Completed tasks methods
  async getCompletedTasks() {
    if (this.useDatabase && apiClient.token) {
      try {
        return await apiClient.getCompletedTasks();
      } catch (error) {
        console.warn('Database unavailable, using localStorage:', error);
        return JSON.parse(localStorage.getItem('completedTasks') || '[]');
      }
    } else {
      return JSON.parse(localStorage.getItem('completedTasks') || '[]');
    }
  }

  async markTaskCompleted(taskId) {
    if (this.useDatabase && apiClient.token) {
      try {
        const response = await apiClient.markTaskCompleted(taskId);
        return response; // Return the full response with earnings data
      } catch (error) {
        console.warn('Database unavailable, using localStorage:', error);
      }
    }
    // Fallback to localStorage
    const completed = JSON.parse(localStorage.getItem('completedTasks') || '[]');
    if (!completed.includes(taskId)) {
      completed.push(taskId);
      localStorage.setItem('completedTasks', JSON.stringify(completed));
    }
    return { message: 'Task completed (offline)', offline: true };
  }

  async getUserData() {
    if (this.useDatabase && apiClient.token) {
      try {
        return await apiClient.getUserData();
      } catch (error) {
        console.warn('Database unavailable, using localStorage:', error);
      }
    }
    // Fallback to localStorage
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  async removeCompletedTask(taskId) {
    if (this.useDatabase && apiClient.token) {
      try {
        await apiClient.removeCompletedTask(taskId);
        return;
      } catch (error) {
        console.warn('Database unavailable, using localStorage:', error);
      }
    }
    // Fallback to localStorage
    const completed = JSON.parse(localStorage.getItem('completedTasks') || '[]');
    const index = completed.indexOf(taskId);
    if (index !== -1) {
      completed.splice(index, 1);
      localStorage.setItem('completedTasks', JSON.stringify(completed));
    }
  }
}

// Create global instances
const storageManager = new StorageManager();

// Auto-migrate data on page load (run once)
document.addEventListener('DOMContentLoaded', () => {
  // Only migrate if user is logged in (to avoid errors)
  if (localStorage.getItem('authToken') || localStorage.getItem('username')) {
    DataMigration.migrateLocalStorageToDatabase();
  }
});