const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

const users = [];

app.use(bodyParser.json());

app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const newUser = { id: users.length + 1, username, email, password };
  users.push(newUser);

  res.status(201).json({ message: 'User registered successfully', user: newUser });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
