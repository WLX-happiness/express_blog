const mongoose = require('mongoose');
const contentsSchema = require('../schemas/contentSchema');

module.exports = mongoose.model('Content', contentsSchema);