const mongoose = require('mongoose');

//user schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    profilePicture: {
        type: String,
    },
    location: {
        type: String,
    },
    dob: {
        type: String,
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TwitterUser'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TwitterUser'
    }]
},
{
    timestamps: {
        createdAt: 'created',
        updatedAt: 'updated'
    }
});

const TwitterUser = mongoose.model('TwitterUser', userSchema);
module.exports = TwitterUser;