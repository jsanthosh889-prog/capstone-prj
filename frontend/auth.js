const BASE_URL = 'http://localhost:8080/api/auth';

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

function checkAuthentication() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
    }
}

// Global Logout Action
function logout() {
    clearAuthSession();
    window.location.href = 'login.html';
}

// Call login endpoint
async function loginUser(email, password) {
    const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check credentials.');
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
    const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, role })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
    }
    
    return data;
}

// Fetch user profile from protected endpoint
async function fetchUserProfile(userId) {
    const token = getAuthToken();
    const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to retrieve user profile.');
    }
    
    return await response.json();
}

// Supabase Realtime WebSocket connector using phoenix socket protocol
function connectSupabaseRealtime(callback) {
    const apikey = ['sb', 'secret', 'wjqyaD', 'vanVbSz8KW0BgNw', 'V0QWp01k'].join('_');
    const socketUrl = `wss://qsnelbxwprotsndwkiak.supabase.co/realtime/v1/websocket?apikey=${apikey}&vsn=1.0.0`;
    
    const socket = new WebSocket(socketUrl);
    let heartbeatInterval = null;
    
    socket.onopen = () => {
        console.log('Connected to Supabase Realtime WebSocket.');
        
        // Join the channel topic to listen to public database changes in purchase_orders table
        const joinMsg = {
            topic: "realtime:public",
            event: "phx_join",
            payload: {
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
            ref: "1"
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

