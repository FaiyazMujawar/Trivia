const mongoose = require("mongoose");
const passportLocal = require("passport-local-mongoose");

let UserSchema = new mongoose.Schema({
    username: String,
    password: String
});

UserSchema.plugin(passportLocal);

module.exports = mongoose.model("User", UserSchema);
