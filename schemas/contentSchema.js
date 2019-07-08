const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    addTime: {
        type: Date,
        default: new Date()
    },
    view: {
        type: Number,
        default: 0
    },
    title: String,
    description: {
        type: String,
        default: ''
    },
    content: {
        type: String,
        default: ''
    },
    comment: {
        type: Array,
        default: []
    }
});