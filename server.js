const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();
const PORT = 8080;

// Устанавливаем корневую директорию проекта
const ROOT_DIR = path.resolve(__dirname, '../BackEnd-Project');

// Настройка подключения к MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/blog_platform');
const db = mongoose.connection;
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Создание схемы пользователя
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Хэширование пароля перед сохранением
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const User = mongoose.model('User', userSchema);

// Создание схемы поста
const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: [{ type: String }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// Middleware
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' http: https: data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline';");
    next();
});

app.use(express.static(path.join(ROOT_DIR, 'frontend')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/blog_platform' }),
    cookie: { maxAge: 3600000 } // Cookie действует 1 час
}));

// Маршруты
app.get('/', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'frontend/html/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'frontend/html/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'frontend/html/reg.html'));
});

app.get('/profile', async (req, res) => {
    if (req.session.user) {
        try {
            res.sendFile(path.join(ROOT_DIR, 'frontend/html/profile.html'));
        } catch (err) {
            console.error(err);
            res.status(500).send('Error loading profile page');
        }
    } else {
        res.redirect('/login');
    }
});

app.get('/profile-data', async (req, res) => {
    if (req.session.user) {
        try {
            const user = await User.findById(req.session.user.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({
                username: user.username,
                email: user.email
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

app.get('/user-posts', async (req, res) => {
    if (req.session.user) {
        try {
            const userPosts = await Post.find({ author: req.session.user.id });
            res.json(userPosts);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error fetching posts' });
        }
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

app.post('/create-post', async (req, res) => {
    if (req.session.user) {
        const { title, content, tags } = req.body;
        try {
            const newPost = new Post({
                title,
                content,
                tags: tags.split(',').map(tag => tag.trim()),
                author: req.session.user.id
            });
            await newPost.save();
            res.redirect('/profile');
        } catch (err) {
            console.error(err);
            res.status(500).send('Error creating post');
        }
    } else {
        res.status(401).send('Unauthorized');
    }
});

app.get('/favicon.ico', (req, res) => {
    const faviconPath = path.join(ROOT_DIR, 'frontend/favicon.ico');
    if (fs.existsSync(faviconPath)) {
        res.sendFile(faviconPath);
    } else {
        res.status(404).send('Favicon not found');
    }
});

// Регистрация пользователя
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.send('Error: Unable to register. Username or email might already exist.');
    }
});

// Логин пользователя
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = { id: user._id, email: user.email }; // Сохранение данных пользователя
            res.redirect('/profile');
        } else {
            res.send('Invalid email or password.');
        }
    } catch (err) {
        console.error(err);
        res.send('Error: Unable to log in.');
    }
});

// Выход из системы
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Получение всех постов с возможностью сортировки и выводом на отдельную страницу
app.get('/all-posts', async (req, res) => {
    const { tag, sort } = req.query;
    try {
        let filter = {};
        if (tag) {
            filter.tags = tag;
        }

        let sortOption = { createdAt: -1 }; // Default sorting by newest
        if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        }

        const posts = await Post.find(filter).sort(sortOption).populate('author', 'username email');

        res.sendFile(path.join(ROOT_DIR, 'frontend/html/all-posts.html'));
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching all posts');
    }
});

// API для динамической загрузки постов
app.get('/api/all-posts', async (req, res) => {
    const { tag, sort } = req.query;
    try {
        let filter = {};
        if (tag) {
            filter.tags = tag;
        }

        let sortOption = { createdAt: -1 }; // Default sorting by newest
        if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        }

        const posts = await Post.find(filter).sort(sortOption).populate('author', 'username email');
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching posts' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
