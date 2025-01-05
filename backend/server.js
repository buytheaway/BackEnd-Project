const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./db');
const path = require('path');
const cors = require('cors');
const User = require('./user');
const Post = require('./post');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend/html')));
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));

// Register User
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ success: true, message: 'User registered' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error registering user', error });
    }
});

// Login User
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid password' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ success: true, token, username: user.username, email: user.email });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login error', error });
    }
});

// Fetch Posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().populate('author', 'username');
        res.status(200).json({ success: true, posts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching posts', error });
    }
});

// Catch-all route to serve the index.html for unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
