document.addEventListener('DOMContentLoaded', () => {
    // Load user profile data
    fetch('/profile-data')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                window.location.href = '/login';
            } else {
                document.getElementById('username').innerText = data.username;
                document.getElementById('email').innerText = data.email;
            }
        })
        .catch(err => console.error('Error loading profile data:', err));

    // Form for creating a post
    const createPostForm = document.getElementById('createPostForm');
    createPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('postTitle').value;
        const content = document.getElementById('postContent').value;
        const tags = document.getElementById('postTags').value;

        try {
            const response = await fetch('/create-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, tags })
            });

            if (response.ok) {
                alert('Post created successfully!');
                location.reload();
            } else {
                alert('Error creating post.');
            }
        } catch (err) {
            console.error('Error:', err);
        }
    });

    const postsContainer = document.getElementById('postsContainer');
    fetch('/user-posts')
        .then(response => response.json())
        .then(posts => {
            posts.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.classList.add('post');
                postDiv.innerHTML = `
                    <h3>${post.title}</h3>
                    <p>${post.content}</p>
                    <p><strong>Tags:</strong> ${post.tags.join(', ')}</p>
                    <button onclick="editPost('${post._id}', '${post.title}', '${post.content}', '${post.tags.join(', ')}')">Edit</button>
                    <button onclick="deletePost('${post._id}')">Delete</button>
                `;
                postsContainer.appendChild(postDiv);
            });
        })
        .catch(err => console.error('Error loading posts:', err));

    // Form for sending emails
    const emailForm = document.getElementById('emailForm');
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const recipientEmail = document.getElementById('recipientEmail').value;
        const message = document.getElementById('message').value;

        try {
            const response = await fetch('/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientEmail, message })
            });

            const result = await response.json();
            alert(result.message);
        } catch (err) {
            console.error('Error sending email:', err);
        }
    });
});

// Functions to handle edit and delete posts
function editPost(postId, title, content, tags) {
    document.getElementById('editForm').style.display = 'block';
    document.getElementById('editTitle').value = title;
    document.getElementById('editContent').value = content;
    document.getElementById('editTags').value = tags;

    const saveEditBtn = document.getElementById('saveEditBtn');
    saveEditBtn.onclick = async () => {
        try {
            const updatedTitle = document.getElementById('editTitle').value;
            const updatedContent = document.getElementById('editContent').value;
            const updatedTags = document.getElementById('editTags').value;

            const response = await fetch(`/api/posts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: updatedTitle,
                    content: updatedContent,
                    tags: updatedTags
                })
            });

            if (response.ok) {
                alert('Post updated successfully!');
                location.reload();
            } else {
                alert('Error updating post.');
            }
        } catch (err) {
            console.error('Error updating post:', err);
        }
    };
}

function deletePost(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        fetch(`/api/posts/${postId}`, { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    alert('Post deleted successfully!');
                    location.reload();
                } else {
                    alert('Error deleting post.');
                }
            })
            .catch(err => console.error('Error deleting post:', err));
    }
}

function closeEditForm() {
    document.getElementById('editForm').style.display = 'none';
}