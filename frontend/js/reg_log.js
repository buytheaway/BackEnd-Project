// Function to show message
const showMessage = (message, type) => {
    const messageBox = document.getElementById('message');
    messageBox.textContent = message;
    messageBox.className = `message ${type}`; // Add "success" or "error" class
    messageBox.style.display = 'block';

    // Hide the message after 3 seconds
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);
};

// Register User
const registerUser = async () => {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${BASE_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();
        if (data.success) {
            showMessage('Registration successful! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            showMessage(data.message || 'Registration failed.', 'error');
        }
    } catch (err) {
        console.error('Error during registration:', err);
        showMessage('An error occurred. Please try again.', 'error');
    }
};

// Login User
const loginUser = async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (data.success) {
            showMessage('Login successful! Redirecting...', 'success');
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('email', data.email);
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 3000);
        } else {
            showMessage(data.message || 'Login failed.', 'error');
        }
    } catch (err) {
        console.error('Error during login:', err);
        showMessage('An error occurred. Please try again.', 'error');
    }
};