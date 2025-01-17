// Register User
const registerUser = async () => {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            showMessage('Registration successful!', 'success');
        } else {
            showMessage(data.message, 'error');
        }
    } catch (err) {
        showMessage('An error occurred. Please try again.', 'error');
    }
};

// Validate login and register forms
const validateForm = (formId) => {
    const form = document.getElementById(formId);
    form.addEventListener('submit', (e) => {
        const password = form.querySelector('#password');
        if (password && password.value.length < 6) {
            e.preventDefault();
            showMessage('Password must be at least 6 characters', 'error');
        }
    });
};

// Call validateForm on page load for relevant forms
if (document.getElementById('regForm')) validateForm('regForm');
if (document.getElementById('loginForm')) validateForm('loginForm');