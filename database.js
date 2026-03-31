const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB connection
class Database {
  constructor() {
    this.initialized = false;
    this.connectionPromise = this.init();
  }

  async init() {
    try {
      // Use environment variable when available (recommended), otherwise fallback to provided credentials.
      const mongoUri = process.env.MONGODB_URI || 'mongodb://GetCash:AUYgPTSPW6rsFdpo@localhost:27017/GetCash?authSource=admin';
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('✅ Connected to MongoDB successfully');
      this.createSchemas();
      this.initialized = true;
      console.log('✅ Database schemas created and ready');
      return true;
    } catch (error) {
      console.error('❌ Error connecting to MongoDB:', error.message);
      // Retry connection after 5 seconds
      console.log('🔄 Retrying connection in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return this.init();
    }
  }

  // Wait for database to be initialized before operations
  async ensureInitialized() {
    if (!this.initialized) {
      console.log('⏳ Waiting for database to initialize...');
      await this.connectionPromise;
    }
  }

  createSchemas() {
    // User Schema
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true }, // Will store hashed password
      phone: { type: String, required: true },
      created_at: { type: Date, default: Date.now }
    });

    // Task Schema
    const taskSchema = new mongoose.Schema({
      title: { type: String, required: true },
      price: { type: Number, required: true },
      image_data: { type: String, required: true },
      upload_date: { type: Date, default: Date.now },
      created_at: { type: Date, default: Date.now }
    });

    // Completed Tasks Schema
    const completedTaskSchema = new mongoose.Schema({
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
      completed_at: { type: Date, default: Date.now }
    });
    completedTaskSchema.index({ user_id: 1, task_id: 1 }, { unique: true });

    // User Data Schema (wallet info, earnings, etc.)
    const userDataSchema = new mongoose.Schema({
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
      income_wallet: { type: Number, default: 0 },
      personal_wallet: { type: Number, default: 0 },
      total_earnings: { type: Number, default: 0 },
      total_withdrawals: { type: Number, default: 0 },
      job_level: { type: String, default: 'trainee' },
      tasks_completed_today: { type: Number, default: 0 },
      last_task_date: { type: Date, default: Date.now },
      updated_at: { type: Date, default: Date.now }
    });

    // Get or create models
    this.User = mongoose.model('User', userSchema);
    this.Task = mongoose.model('Task', taskSchema);
    this.CompletedTask = mongoose.model('CompletedTask', completedTaskSchema);
    this.UserData = mongoose.model('UserData', userDataSchema);

    console.log('Database schemas created successfully');
  }

  // Hash password using bcrypt
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, 10);
    } catch (error) {
      throw new Error('Error hashing password');
    }
  }

  // Compare password with hashed password
  async comparePassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error('Error comparing password');
    }
  }

  // User operations
  async createUser(username, password, phone) {
    try {
      await this.ensureInitialized();
      const hashedPassword = await this.hashPassword(password);
      const user = new this.User({ username, password: hashedPassword, phone });
      const savedUser = await user.save();
      
      // Create initial user data entry
      const userData = new this.UserData({ user_id: savedUser._id });
      await userData.save();
      
      return { id: savedUser._id, username: savedUser.username, phone: savedUser.phone };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserByCredentials(username, password) {
    try {
      await this.ensureInitialized();
      const user = await this.User.findOne({ username });
      if (!user) return null;
      
      // Compare provided password with stored hashed password
      const passwordMatch = await this.comparePassword(password, user.password);
      if (!passwordMatch) return null;
      
      return { id: user._id, username: user.username, phone: user.phone };
    } catch (error) {
      console.error('Error getting user by credentials:', error);
      throw error;
    }
  }

  async getUserByUsername(username) {
    try {
      await this.ensureInitialized();
      const user = await this.User.findOne({ username });
      return user ? { id: user._id, username: user.username, phone: user.phone } : null;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  // Task operations
  async createTask(title, price, imageData) {
    try {
      await this.ensureInitialized();
      const task = new this.Task({ title, price, image_data: imageData });
      const savedTask = await task.save();
      return { id: savedTask._id, title: savedTask.title, price: savedTask.price, image_data: savedTask.image_data };
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async getAllTasks() {
    try {
      await this.ensureInitialized();
      const tasks = await this.Task.find().sort({ created_at: -1 });
      return tasks;
    } catch (error) {
      console.error('Error getting all tasks:', error);
      throw error;
    }
  }

  async getTasksByDate(date) {
    try {
      await this.ensureInitialized();
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const tasks = await this.Task.find({
        upload_date: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ created_at: -1 });
      return tasks;
    } catch (error) {
      console.error('Error getting tasks by date:', error);
      throw error;
    }
  }

  async deleteTask(taskId) {
    try {
      await this.ensureInitialized();
      const result = await this.Task.deleteOne({ _id: taskId });
      // Also remove completed task records
      await this.CompletedTask.deleteMany({ task_id: taskId });
      return { deleted: result.deletedCount > 0, taskId };
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  async deleteAllTasks() {
    try {
      await this.ensureInitialized();
      await this.Task.deleteMany({});
      await this.CompletedTask.deleteMany({});
    } catch (error) {
      console.error('Error deleting all tasks:', error);
      throw error;
    }
  }

  // Completed task operations
  async markTaskCompleted(userId, taskId) {
    try {
      await this.ensureInitialized();
      const existingRecord = await this.CompletedTask.findOne({ user_id: userId, task_id: taskId });
      if (existingRecord) {
        return { userId, taskId, completed: false, message: 'Task already completed' };
      }
      const completed = new this.CompletedTask({ user_id: userId, task_id: taskId });
      await completed.save();
      return { userId, taskId, completed: true };
    } catch (error) {
      console.error('Error marking task completed:', error);
      throw error;
    }
  }

  async getCompletedTasks(userId) {
    try {
      await this.ensureInitialized();
      const completedRecords = await this.CompletedTask.find({ user_id: userId });
      return completedRecords.map(record => record.task_id.toString());
    } catch (error) {
      console.error('Error getting completed tasks:', error);
      throw error;
    }
  }

  async removeCompletedTask(userId, taskId) {
    try {
      await this.ensureInitialized();
      const result = await this.CompletedTask.deleteOne({ user_id: userId, task_id: taskId });
      return { removed: result.deletedCount > 0 };
    } catch (error) {
      console.error('Error removing completed task:', error);
      throw error;
    }
  }

  // User data operations
  async getUserData(userId) {
    try {
      await this.ensureInitialized();
      let userData = await this.UserData.findOne({ user_id: userId });
      if (!userData) {
        userData = new this.UserData({ user_id: userId });
        await userData.save();
      }
      return {
        user_id: userData.user_id,
        income_wallet: userData.income_wallet,
        personal_wallet: userData.personal_wallet,
        total_earnings: userData.total_earnings,
        total_withdrawals: userData.total_withdrawals,
        job_level: userData.job_level
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  async updateUserWallet(userId, incomeWallet, personalWallet, totalEarnings) {
    try {
      await this.ensureInitialized();
      const result = await this.UserData.findOneAndUpdate(
        { user_id: userId },
        {
          income_wallet: incomeWallet,
          personal_wallet: personalWallet,
          total_earnings: totalEarnings,
          updated_at: new Date()
        },
        { new: true, upsert: true }
      );
      return { updated: !!result };
    } catch (error) {
      console.error('Error updating user wallet:', error);
      throw error;
    }
  }

  async updateUserJobLevel(userId, jobLevel) {
    try {
      await this.ensureInitialized();
      const result = await this.UserData.findOneAndUpdate(
        { user_id: userId },
        {
          job_level: jobLevel,
          updated_at: new Date()
        },
        { new: true, upsert: true }
      );
      return { updated: !!result };
    } catch (error) {
      console.error('Error updating user job level:', error);
      throw error;
    }
  }

  async close() {
    try {
      await mongoose.disconnect();
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database:', error.message);
    }
  }
}

module.exports = Database;