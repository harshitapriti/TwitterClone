const express = require('express');
const router = express.Router();
const Tweet = require('../models/tweet_schema');
const TwitterUser = require('../models/user_schema');
const protectedRoute = require('../middleware/protected');
const upload = require('./file_route');

//endpoint to get all tweet by a user
router.get('/api/user/:id/tweets', protectedRoute, async (req, res) => {
    try {
        const tUserId = req.params.id;

        const tUser = await TwitterUser.findById(tUserId);
        if(!tUser) {
            return res.status(404).json({error: 'User not found'});
        }

        const tweets = await Tweet.find({tweetedBy: tUserId})
        .populate("tweetedBy", "name username profilePicture")
        .populate("likes", "name username")
        .populate("retweetBy", "name username")
        .populate({
            path: 'replies',
            populate: {
                path: 'tweetedBy',
                select: '-password' 
            }
        })
        .sort({ created: -1 });
        res.status(200).json(tweets);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Server error'});
    }
});

//endpoint for creating a tweet
router.post('/api/tweet', protectedRoute, upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;
        const image = req.file ? 'uploads/' + req.file.path.replace(/\\/g, '/') : null;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const tweet = new Tweet({
            tweetedBy: req.user._id,
            content,
            image,
        });

        await tweet.save();
       
        const populatedTweet = await Tweet.findById(tweet._id).populate('tweetedBy', 'username name profilePicture');

        res.status(201).json({ tweet: populatedTweet });
    } catch (error) {
        console.error('Error posting tweet:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

//endpoint to like a tweet
router.post('/api/tweet/:id/like', protectedRoute, async (req, res) => {
    try {
        const tweetId = req.params.id;
        const tUserId = req.user._id;

        //check if the tweet exists
        const tweet = await Tweet.findById(tweetId);
        if (!tweet) {
            return res.status(404).json({ error: 'Tweet not found' });
        }

         if(!tweet.likes.includes(tUserId)) {
            tweet.likes.push(tUserId);
         }
         else {
            //remove userId from likes array (unlike feature)
            tweet.likes.pull(tUserId);
         }
       
        await tweet.save();

        const populatedTweet = await Tweet.findById(tweet._id)
        .populate('tweetedBy', 'username profilePicture')
        .populate('likes', '-password')
        .populate('retweetBy', 'username')
        .populate({
            path: 'replies',
            populate: {
                path: 'tweetedBy',
                select: 'username profilePicture' 
            }
        });

      
        res.status(200).json({message: 'Tweet liked/disliked successfully', tweet: populatedTweet});
    } catch (error) {
        console.error(error);   
        res.status(500).json({ error: 'Server error' });
    }
});


router.post('/api/tweet/:id/dislike', protectedRoute, async (req, res) => {
    try {
        const tweetId = req.params.id;
        const tUserId = req.user._id;

        const tweet = await Tweet.findById(tweetId);
        if (!tweet) {
            return res.status(404).json({ error: 'Tweet not found' });
        }

        //check if the user has liked the tweet
        if (!tweet.likes.includes(tUserId)) {
            return res.status(400).json({ error: 'You have not liked this tweet' });
        }

        //remove the user's ID from the likes array
        tweet.likes.pull(tUserId);

        //save the updated tweet
        await tweet.save();

        const populatedTweet = await Tweet.findById(tweet._id).populate('replies', 'user').populate('tweetedBy', 'username profilePicture');

        res.status(200).json({ message: 'Tweet disliked successfully', tweet: populatedTweet });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


//endpoint for creating a reply
router.post('/api/tweet/:id/reply', protectedRoute, async (req, res) => {
    try {
        const { content } = req.body;
        const tweetedBy = req.user._id;
        const tweetId = req.params.id;

        const tweet = await Tweet.findById(tweetId);
        if(!tweet) {
            return res.status(404).json({error: 'Tweet not found'});
        }

        const reply = new Tweet({
            content,
            tweetedBy,
            replies: []
        });

         
         await reply.save();

         const tTweet = await Tweet.findById(tweetId);
         if (!tTweet) {
             return res.status(404).json({ error: 'Tweet not found' });
         }
 
         tTweet.replies.push(reply._id);
         await tTweet.save();
 
         //populate the repliedBy field
         const populatedReply = await Tweet.findById(reply._id)
         .populate('tweetedBy', 'username profilePicture')
         .populate('likes');
 
         res.status(201).json({ reply: populatedReply });

    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Server error'});
    }
});

//get a single tweet by id
router.get('/api/tweet/:id', protectedRoute, async (req, res) => {
    try {
        const tweetId = req.params.id;

        const tweet = await Tweet.findById(tweetId)
            .populate('tweetedBy', 'username profilePicture')
            .populate('likes', '-password') 
            .populate('retweetBy', 'username profilePicture') 
            .populate({
                path: 'replies',
                populate: {
                    path: 'tweetedBy',
                    select: 'username profilePicture' 
                }
            });

        if(!tweet) {
            return res.status(404).json({error: 'Tweet not found'});
        }

        res.status(200).json({message: 'Tweet displayed successfully', tweet});

    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Server error'});
    }
});

//get all tweets
router.get('/api/tweet/', protectedRoute, async (req, res) => {
    try {
        const tweets = await Tweet.find({})
    .populate('tweetedBy', '-password')
    .populate('likes', '-password')
    .populate('retweetBy', '-password')
    .populate({
        path: 'replies',
        populate: {
            path: 'tweetedBy',
            select: '-password'
        }
    })
    .sort({ created: -1 });

    if(!tweets) {
        return res.status(404).json({error: 'Tweets not found'});
    }

    res.status(200).json(tweets);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Server error'});
    }
});

//endpoint for deleting a tweet
router.delete('/api/tweet/:id', protectedRoute, async (req, res) => {
    try {
        const tUserId = req.user._id;
        const tweetId = req.params.id;

        const tweet = await Tweet.findById(tweetId);
        if(!tweet) {
            return res.status(404).json({error: 'Tweet not found'});
        }

        if(tUserId.toString() !== tweet.tweetedBy.toString()) {
            return res.status(401).json({error: 'You are not authorized to delete this tweet'});
        }

        await Tweet.findByIdAndDelete(tweetId);

        res.status(200).json({message: 'Tweet deleted successfully'});

    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Server error'});
    }
});

//retweeting a post
router.post('/api/tweet/:id/retweet', protectedRoute, async (req, res) => {
    try {
      const tweetId = req.params.id;
      const userId = req.user._id;
  
      //fetch the tweet by ID
      const tweet = await Tweet.findById(tweetId);
      if (!tweet) {
        return res.status(404).json({ error: 'Tweet not found' });
      }
  
      //check if user has already retweeted
      if (tweet.retweetBy.includes(userId)) {
        return res.status(400).json({ error: 'You have already retweeted this tweet' });
      }
  
      //add user ID to retweet array
      tweet.retweetBy.push(userId);
      await tweet.save();
  
    
  
      //populate the retweetBy field
      const populatedTweet = await Tweet.findById(tweet._id)
      .populate('tweetedBy', 'username profilePicture')
      .populate('retweetBy', 'username')
      .populate({
        path: 'replies',
        populate: {
            path: 'tweetedBy',
            select: '-password'
        }
    });

      res.status(200).json({ tweet: populatedTweet });
    } catch (error) {
      console.error('Error retweeting:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

module.exports = router;