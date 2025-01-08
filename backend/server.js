const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');
const User = require('./user');
const Post = require('./post');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express
const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// API Endpoints
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ success: true, message: 'User registered successfully!' });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({
            success: true,
            token,
            username: user.username,
            email: user.email,
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/posts', async (req, res) => {
    const { content, author } = req.body;

    try {
        const post = new Post({ content, author });
        await post.save();
        res.status(201).json({ success: true, post });
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'username email')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, posts });
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Catch-all route for serving frontend files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/index.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
