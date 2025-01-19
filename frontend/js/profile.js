document.addEventListener('DOMContentLoaded', () => {
    fetch('/profile-data')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                window.location.href = '/login';
            } else {
                document.getElementById('username').innerText = data.username;
                document.getElementById('email').innerText = data.email;
                loadPosts();
            }
        })
        .catch(err => console.error('Error loading profile data:', err));
});

// Функция для загрузки постов пользователя
function loadPosts() {
    fetch('/user-posts')
        .then(response => response.json())
        .then(posts => {
            const postsContainer = document.getElementById('postsContainer');
            postsContainer.innerHTML = '';
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

// Создание нового поста
document.getElementById('createPostForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const tags = document.getElementById('postTags').value;

    fetch('/create-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, tags })
    })
        .then(response => {
            if (response.ok) {
                alert('Post created successfully!');
                loadPosts();
                document.getElementById('createPostForm').reset();
            } else {
                alert('Error creating post.');
            }
        })
        .catch(err => console.error('Error creating post:', err));
});

// Удаление поста
function deletePost(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        fetch(`/api/posts/${postId}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    loadPosts();
                } else {
                    alert('Error deleting post: ' + data.error);
                }
            })
            .catch(err => console.error('Error deleting post:', err));
    }
}

// Открытие формы редактирования
function editPost(postId, title, content, tags) {
    document.getElementById('editForm').style.display = 'block';
    document.getElementById('editForm').setAttribute('data-post-id', postId);
    document.getElementById('editTitle').value = title;
    document.getElementById('editContent').value = content;
    document.getElementById('editTags').value = tags;
}

// Закрытие формы редактирования
function closeEditForm() {
    document.getElementById('editForm').style.display = 'none';
    document.getElementById('editForm').removeAttribute('data-post-id');
}

// Сохранение изменений поста
function saveEdit() {
    const postId = document.getElementById('editForm').getAttribute('data-post-id');
    const title = document.getElementById('editTitle').value;
    const content = document.getElementById('editContent').value;
    const tags = document.getElementById('editTags').value;

    fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, tags })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Post updated successfully!');
                closeEditForm();
                loadPosts();
            } else {
                alert('Error updating post: ' + data.error);
            }
        })
        .catch(err => console.error('Error updating post:', err));
}

// Выход из аккаунта
function logoutUser() {
    fetch('/logout')
        .then(() => {
            window.location.href = '/login';
        })
        .catch(err => console.error('Error logging out:', err));
}