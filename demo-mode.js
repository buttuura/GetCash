/**
 * GetCash App - Temporary Client-Side Demo
 * This allows the app to work while the server is being configured
 */

// Show a notification that we're in demo mode
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (typeof showNotification === 'function') {
            showNotification('🎯 Demo Mode: App is working locally while server connects!', 'success');
            
            setTimeout(() => {
                showNotification('💡 Registration & Login will work - data saved locally for now', 'info');
            }, 3000);
        }
    }, 1000);
});

// Override the API client to use client storage
if (typeof apiClient !== 'undefined') {
    console.log('🔄 Overriding API client to use local storage');
    
    // Store original methods
    const originalRegister = apiClient.register.bind(apiClient);
    const originalLogin = apiClient.login.bind(apiClient);
    
    // Create client storage instance
    if (typeof ClientStorage !== 'undefined') {
        const clientStorage = new ClientStorage();
        
        // Override register method
        apiClient.register = async function(username, password, phone) {
            try {
                // Try server first (but it will likely fail)
                return await originalRegister(username, password, phone);
            } catch (error) {
                console.log('🏠 Using local storage for registration');
                const result = await clientStorage.register({ username, password, phone });
                
                if (result.success) {
                    return {
                        message: result.message + ' (Saved locally)',
                        userId: result.user.id,
                        user: result.user
                    };
                } else {
                    throw new Error(result.message);
                }
            }
        };
        
        // Override login method
        apiClient.login = async function(username, password) {
            try {
                // Try server first (but it will likely fail)
                return await originalLogin(username, password);
            } catch (error) {
                console.log('🏠 Using local storage for login');
                const result = await clientStorage.login({ username, password });
                
                if (result.success) {
                    // Store user data for the app
                    localStorage.setItem('userId', result.user.id);
                    localStorage.setItem('username', result.user.username);
                    localStorage.setItem('userBalance', result.user.balance);
                    
                    // Store admin status
                    if (result.user.isAdmin) {
                        localStorage.setItem('isAdmin', 'true');
                    }
                    
                    return {
                        message: result.message + ' (Local storage)',
                        userId: result.user.id,
                        token: 'demo-token-' + result.user.id,
                        user: result.user
                    };
                } else {
                    throw new Error(result.message);
                }
            }
        };
    }
}