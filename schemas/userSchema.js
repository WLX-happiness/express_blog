let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let userSchema = new Schema({
    username: String,
    password: String,
    isAdmin: {
        type: Boolean,
        default:false
    }
});

module.exports = userSchema;