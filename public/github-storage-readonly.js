// GitHub Storage Manager - Read-Only Mode (No Token Required)
// This version can read public data but cannot write without token

class ReadOnlyGitHubStorage {
    constructor() {
        this.owner = 'buttuura';
        this.repo = 'GetCash';
        this.branch = 'main';
        this.dataPath = 'data/tasks.json';
        this.mode = 'read-only';
    }

    // Read tasks from public GitHub repository (no token needed)
    async getTasks() {
        try {
            console.log('📖 Reading tasks from public GitHub repository...');
            
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.dataPath}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'GetCash-App'
                }
            });

            if (response.status === 404) {
                console.log('📝 No tasks file found in repository yet');
                return [];
            }

            if (!response.ok) {
                if (response.status === 403) {
                    console.warn('⚠️ API rate limit reached, using cached data');
                    return this.getCachedTasks();
                }
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            const content = JSON.parse(atob(data.content));
            const tasks = content.tasks || [];
            
            // Cache the data for offline use
            localStorage.setItem('github_tasks_cache', JSON.stringify({
                tasks: tasks,
                cachedAt: new Date().toISOString()
            }));
            
            console.log('✅ Successfully loaded', tasks.length, 'tasks from GitHub');
            return tasks;
            
        } catch (error) {
            console.error('❌ Failed to load from GitHub:', error);
            console.log('📱 Falling back to cached data...');
            return this.getCachedTasks();
        }
    }

    // Get cached tasks when GitHub is unavailable
    getCachedTasks() {
        try {
            const cached = localStorage.getItem('github_tasks_cache');
            if (cached) {
                const data = JSON.parse(cached);
                const cacheAge = Date.now() - new Date(data.cachedAt).getTime();
                const hours = cacheAge / (1000 * 60 * 60);
                
                console.log(`📦 Using cached data (${hours.toFixed(1)} hours old)`);
                return data.tasks || [];
            }
        } catch (error) {
            console.error('❌ Cache error:', error);
        }
        
        console.log('📝 No cached data available');
        return [];
    }

    // Check if write operations are available
    canWrite() {
        return false; // Read-only mode
    }

    // Get storage info
    getStorageInfo() {
        return {
            mode: 'read-only',
            canRead: true,
            canWrite: false,
            description: 'Can read public tasks but cannot upload without token'
        };
    }

    // Hybrid approach: combine GitHub reading with localStorage writing
    async addTaskLocally(task) {
        try {
            // Save to localStorage instead of GitHub
            let localTasks = JSON.parse(localStorage.getItem('adminTasks') || '[]');
            
            const newTask = {
                ...task,
                id: Date.now().toString(),
                uploadDate: new Date().toISOString(),
                source: 'local',
                synced: false
            };
            
            localTasks.push(newTask);
            
            // Manage storage space
            if (localTasks.length > 25) {
                localTasks = localTasks.slice(-20);
            }
            
            localStorage.setItem('adminTasks', JSON.stringify(localTasks));
            
            console.log('✅ Task saved locally (will sync when token is provided)');
            return newTask;
            
        } catch (error) {
            console.error('❌ Failed to save locally:', error);
            throw error;
        }
    }

    // Combine GitHub and local tasks
    async getAllTasks() {
        try {
            const [githubTasks, localTasks] = await Promise.all([
                this.getTasks(),
                Promise.resolve(JSON.parse(localStorage.getItem('adminTasks') || '[]'))
            ]);
            
            // Merge tasks, GitHub tasks first (they're "official")
            const allTasks = [
                ...githubTasks.map(task => ({ ...task, source: 'github', synced: true })),
                ...localTasks.filter(task => task.source === 'local')
            ];
            
            console.log(`📊 Total tasks: ${allTasks.length} (${githubTasks.length} from GitHub, ${localTasks.filter(t => t.source === 'local').length} local)`);
            
            return allTasks;
            
        } catch (error) {
            console.error('❌ Error combining tasks:', error);
            return JSON.parse(localStorage.getItem('adminTasks') || '[]');
        }
    }
}

// Global instance for read-only GitHub storage
window.readOnlyGitHub = new ReadOnlyGitHubStorage();

// Backward compatibility
window.githubStorageReadOnly = window.readOnlyGitHub;