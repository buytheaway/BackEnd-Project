// Check if a user is logged in
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const profileUsername = document.getElementById('profileUsername');
const profileDetails = document.getElementById('profileDetails');
const profilePostsCount = document.getElementById('profilePostsCount');
const logoutBtn = document.getElementById('logoutBtn');

// Redirect if no user is logged in
if (!currentUser) {
  alert('Please log in to view your profile.');
  window.location.href = 'index.html';
} else {
  // Display user details
  profileUsername.textContent = currentUser.username;
  profileDetails.textContent = `Email: ${currentUser.email || 'Not Provided'}`;
  profilePostsCount.textContent = `Posts Created: ${currentUser.postsCount || 0}`;
}

// Handle logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('currentUser');
  alert('You have been logged out.');
  window.location.href = 'index.html';
});
