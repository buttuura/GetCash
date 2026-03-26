const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB connection
class Database {
  constructor() {
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/getcash';
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Connected to MongoDB successfully');
      this.createSchemas();
      this.initialized = true;
    } catch (error) {
      console.error('Error connecting to MongoDB:', error.message);
      // Retry connection after 5 seconds
      setTimeout(() => this.init(), 5000);
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
      const hashedPassword = await this.hashPassword(password);
      const user = new this.User({ username, password: hashedPassword, phone });
      const savedUser = await user.save();
      
      // Create initial user data entry
      const userData = new this.UserData({ user_id: savedUser._id });
      await userData.save();
      
      return { id: savedUser._id, username: savedUser.username, phone: savedUser.phone };
    } catch (error) {
      throw error;
    }
  }

  async getUserByCredentials(username, password) {
    try {
      const user = await this.User.findOne({ username });
      if (!user) return null;
      
      // Compare provided password with stored hashed password
      const passwordMatch = await this.comparePassword(password, user.password);
      if (!passwordMatch) return null;
      
      return { id: user._id, username: user.username, phone: user.phone };
    } catch (error) {
      throw error;
    }
  }

  async getUserByUsername(username) {
    try {
      const user = await this.User.findOne({ username });
      return user ? { id: user._id, username: user.username, phone: user.phone } : null;
    } catch (error) {
      throw error;
    }
  }

  // Task operations
  async createTask(title, price, imageData) {
    try {
      const task = new this.Task({ title, price, image_data: imageData });
      const savedTask = await task.save();
      return { id: savedTask._id, title: savedTask.title, price: savedTask.price, image_data: savedTask.image_data };
    } catch (error) {
      throw error;
    }
  }

  async getAllTasks() {
    try {
      const tasks = await this.Task.find().sort({ created_at: -1 });
      return tasks;
    } catch (error) {
      throw error;
    }
  }

  async getTasksByDate(date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const tasks = await this.Task.find({
        upload_date: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ created_at: -1 });
      return tasks;
    } catch (error) {
      throw error;
    }
  }

  async deleteTask(taskId) {
    try {
      const result = await this.Task.deleteOne({ _id: taskId });
      // Also remove completed task records
      await this.CompletedTask.deleteMany({ task_id: taskId });
      return { deleted: result.deletedCount > 0, taskId };
    } catch (error) {
      throw error;
    }
  }

  async deleteAllTasks() {
    try {
      await this.Task.deleteMany({});
      await this.CompletedTask.deleteMany({});
    } catch (error) {
      throw error;
    }
  }

  // Completed task operations
  async markTaskCompleted(userId, taskId) {
    try {
      const existingRecord = await this.CompletedTask.findOne({ user_id: userId, task_id: taskId });
      if (existingRecord) {
        return { userId, taskId, completed: false, message: 'Task already completed' };
      }
      const completed = new this.CompletedTask({ user_id: userId, task_id: taskId });
      await completed.save();
      return { userId, taskId, completed: true };
    } catch (error) {
      throw error;
    }
  }

  async getCompletedTasks(userId) {
    try {
      const completedRecords = await this.CompletedTask.find({ user_id: userId });
      return completedRecords.map(record => record.task_id.toString());
    } catch (error) {
      throw error;
    }
  }

  async removeCompletedTask(userId, taskId) {
    try {
      const result = await this.CompletedTask.deleteOne({ user_id: userId, task_id: taskId });
      return { removed: result.deletedCount > 0 };
    } catch (error) {
      throw error;
    }
  }

  // User data operations
  async getUserData(userId) {
    try {
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
      throw error;
    }
  }

  async updateUserWallet(userId, incomeWallet, personalWallet, totalEarnings) {
    try {
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
      throw error;
    }
  }

  async updateUserJobLevel(userId, jobLevel) {
    try {
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
      throw error;
    }
  }

  async close() {
    try {
      await mongoose.disconnect();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error.message);
    }
  }
}

module.exports = Database;