let mongoose = require('mongoose');
let categorySchema = require('../schemas/categorySchema');

module.exports = mongoose.model('Category',categorySchema);
