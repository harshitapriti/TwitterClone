const mongoose = require('mongoose');

//tweet schema
const tweetSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    tweetedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TwitterUser'
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TwitterUser'
    }],
    retweetBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TwitterUser'
    }],
    image: {
        type: String,
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tweet'
    }]
},
{
    timestamps: {
        createdAt: 'created',
        updatedAt: 'updated'
    }
});

const Tweet = mongoose.model('Tweet', tweetSchema);
module.exports = Tweet;