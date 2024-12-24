// Get references to DOM elements
const postContent = document.getElementById('postContent');
const createPostBtn = document.getElementById('createPost');
const postsContainer = document.getElementById('postsContainer');

// Function to create a new post
function createPost(content) {
  // Create post element
  const postElement = document.createElement('div');
  postElement.classList.add('post');
  
  // Add content to the post
  postElement.innerHTML = `
    <h3>New Post</h3>
    <p>${content}</p>
    <div class="actions">
      <button class="like-btn">Like</button>
      <button class="comment-btn">Comment</button>
    </div>
  `;
  
  // Add event listeners for buttons
  const likeBtn = postElement.querySelector('.like-btn');
  const commentBtn = postElement.querySelector('.comment-btn');
  
  likeBtn.addEventListener('click', () => {
    alert('You liked this post!');
  });
  
  commentBtn.addEventListener('click', () => {
    const comment = prompt('Enter your comment:');
    if (comment) {
      const commentElement = document.createElement('p');
      commentElement.textContent = `Comment: ${comment}`;
      postElement.appendChild(commentElement);
    }
  });
  
  // Add the new post to the top of the posts container
  postsContainer.prepend(postElement);
}

// Add event listener to the "Create Post" button
createPostBtn.addEventListener('click', () => {
  const content = postContent.value.trim();
  if (content) {
    createPost(content); // Create a new post
    postContent.value = ''; // Clear the textarea
  } else {
    alert('Please enter some content before posting!');
  }
});
