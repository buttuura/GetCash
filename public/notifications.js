// Shared Notification System for All Pages
// Include this script on any page that needs notifications

// Notification system
function showNotification(message, type = 'info', duration = 4000) {
  // Create notification container if it doesn't exist
  let container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.style.cssText = `
    position: relative;
    margin-bottom: 10px;
    padding: 16px 24px;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    min-width: 300px;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateX(400px);
    transition: transform 0.3s ease-in-out;
    pointer-events: auto;
    word-wrap: break-word;
  `;
  
  // Set background color based on type
  const colors = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };
  notification.style.backgroundColor = colors[type] || colors.info;
  
  // Special styling for warning
  if (type === 'warning') {
    notification.style.color = '#212529';
  }
  
  notification.innerHTML = `
    <span style="float: right; margin-left: 12px; cursor: pointer; font-size: 18px; line-height: 1;" onclick="this.parentElement.remove()">&times;</span>
    ${message}
  `;
  
  container.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Auto remove
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 300);
  }, duration);
}

// Custom confirmation dialog
function showConfirmDialog(title, message) {
  return new Promise((resolve) => {
    // Create dialog if it doesn't exist
    let dialog = document.getElementById('confirmDialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'confirmDialog';
      dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20000;
      `;
      
      dialog.innerHTML = `
        <div style="
          background: white;
          padding: 24px;
          border-radius: 12px;
          max-width: 400px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          margin: 20px;
        ">
          <h3 id="confirmTitle" style="margin-top: 0; color: #333;">Confirm Action</h3>
          <p id="confirmMessage" style="color: #666; margin: 16px 0;">Are you sure?</p>
          <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
            <button id="confirmYes" style="
              padding: 10px 20px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
              background: #dc3545;
              color: white;
            ">Yes</button>
            <button id="confirmNo" style="
              padding: 10px 20px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
              background: #6c757d;
              color: white;
            ">Cancel</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(dialog);
    }
    
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    dialog.style.display = 'flex';
    
    const cleanup = () => {
      dialog.style.display = 'none';
      yesBtn.onclick = null;
      noBtn.onclick = null;
    };
    
    yesBtn.onclick = () => {
      cleanup();
      resolve(true);
    };
    
    noBtn.onclick = () => {
      cleanup();
      resolve(false);
    };
    
    // Close on background click
    dialog.onclick = (e) => {
      if (e.target === dialog) {
        cleanup();
        resolve(false);
      }
    };
  });
}

// Replace default alert function (optional)
function replaceAlert() {
  window.originalAlert = window.alert;
  window.alert = function(message) {
    showNotification(message, 'info');
  };
}

// Replace default confirm function (optional)
function replaceConfirm() {
  window.originalConfirm = window.confirm;
  window.confirm = function(message) {
    return showConfirmDialog('Confirm', message);
  };
}