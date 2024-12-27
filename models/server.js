const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./js/db'); // Укажите правильный путь
const User = require('./models/User');
const Post = require('./models/Post');

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());

// Подключение к базе данных
connectDB();

// API для регистрации пользователя
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const user = new User({ username, email, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Error registering user', error: err.message });
  }
});

// API для создания поста
app.post('/api/6', async (req, res) => {
  const { userId, content } = req.body;
  try {
    const post = new Post({ userId, content });
    await post.save();
    res.status(201).json({ message: 'Post created successfully', post });
  } catch (err) {
    res.status(400).json({ message: 'Error creating post', error: err.message });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
