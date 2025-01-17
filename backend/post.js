const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    content: { type: String, required: true, maxlength: 500 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Post', postSchema);
