document.addEventListener('DOMContentLoaded', () => {
    loadPosts('/api/popular-posts', 'popularPostsContainer');
    loadPosts('/api/latest-posts', 'latestPostsContainer');
    loadPosts('/api/recommended-posts', 'recommendedPostsContainer'); // Загружаем рандомные посты
});

function loadPosts(apiUrl, containerId) {
    fetch(apiUrl)
        .then(response => response.json())
        .then(posts => {
            const container = document.getElementById(containerId);
            container.innerHTML = '';

            if (posts.length === 0) {
                container.innerHTML = '<p>No posts found.</p>';
                return;
            }

            posts.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.classList.add('post');
                postDiv.innerHTML = `
                    <h3>${post.title}</h3>
                    <p>${post.content.substring(0, 100)}...</p>
                    <a href="/post/${post._id}">Read More</a>
                `;
                container.appendChild(postDiv);
            });
        })
        .catch(err => console.error(`Error loading ${containerId}:`, err));
}
