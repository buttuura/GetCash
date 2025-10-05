// GitHub Storage Manager for GetCash App
// Handles task storage, image uploads, and data management via GitHub API

class GitHubStorageManager {
    constructor() {
        this.owner = 'buttuura';
        this.repo = 'GetCash';
        this.branch = 'main';
        this.dataPath = 'data/tasks.json';
        this.imagesPath = 'data/images/';
        
        // GitHub token - in production, this should be handled more securely
        this.token = null; // Will be set by admin
    }

    // Set GitHub token for API access
    setToken(token) {
        this.token = token;
        localStorage.setItem('github_token', token);
    }

    // Get stored token
    getToken() {
        if (!this.token) {
            this.token = localStorage.getItem('github_token');
        }
        return this.token;
    }

    // Upload image to GitHub repository
    async uploadImage(imageBase64, filename) {
        const token = this.getToken();
        if (!token) {
            throw new Error('GitHub token not set');
        }

        try {
            // Convert base64 to binary
            const base64Data = imageBase64.split(',')[1];
            
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.imagesPath}${filename}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Upload task image: ${filename}`,
                    content: base64Data,
                    branch: this.branch
                })
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const result = await response.json();
            return result.content.download_url;
        } catch (error) {
            console.error('Image upload failed:', error);
            throw error;
        }
    }

    // Get current tasks data from GitHub
    async getTasks() {
        try {
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.dataPath}`, {
                headers: this.token ? {
                    'Authorization': `token ${this.token}`
                } : {}
            });

            if (response.status === 404) {
                // File doesn't exist yet, return empty array
                return [];
            }

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            const content = JSON.parse(atob(data.content));
            return content.tasks || [];
        } catch (error) {
            console.error('Failed to get tasks:', error);
            return [];
        }
    }

    // Save tasks data to GitHub
    async saveTasks(tasks) {
        const token = this.getToken();
        if (!token) {
            throw new Error('GitHub token not set');
        }

        try {
            // Get current file SHA (required for updates)
            let sha = null;
            try {
                const currentFile = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.dataPath}`, {
                    headers: {
                        'Authorization': `token ${token}`
                    }
                });
                if (currentFile.ok) {
                    const currentData = await currentFile.json();
                    sha = currentData.sha;
                }
            } catch (e) {
                // File might not exist yet
            }

            const content = btoa(JSON.stringify({
                tasks: tasks,
                lastUpdated: new Date().toISOString()
            }, null, 2));

            const body = {
                message: `Update tasks data - ${tasks.length} tasks`,
                content: content,
                branch: this.branch
            };

            if (sha) {
                body.sha = sha;
            }

            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.dataPath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to save tasks:', error);
            throw error;
        }
    }

    // Add a new task with image upload
    async addTask(task, imageFile = null) {
        try {
            let imageUrl = null;
            
            // Upload image if provided
            if (imageFile) {
                const filename = `task_${task.id}_${Date.now()}.jpg`;
                imageUrl = await this.uploadImage(imageFile, filename);
                console.log('✅ Image uploaded:', imageUrl);
            }

            // Get current tasks
            const tasks = await this.getTasks();
            
            // Add new task with image URL
            const newTask = {
                ...task,
                img: imageUrl,
                uploadDate: new Date().toISOString(),
                status: 'active'
            };

            tasks.push(newTask);

            // Save updated tasks
            await this.saveTasks(tasks);
            
            console.log('✅ Task added successfully with GitHub storage');
            return newTask;
        } catch (error) {
            console.error('Failed to add task:', error);
            throw error;
        }
    }

    // Delete a task by ID
    async deleteTask(taskId) {
        try {
            const tasks = await this.getTasks();
            const filteredTasks = tasks.filter(task => task.id !== taskId);
            
            if (filteredTasks.length === tasks.length) {
                throw new Error('Task not found');
            }

            await this.saveTasks(filteredTasks);
            console.log('✅ Task deleted successfully');
            return true;
        } catch (error) {
            console.error('Failed to delete task:', error);
            throw error;
        }
    }

    // Delete all tasks
    async deleteAllTasks() {
        try {
            await this.saveTasks([]);
            console.log('✅ All tasks deleted successfully');
            return true;
        } catch (error) {
            console.error('Failed to delete all tasks:', error);
            throw error;
        }
    }

    // Get tasks by date range
    async getTasksByDateRange(startDate, endDate) {
        try {
            const tasks = await this.getTasks();
            return tasks.filter(task => {
                const taskDate = new Date(task.uploadDate);
                return taskDate >= new Date(startDate) && taskDate <= new Date(endDate);
            });
        } catch (error) {
            console.error('Failed to get tasks by date:', error);
            return [];
        }
    }
}

// Global instance
window.githubStorage = new GitHubStorageManager();