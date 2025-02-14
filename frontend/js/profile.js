document.addEventListener('DOMContentLoaded', () => {
    // Load user profile data
    fetch('/profile-data', {
        method: 'GET',
        credentials: 'include' // Разрешает куки при запросе
    })
    
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showNotification(data.error, 'error');
                window.location.href = '/login';
            } else {
                document.getElementById('username').innerText = data.username;
                document.getElementById('email').innerText = data.email;
            }
        })
        .catch(err => console.error('Error loading profile data:', err));
    

    // Form for creating a post
    const createPostForm = document.getElementById('createPostForm');
    if (createPostForm) {
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
                    showNotification('Post created successfully!', 'success');
                    setTimeout(() => location.reload(), 1000); // Обновление страницы после 1 сек
                } else {
                    showNotification('Error creating post.', 'error');
                }
            } catch (err) {
                console.error('Error:', err);
            }
        });
    }

    function logoutUser() {
        fetch('/logout')
            .then(() => {
                window.location.href = '/login';
            })
            .catch(err => console.error('Error logging out:', err));
    }
    
    const postsContainer = document.getElementById('postsContainer');
    if (postsContainer) {
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
    }

    // Form for sending emails
    const emailForm = document.getElementById('emailForm');
    if (emailForm) {
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
                showNotification(result.message, 'success');
            } catch (err) {
                console.error('Error sending email:', err);
            }
        });
    }
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
                showNotification('Post updated successfully!', 'success');
                setTimeout(() => location.reload(), 1000);
            } else {
                showNotification('Error updating post.', 'error');
            }
        } catch (err) {
            console.error('Error updating post:', err);
        }
    };
}

function deletePost(postId) {
    fetch(`/api/posts/${postId}`, { method: 'DELETE' })
        .then(response => {
            if (response.ok) {
                showNotification('Post deleted successfully!', 'success');
                setTimeout(() => location.reload(), 1000);
            } else {
                showNotification('Error deleting post.', 'error');
            }
        })
        .catch(err => console.error('Error deleting post:', err));
}

function closeEditForm() {
    document.getElementById('editForm').style.display = 'none';
}

// Уведомления (всплывающие)
function showNotification(message, type = 'info') {
    let notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerText = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000); // Уведомление исчезает через 3 секунды
}

// Добавляем стили для уведомлений
const style = document.createElement('style');
style.innerHTML = `
    .notification {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 5px;
        font-size: 14px;
        z-index: 1000;
        transition: opacity 0.3s ease-in-out;
    }
    .notification.error { background: red; }
    .notification.success { background: green; }
`;
document.head.appendChild(style);
