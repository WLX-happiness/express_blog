let userSchema = require('../schemas/userSchema');
let mongoose = require('mongoose');

module.exports = mongoose.model('User',userSchema);