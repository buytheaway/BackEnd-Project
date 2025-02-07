const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 8080;

const crypto = require('crypto');

// Генерация токена
const generateToken = () => {
    return crypto.randomBytes(20).toString('hex');
};

app.use(express.static(path.join(__dirname, 'frontend')));

// Устанавливаем корневую директорию проекта
const ROOT_DIR = path.resolve(__dirname, '../BackEnd-Project');
const tokenFilePath = path.join(__dirname, 'tokens', 'user_tokens.json');

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
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null }
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

app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' http: https: data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline';");
    next();
});

app.use(express.static(path.join(ROOT_DIR, 'frontend')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
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

app.delete('/api/posts/:id', async (req, res) => {
    if (req.session.user) {
        try {
            const postId = req.params.id;
            const post = await Post.findOneAndDelete({ _id: postId, author: req.session.user.id });
            if (!post) {
                return res.status(404).json({ error: 'Post not found or you are not the author' });
            }
            res.json({ message: 'Post deleted successfully' });
        } catch (err) {
            console.error('Error deleting post:', err);
            res.status(500).json({ error: 'Error deleting post' });
        }
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

app.put('/api/posts/:id', async (req, res) => {
    if (req.session.user) {
        try {
            const postId = req.params.id;
            const { title, content, tags } = req.body;
            const updatedPost = await Post.findOneAndUpdate(
                { _id: postId, author: req.session.user.id },
                { title, content, tags: tags.split(',').map(tag => tag.trim()) },
                { new: true }
            );
            if (!updatedPost) {
                return res.status(404).json({ error: 'Post not found or you are not the author' });
            }
            res.json({ message: 'Post updated successfully', post: updatedPost });
        } catch (err) {
            console.error('Error updating post:', err);
            res.status(500).json({ error: 'Error updating post' });
        }
    } else {
        res.status(401).json({ error: 'Unauthorized' });
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

// Сохранение токена
const saveToken = (token) => {
    fs.writeFileSync(tokenFilePath, JSON.stringify(token));
    console.log('Token saved successfully.');
};

app.get('/verify-email/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).send('Invalid or expired token.');
        }
        user.verified = true;
        user.verificationToken = null;
        await user.save();

        res.send('Email verified successfully. You can now log in.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error verifying email.');
    }
});


app.get('/verify/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByIdAndUpdate(id, { isVerified: true });
        if (!user) {
            return res.status(404).send('User not found.');
        }
        res.send('Email verified successfully. You can now log in.');
    } catch (err) {
        console.error('Error verifying email:', err);
        res.status(500).send('Error verifying email.');
    }
});

// Регистрация пользователя
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const token = generateToken();

        const newUser = new User({
            username,
            email,
            password,
            verificationToken: token,
            verified: false
        });

        await newUser.save();

        // Отправка Верефикационного email
        const verificationLink = `http://localhost:${PORT}/verify-email/${token}`;
        await transporter.sendMail({
            from: 'your-email@gmail.com',
            to: email,
            subject: 'Verify Your Email',
            text: `Hi ${username},\n\nPlease verify your email by clicking the link below:\n${verificationLink}`
        });

        res.send('Registration successful. Please check your email to verify your account.');
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).send('Error: Unable to register.');
    }
});

// Логин пользователя
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.send('User not found.');
        }

        if (!user.verified) {
            return res.send('Please verify your email before logging in.');
        }

        if (await bcrypt.compare(password, user.password)) {
            req.session.user = { id: user._id, email: user.email };
            res.redirect('/profile');
        } else {
            res.send('Invalid email or password.');
        }
    } catch (err) {
        console.error('Error during login:', err);
        res.send('Error: Unable to log in.');
    }
});

//Отправка сообщений
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'qwetyuiop741852963@gmail.com',
        pass: 'ywyt sjdb urrl qjxp'
    }
});

app.post('/send-email', async (req, res) => {
    const { recipientEmail, message } = req.body;

    if (!recipientEmail || !message) {
        return res.status(400).json({ message: 'Recipient email and message are required.' });
    }

    try {
        await transporter.sendMail({
            from: 'qwetyuiop741852963@gmail.com',
            to: recipientEmail,
            subject: 'Message from Your Website',
            text: message
        });

        res.json({ message: 'Email sent successfully!' });
    } catch (err) {
        console.error('Error sending email:', err);
        res.status(500).json({ message: 'Failed to send email.' });
    }
});

// Выход из системы
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/api/all-posts', async (req, res) => {
    const { tag, sort, page = 1, username } = req.query;
    const limit = 10;
    try {
        let filter = {};
        if (tag) {
            filter.tags = tag;
        }

        if (username) {
            const user = await User.findOne({ username });
            if (user) {
                filter.author = user._id;
            } else {
                return res.json({ posts: [], hasNextPage: false });
            }
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        }

        const skip = (page - 1) * limit;
        const posts = await Post.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .populate('author', 'username email');

        const totalPosts = await Post.countDocuments(filter);
        const hasNextPage = page * limit < totalPosts;

        res.json({ posts, hasNextPage });
    } catch (err) {
        console.error("Error in /api/all-posts:", err);
        res.status(500).json({ error: 'Error fetching posts' });
    }
});

app.get('/all-posts', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'frontend/html/all-posts.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});