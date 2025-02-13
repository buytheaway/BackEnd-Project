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

app.use(express.static(path.join(__dirname, 'frontend/html')));
app.use('/css', express.static(path.join(__dirname, 'frontend/css')));
app.use('/js', express.static(path.join(__dirname, 'frontend/js')));


// Устанавливаем корневую директорию проекта
const ROOT_DIR = path.resolve(__dirname, '../BackEnd-Project');
const tokenFilePath = path.join(__dirname, 'tokens', 'user_tokens.json');

// Настройка подключения к MongoDB
const MONGO_URI = "mongodb+srv://HardParty:roronoazoro667@cluster0.reikk.mongodb.net/blog_platform?retryWrites=true&w=majority&tls=true";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

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

app.use(express.static(path.join(__dirname, 'frontend')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }), 
    cookie: { maxAge: 3600000 } // Cookie действует 1 час
}));


// Маршруты
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Загружаем переменные окружения

const generateJWT = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// Middleware для проверки JWT
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Берём токен из заголовка Authorization

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }
        req.user = decoded; // Сохраняем данные пользователя в req.user
        next();
    });
};

// Маршруты
app.get('/', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'frontend/html/index.html'));
});

app.get('/login', (req, res) => {
    const filePath = path.join(__dirname, 'frontend/html/login.html');
    console.log(`Serving login page from: ${filePath}`);

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("Error serving file:", err);
            res.status(500).send("Internal Server Error");
        }
    });
});

app.get('/register', (req, res) => {
    const filePath = path.join(__dirname, 'frontend/html/reg.html');
    console.log(`Serving login page from: ${filePath}`);

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("Error serving file:", err);
            res.status(500).send("Internal Server Error");
        }
    });
});

// Профиль пользователя (теперь с JWT)
app.get('/profile', authenticateJWT, async (req, res) => {
    const filePath = path.join(__dirname, 'frontend/html/profile.html');
    console.log(`Serving profile page from: ${filePath}`);
    
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("Error serving profile page:", err);
            res.status(500).send("Internal Server Error");
        }
    });
});

// Получение данных профиля (JWT)
app.get('/profile-data', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            username: user.username,
            email: user.email
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение постов пользователя (JWT)
app.get('/user-posts', authenticateJWT, async (req, res) => {
    try {
        const userPosts = await Post.find({ author: req.user.id });
        res.json(userPosts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching posts' });
    }
});

// Создание поста (JWT)
app.post('/create-post', authenticateJWT, async (req, res) => {
    const { title, content, tags } = req.body;
    try {
        const newPost = new Post({
            title,
            content,
            tags: tags.split(',').map(tag => tag.trim()),
            author: req.user.id
        });
        await newPost.save();
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating post');
    }
});

// Удаление поста (JWT)
app.delete('/api/posts/:id', authenticateJWT, async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findOneAndDelete({ _id: postId, author: req.user.id });
        if (!post) return res.status(404).json({ error: 'Post not found or you are not the author' });

        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ error: 'Error deleting post' });
    }
});

// Обновление поста (JWT)
app.put('/api/posts/:id', authenticateJWT, async (req, res) => {
    try {
        const postId = req.params.id;
        const { title, content, tags } = req.body;
        const updatedPost = await Post.findOneAndUpdate(
            { _id: postId, author: req.user.id },
            { title, content, tags: tags.split(',').map(tag => tag.trim()) },
            { new: true }
        );
        if (!updatedPost) return res.status(404).json({ error: 'Post not found or you are not the author' });

        res.json({ message: 'Post updated successfully', post: updatedPost });
    } catch (err) {
        console.error('Error updating post:', err);
        res.status(500).json({ error: 'Error updating post' });
    }
});

// Фавиконка
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
        const BASE_URL = process.env.BASE_URL?.trim() || `https://backend-project-p1t3.onrender.com`;
        const verificationLink = `${BASE_URL}/verify-email/${token}`;
        
        console.log("Generated verification link:", verificationLink);
        

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
            return res.status(400).json({ message: 'User not found.' });
        }

        if (!user.verified) {
            return res.status(400).json({ message: 'Please verify your email before logging in.' });
        }

        if (await bcrypt.compare(password, user.password)) {
            const token = generateJWT(user);
            res.json({ message: 'Login successful', token });
        } else {
            res.status(400).json({ message: 'Invalid email or password.' });
        }
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Error: Unable to log in.' });
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

// API для рекомендаций (рандомные посты из базы данных)
app.get('/api/recommended-posts', async (req, res) => {
    try {
        const posts = await Post.aggregate([{ $sample: { size: 5 } }]); // Берём 5 случайных постов
        res.json(posts);
    } catch (err) {
        console.error("Error fetching recommended posts:", err);
        res.status(500).json({ error: 'Error fetching posts' });
    }
});


app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/html/home.html'));
});

// API для популярных постов
app.get('/api/popular-posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ likes: -1 }).limit(5);
        res.json(posts);
    } catch (err) {
        console.error("Error fetching popular posts:", err);
        res.status(500).json({ error: 'Error fetching posts' });
    }
});

// API для последних постов
app.get('/api/latest-posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).limit(5);
        res.json(posts);
    } catch (err) {
        console.error("Error fetching latest posts:", err);
        res.status(500).json({ error: 'Error fetching posts' });
    }
});

// API для рекомендаций (рандомные посты)
app.get('/api/recommended-posts', async (req, res) => {
    try {
        const posts = await Post.aggregate([{ $sample: { size: 5 } }]);
        res.json(posts);
    } catch (err) {
        console.error("Error fetching recommended posts:", err);
        res.status(500).json({ error: 'Error fetching posts' });
    }
});





app.get('/all-posts', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend/html/all-posts.html'));
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});