// Temporary storage for users and posts
const users = [];
const posts = [];

// DOM references
const authContainer = document.getElementById('authContainer');
const authTitle = document.getElementById('authTitle');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authSubmit = document.getElementById('authSubmit');
const closeModal = document.getElementById('closeModal');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const postContent = document.getElementById('postContent');
const createPostBtn = document.getElementById('createPost');
const postsContainer = document.getElementById('postsContainer');
const profileName = document.getElementById('profileName');
const logoutBtn = document.getElementById('logoutBtn');

let currentUser = null;

// Show modal for login or registration
function showAuthModal(mode) {
  authTitle.textContent = mode === 'login' ? 'Login' : 'Register';
  authContainer.style.display = 'block';
}

// Handle authentication
authSubmit.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (authTitle.textContent === 'Register') {
    if (users.some(user => user.username === username)) {
      alert('Username already exists!');
    } else {
      users.push({ username, password });
      alert('Registration successful! Please log in.');
      authContainer.style.display = 'none';
    }
  } else {
    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
      currentUser = user;
      profileName.textContent = username;
      alert(`Welcome, ${username}!`);
      authContainer.style.display = 'none';
    } else {
      alert('Invalid credentials!');
    }
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  currentUser = null;
  profileName.textContent = 'Guest';
  alert('You have been logged out.');
});

// Close modal
closeModal.addEventListener('click', () => {
  authContainer.style.display = 'none';
});

// Show login or register modal
loginBtn.addEventListener('click', () => showAuthModal('login'));
registerBtn.addEventListener('click', () => showAuthModal('register'));

// Create a new post
createPostBtn.addEventListener('click', () => {
  if (!currentUser) {
    alert('Please log in to create a post!');
    return;
  }

  const content = postContent.value.trim();
  if (content) {
    const newPost = { content, username: currentUser.username, likes: 0, comments: [] };
    posts.push(newPost);
    displayPosts();
    postContent.value = '';
  } else {
    alert('Post content cannot be empty!');
  }
});

// Display all posts
function displayPosts() {
  postsContainer.innerHTML = '';
  posts.forEach((post, index) => {
    const postElement = document.createElement('div');
    postElement.classList.add('post');
    postElement.innerHTML = `
      <h3>${post.username}</h3>
      <p>${post.content}</p>
      <div class="actions">
        <button class="like-btn" onclick="likePost(${index})">Like (${post.likes})</button>
        <button class="comment-btn" onclick="commentPost(${index})">Comment</button>
      </div>
      <div class="comments">
        ${post.comments.map(comment => `<p>${comment}</p>`).join('')}
      </div>
    `;
    postsContainer.appendChild(postElement);
  });
}
authSubmit.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (authTitle.textContent === 'Register') {
    if (users.some(user => user.username === username)) {
      alert('Username already exists!');
    } else {
      const newUser = { username, password, email: '', postsCount: 0 };
      users.push(newUser);
      alert('Registration successful! Please log in.');
      authContainer.style.display = 'none';
    }
  } else {
    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
      currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      profileName.textContent = username;
      alert(`Welcome, ${username}!`);
      authContainer.style.display = 'none';
    } else {
      alert('Invalid credentials!');
    }
  }
});

// Like a post
function likePost(index) {
  posts[index].likes++;
  displayPosts();
}

// Comment on a post
function commentPost(index) {
  const comment = prompt('Enter your comment:');
  if (comment) {
    posts[index].comments.push(comment);
    displayPosts();
  }
}
