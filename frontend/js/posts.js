document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('postsContainer');
    const filterForm = document.getElementById('filterForm');
    let page = 1;
    let loading = false;

    const loadPosts = (tag = '', username = '', sort = '', reset = false) => {
        if (loading) return;
        loading = true;

        const query = new URLSearchParams();
        query.append('page', page);
        if (tag) query.append('tag', tag);
        if (username) query.append('username', username);
        if (sort) query.append('sort', sort);

        fetch(`/api/all-posts?${query.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (reset) postsContainer.innerHTML = ''; // Clear for new filters
                data.posts.forEach(post => {
                    const postDiv = document.createElement('div');
                    postDiv.classList.add('post');
                    postDiv.innerHTML = `
                        <h3>${post.title}</h3>
                        <p>${post.content}</p>
                        <p><strong>Tags:</strong> ${post.tags.join(', ')}</p>
                        <p><em>By: ${post.author.username} (${post.author.email})</em></p>
                    `;
                    postsContainer.appendChild(postDiv);
                });

                if (data.hasNextPage) {
                    page++;
                    loading = false;
                } else {
                    const endMessage = document.createElement('p');
                    endMessage.textContent = 'No more posts to load.';
                    postsContainer.appendChild(endMessage);
                }
            })
            .catch(err => console.error('Error loading posts:', err));
    };

    // Initial load
    loadPosts();

    // Filter form logic
    filterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const tag = document.getElementById('tag').value;
        const username = document.getElementById('username').value;
        const sort = document.getElementById('sort').value;
        page = 1; // Reset page for new filter
        loadPosts(tag, username, sort, true);
    });

    // Infinite scroll logic
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
            const tag = document.getElementById('tag').value;
            const username = document.getElementById('username').value;
            const sort = document.getElementById('sort').value;
            loadPosts(tag, username, sort);
        }
    });
});