const BACKEND_URL = 'http://localhost:8080/api/health';

const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const retryBtn = document.getElementById('retry-btn');

async function checkBackendHealth() {
    // Set checking state
    statusIndicator.className = 'status-indicator checking';
    statusText.innerText = 'Checking...';
    
    try {
        const response = await fetch(BACKEND_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.status === 'UP') {
            statusIndicator.className = 'status-indicator online';
            statusText.innerText = 'Online';
            statusText.style.color = '#10b981';
        } else {
            statusIndicator.className = 'status-indicator offline';
            statusText.innerText = 'Degraded';
            statusText.style.color = '#f59e0b';
        }
    } catch (error) {
        console.error('Failed to connect to backend health-check:', error);
        statusIndicator.className = 'status-indicator offline';
        statusText.innerText = 'Offline';
        statusText.style.color = '#ef4444';
    }
}

// Attach event listeners
retryBtn.addEventListener('click', checkBackendHealth);

// Initial check on load
document.addEventListener('DOMContentLoaded', checkBackendHealth);
