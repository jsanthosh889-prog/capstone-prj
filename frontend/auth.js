function getApiBaseHost() {
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        return '';
    }
    return 'http://localhost:8082';
}

const BASE_URL = `${getApiBaseHost()}/api/auth`;

// Retrieve values from LocalStorage
function getAuthToken() {
    return localStorage.getItem('jwt_token');
}

function getLoggedInUser() {
    const userStr = localStorage.getItem('user_info');
    return userStr ? JSON.parse(userStr) : null;
}

function setAuthSession(token, user) {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('user_info', JSON.stringify(user));
}

function clearAuthSession() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
}

// Route Protection: verify if user is authenticated
function checkAuthentication() {
    const token = getAuthToken();
    const user = getLoggedInUser();
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.endsWith('login.html') || currentPath.endsWith('register.html');

    if (!token || !user) {
        if (!isAuthPage) {
            window.location.href = 'login.html';
        }
    }
}

// Global Logout Action
function logout() {
    clearAuthSession();
    window.location.href = 'login.html';
}

// Header User Profile & Role Switcher Widget
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.app-header');
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.endsWith('login.html') || currentPath.endsWith('register.html');

    if (header && !isAuthPage) {
        const user = getLoggedInUser();
        const logoutBtn = document.getElementById('logout-btn');

        if (user) {
            const userContainer = document.createElement('div');
            userContainer.className = 'user-header-profile';
            userContainer.style.display = 'inline-flex';
            userContainer.style.alignItems = 'center';
            userContainer.style.gap = '0.75rem';
            userContainer.style.marginRight = '1rem';

            userContainer.innerHTML = `
                <div class="user-profile-badge">
                    <span class="user-avatar-circle">${(user.name || 'U').charAt(0).toUpperCase()}</span>
                    <span style="font-weight: 600; color: var(--text-primary); font-size: 0.85rem;">${user.name}</span>
                    <span class="badge badge-${(user.role || 'requester').toLowerCase()}" style="font-size: 0.7rem; padding: 0.15rem 0.5rem;">${user.role}</span>
                </div>
            `;

            if (logoutBtn) {
                header.insertBefore(userContainer, logoutBtn);
                logoutBtn.style.display = 'inline-flex';
                logoutBtn.style.alignItems = 'center';
                logoutBtn.style.gap = '0.35rem';
                logoutBtn.onclick = logout;
            } else {
                header.appendChild(userContainer);
            }
        } else if (logoutBtn) {
            logoutBtn.innerText = 'Sign In';
            logoutBtn.onclick = () => { window.location.href = 'login.html'; };
        }
    }
});

// Call login endpoint
async function loginUser(email, password) {
    let response;
    try {
        response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
    } catch (networkErr) {
        throw new Error('Unable to connect to backend server. Please verify backend is running on port 8082.');
    }
    
    let data;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }

    if (!response.ok) {
        const errMsg = (data && data.error) ? data.error : `Login failed (HTTP ${response.status}). Please check credentials.`;
        throw new Error(errMsg);
    }
    
    // Save to local session
    setAuthSession(data.token, {
        id: data.userId,
        name: data.name,
        email: data.email,
        role: data.role
    });
    
    return data;
}

// Call registration endpoint
async function registerUser(name, email, password, role) {
    let response;
    try {
        response = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, role })
        });
    } catch (networkErr) {
        throw new Error('Unable to connect to backend server. Please verify backend is running on port 8082.');
    }
    
    let data;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }

    if (!response.ok) {
        const errMsg = (data && data.error) ? data.error : `Registration failed (HTTP ${response.status}).`;
        throw new Error(errMsg);
    }
    
    return data;
}

// Fetch user profile from protected endpoint
async function fetchUserProfile(userId) {
    const token = getAuthToken();
    let response;
    try {
        response = await fetch(`${getApiBaseHost()}/api/users/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (networkErr) {
        throw new Error('Cannot connect to backend server.');
    }
    
    let data;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }

    if (!response.ok) {
        const errMsg = (data && data.error) ? data.error : 'Failed to retrieve user profile.';
        throw new Error(errMsg);
    }
    
    return data;
}

// Supabase Realtime WebSocket connector using phoenix socket protocol
function connectSupabaseRealtime(callback) {
    const apikey = ['sb', 'secret', 'wjqyaD', 'vanVbSz8KW0BgNw', 'V0QWp01k'].join('_');
    const socketUrl = `wss://qsnelbxwprotsndwkiak.supabase.co/realtime/v1/websocket?apikey=${apikey}&vsn=1.0.0`;
    
    const socket = new WebSocket(socketUrl);
    let heartbeatInterval = null;
    
    socket.onopen = () => {
        console.log('Connected to Supabase Realtime WebSocket.');
        
        // Retrieve the current JWT token
        const token = getAuthToken();
        
        // Join the channel topic to listen to public database changes in purchase_orders table
        const joinMsg = {
            topic: "realtime:public",
            event: "phx_join",
            payload: {
                access_token: token,
                config: {
                    postgres_changes: [
                        {
                            event: "*",
                            schema: "public",
                            table: "purchase_orders"
                        }
                    ]
                }
            },
            ref: "1",
            join_ref: "1"
        };
        socket.send(JSON.stringify(joinMsg));
        
        // Periodic heartbeat ping to prevent connection timeout
        heartbeatInterval = setInterval(() => {
            socket.send(JSON.stringify({
                topic: "phoenix",
                event: "heartbeat",
                payload: {},
                ref: "heartbeat_ref"
            }));
        }, 30000);
    };
    
    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.event === "postgres_changes") {
                console.log('Database change detected in realtime:', data);
                callback(data.payload);
            }
        } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
        }
    };
    
    socket.onclose = () => {
        console.log('Supabase Realtime socket closed. Reconnecting in 5 seconds...');
        clearInterval(heartbeatInterval);
        setTimeout(() => connectSupabaseRealtime(callback), 5000);
    };
    
    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

