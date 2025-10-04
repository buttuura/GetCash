/**
 * Client-Side Storage Manager fo            ],
            tasks: [
                {
                    id: 1,
                    title: "Watch YouTube Video",
                    description: "Watch a 5-minute video and get rewarded",
                    reward: 0.5,
                    status: "available",
                    category: "entertainment"
                },
                {
                    id: 2,
                    title: "Share on Social Media",
                    description: "Share our app on your social media",
                    reward: 1.0,
                    status: "available",
                    category: "social"
                },
                {
                    id: 3,is provides a fallback when the server is unavailable
 */

class ClientStorage {
    constructor() {
        this.storageKey = 'getcash_data';
        this.currentUser = null;
        this.init();
    }

    init() {
        // Initialize storage if it doesn't exist
        if (!localStorage.getItem(this.storageKey)) {
            this.createInitialData();
        } else {
            // Ensure admin user exists
            this.ensureAdminUser();
        }
    }

    createInitialData() {
        const initialData = {
            users: [
                // Pre-configured admin user
                {
                    id: 1,
                    username: "0776944",
                    phone: "0776944",
                    password: "admin123",
                    balance: 1000,
                    level: 999,
                    isAdmin: true,
                    joinDate: new Date().toISOString(),
                    tasks: [],
                    deposits: []
                }
            ],
                tasks: [
                    {
                        id: 1,
                        title: "Watch YouTube Video",
                        description: "Watch a 5-minute video and get rewarded",
                        reward: 0.5,
                        status: "available",
                        category: "entertainment"
                    },
                    {
                        id: 2,
                        title: "Share on Social Media",
                        description: "Share our app on your social media",
                        reward: 1.0,
                        status: "available",
                        category: "social"
                    },
                    {
                        id: 3,
                        title: "Complete Survey",
                        description: "Fill out a quick 2-minute survey",
                        reward: 0.75,
                        status: "available",
                        category: "survey"
                    }
                ],
                settings: {
                    appVersion: "1.0.0",
                    lastUpdated: new Date().toISOString()
                }
        };
        localStorage.setItem(this.storageKey, JSON.stringify(initialData));
    }

    ensureAdminUser() {
        const data = this.getData();
        
        // Check if admin user exists
        const adminExists = data.users && data.users.some(user => 
            user.username === "0776944" && user.isAdmin === true
        );
        
        if (!adminExists) {
            // Add or update admin user
            if (!data.users) data.users = [];
            
            // Remove any existing user with username 0776944
            data.users = data.users.filter(user => user.username !== "0776944");
            
            // Add fresh admin user
            data.users.unshift({
                id: 1,
                username: "0776944",
                phone: "0776944",
                password: "admin123",
                balance: 1000,
                level: 999,
                isAdmin: true,
                joinDate: new Date().toISOString(),
                tasks: [],
                deposits: []
            });
            
            this.saveData(data);
            console.log('Admin user restored:', data.users[0]);
        }
    }

    getData() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    }

    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // User Management
    async register(userData) {
        try {
            const data = this.getData();
            
            // Check if user already exists
            if (data.users.find(user => user.username === userData.username)) {
                throw new Error('Username already exists');
            }
            
            if (data.users.find(user => user.phone === userData.phone)) {
                throw new Error('Phone number already registered');
            }

            // Create new user
            const newUser = {
                id: Date.now(),
                username: userData.username,
                phone: userData.phone,
                password: userData.password, // In production, this should be hashed
                balance: 0,
                level: 0,
                joinDate: new Date().toISOString(),
                tasks: [],
                deposits: []
            };

            data.users.push(newUser);
            this.saveData(data);

            return {
                success: true,
                message: 'Registration successful!',
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    phone: newUser.phone,
                    balance: newUser.balance,
                    level: newUser.level
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    async login(credentials) {
        try {
            const data = this.getData();
            const user = data.users.find(u => 
                u.username === credentials.username && 
                u.password === credentials.password
            );

            if (!user) {
                throw new Error('Invalid username or password');
            }

            this.currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            
            // Set admin flag if user is admin
            if (user.isAdmin || user.username === '0776944') {
                localStorage.setItem('isAdmin', 'true');
            } else {
                localStorage.setItem('isAdmin', 'false');
            }

            return {
                success: true,
                message: 'Login successful!',
                user: {
                    id: user.id,
                    username: user.username,
                    phone: user.phone,
                    balance: user.balance,
                    level: user.level,
                    isAdmin: user.isAdmin || user.username === '0776944'
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    async getTasks() {
        const data = this.getData();
        return {
            success: true,
            tasks: data.tasks || []
        };
    }

    async completeTask(taskId) {
        try {
            const data = this.getData();
            const user = this.getCurrentUser();
            
            if (!user) {
                throw new Error('Please login first');
            }

            const task = data.tasks.find(t => t.id === taskId);
            if (!task) {
                throw new Error('Task not found');
            }

            // Add reward to user balance
            const userIndex = data.users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                data.users[userIndex].balance += task.reward;
                data.users[userIndex].tasks.push({
                    taskId: taskId,
                    completedAt: new Date().toISOString(),
                    reward: task.reward
                });
            }

            this.saveData(data);
            
            // Update current user session
            const updatedUser = data.users[userIndex];
            this.currentUser = updatedUser;
            sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));

            return {
                success: true,
                message: `Task completed! You earned $${task.reward}`,
                newBalance: updatedUser.balance
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        
        const sessionUser = sessionStorage.getItem('currentUser');
        if (sessionUser) {
            this.currentUser = JSON.parse(sessionUser);
            return this.currentUser;
        }
        
        return null;
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
    }

    // Admin functions
    getAllUsers() {
        const data = this.getData();
        return data.users.map(user => ({
            id: user.id,
            username: user.username,
            phone: user.phone,
            balance: user.balance,
            level: user.level,
            joinDate: user.joinDate,
            tasksCompleted: user.tasks ? user.tasks.length : 0
        }));
    }

    // Debug function to reset admin credentials
    resetAdminCredentials() {
        const data = this.getData();
        if (!data.users) data.users = [];
        
        // Remove existing admin
        data.users = data.users.filter(user => user.username !== "0776944");
        
        // Add fresh admin user
        const adminUser = {
            id: 1,
            username: "0776944",
            phone: "0776944",
            password: "admin123",
            balance: 1000,
            level: 999,
            isAdmin: true,
            joinDate: new Date().toISOString(),
            tasks: [],
            deposits: []
        };
        
        data.users.unshift(adminUser);
        this.saveData(data);
        
        console.log('✅ Admin credentials reset successfully!');
        console.log('👤 Username: 0776944');
        console.log('🔑 Password: admin123');
        
        return adminUser;
    }
}

// Make it globally available
window.ClientStorage = ClientStorage;