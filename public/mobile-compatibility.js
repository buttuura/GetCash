/**
 * Mobile Compatibility Enhancements for GetCash App
 * Ensures the app works perfectly on all devices
 */

// Device detection and compatibility checks
(function() {
    'use strict';
    
    // Enhanced mobile device detection
    const isMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768) ||
               ('ontouchstart' in window);
    };
    
    const isIOS = () => {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    };
    
    const isAndroid = () => {
        return /Android/.test(navigator.userAgent);
    };
    
    // Initialize mobile enhancements
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🔧 Initializing mobile compatibility...');
        
        // Add device classes to body
        if (isMobile()) {
            document.body.classList.add('mobile-device');
            console.log('📱 Mobile device detected');
        }
        
        if (isIOS()) {
            document.body.classList.add('ios-device');
            console.log('🍎 iOS device detected');
        }
        
        if (isAndroid()) {
            document.body.classList.add('android-device');
            console.log('🤖 Android device detected');
        }
        
        // Enhanced touch support for all clickable elements
        const clickableElements = document.querySelectorAll(
            'button, .icon-img-cotainer, .footer-icon, [onclick], .register-btn, .login-btn, a'
        );
        
        clickableElements.forEach(element => {
            // Prevent double-tap zoom on iOS
            element.addEventListener('touchend', function(e) {
                e.preventDefault();
                this.click();
            }, { passive: false });
            
            // Add visual feedback for touch
            element.addEventListener('touchstart', function() {
                this.style.opacity = '0.7';
            });
            
            element.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.style.opacity = '1';
                }, 150);
            });
        });
        
        // Fix viewport issues on mobile
        if (isMobile()) {
            // Prevent zoom on input focus (mobile Safari fix)
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('focus', function() {
                    // Temporarily disable zoom
                    const viewport = document.querySelector('meta[name="viewport"]');
                    if (viewport) {
                        const originalContent = viewport.getAttribute('content');
                        viewport.setAttribute('content', originalContent + ', user-scalable=no');
                        
                        // Re-enable zoom after input loses focus
                        this.addEventListener('blur', function() {
                            setTimeout(() => {
                                viewport.setAttribute('content', originalContent);
                            }, 100);
                        }, { once: true });
                    }
                });
            });
        }
        
        // Fix notification positioning on mobile
        const originalShowNotification = window.showNotification;
        if (originalShowNotification) {
            window.showNotification = function(message, type, duration) {
                const result = originalShowNotification(message, type, duration);
                
                // Adjust notification position for mobile
                if (isMobile()) {
                    const notifications = document.querySelectorAll('.notification');
                    notifications.forEach(notification => {
                        notification.style.top = '20px';
                        notification.style.left = '10px';
                        notification.style.right = '10px';
                        notification.style.width = 'auto';
                        notification.style.maxWidth = 'none';
                    });
                }
                
                return result;
            };
        }
        
        // Enhanced redirect function for all devices
        window.universalRedirect = function(url, fallbackMessage) {
            console.log('🔄 Universal redirect to:', url);
            
            try {
                // Method 1: Standard redirect
                window.location.href = url;
                
                // Method 2: iOS Safari fallback
                if (isIOS()) {
                    setTimeout(() => {
                        if (window.location.href !== url) {
                            window.location.replace(url);
                        }
                    }, 100);
                }
                
                // Method 3: Android WebView fallback
                if (isAndroid()) {
                    setTimeout(() => {
                        if (window.location.href !== url) {
                            document.location = url;
                        }
                    }, 100);
                }
                
                // Method 4: Universal fallback
                setTimeout(() => {
                    if (window.location.pathname === window.location.pathname) {
                        try {
                            window.open(url, '_self');
                        } catch (e) {
                            // Last resort: show manual link
                            if (fallbackMessage) {
                                document.body.innerHTML = `
                                    <div style="text-align:center;padding:50px;font-family:Arial;background:#667eea;color:white;min-height:100vh;">
                                        <h2>🚀 ${fallbackMessage}</h2>
                                        <p style="margin:20px 0;">If not automatically redirected:</p>
                                        <a href="${url}" style="color:white;font-size:20px;text-decoration:underline;">👆 Tap here to continue</a>
                                    </div>
                                `;
                            }
                        }
                    }
                }, 500);
                
            } catch (error) {
                console.error('Redirect error:', error);
                if (fallbackMessage) {
                    alert(fallbackMessage + '\n\nPlease manually navigate to: ' + url);
                }
            }
        };
        
        console.log('✅ Mobile compatibility initialized');
    });
    
    // Prevent zoom on double-tap (iOS Safari)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
})();