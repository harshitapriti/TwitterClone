const express = require('express');
const router = express.Router();
const TwitterUser = require('../models/user_schema');
const protectedRoute = require('../middleware/protected');
const upload = require('./file_route');

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

//creating register API
router.post('/api/auth/register', async (req, res) => {
    const {name, email, username, password} = req.body;
    if (!name || !email || !username || !password) {
        return res.status(400).json({error: 'One or more mandatory fields are empty.'});
    }
    try {
        const existingEmail = await TwitterUser.findOne({email: email});
        if (existingEmail) {
            return res.status(400).json({error: 'User already exists'});
        }

        const existingUsername = await TwitterUser.findOne({username: username});
        if (existingUsername) {
            return res.status(400).json({error: 'Username not available'});
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const newUser = new TwitterUser({
            name,
            email,
            username,
            password: hashedPassword,
        });

        await newUser.save();
        return res.status(201).json({result: 'User registered successfully'});
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: 'Server error'});
    }
});

//creating login API
router.post('/api/auth/login', (req, res) => {
    const {email , password} = req.body;

    if(!email || !password) {
        return res.status(400).json({error: 'One or mandatory field are empty'});
    }

    TwitterUser.findOne({email: email})
    .then((userFound) => {
        if(!userFound) {
            return res.status(400).json({error: 'Invalid credentials'});
        }
        bcryptjs
        .compare(password, userFound.password)
        .then((didMatch) => {
            if(didMatch) {
                const jwtToken = jwt.sign({_id: userFound._id}, JWT_SECRET);
                const tUserInfo = {"email": userFound.email, "name": userFound.name, "id": userFound._id, "username": userFound.username};

                res.status(200).json({result: {token: jwtToken, user: tUserInfo}});
            } else {
                return res.status(401).json({result: 'Invalid credentials'});
            }
        })
        .catch((error) => {
            console.log(error);
        });
    })
    .catch((error) => {
        console.log(error);
    });
});

//get single user details
router.get('/api/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        const tUser = await TwitterUser.findById(userId)
        .select('-password')
        .populate('followers', '_id')
        .populate('following', '_id');

        if(!tUser) {
            return res.status(404).json({error: 'User not found'});
        }

        res.status(200).json(tUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Server error'});
    }
});

//follow user
router.post('/api/user/:id/follow', protectedRoute, async (req, res) => {
    try {
        const userIdToFollow = req.params.id;
        const loggedInUserId = req.user._id;

        const [loggedInUser, userToFollow] = await Promise.all([
            TwitterUser.findById(loggedInUserId),
            TwitterUser.findById(userIdToFollow)
        ]);

        if(!userToFollow) {
            return res.status(404).json({error: 'User to follow not found'});
        }

        //user cannot follow themselves
    if (loggedInUserId.toString() === userIdToFollow) {
        return res.status(400).json({ error: 'You cannot follow yourself' });
      }
  
      //check if the user is already following the target user
      const tUser = await TwitterUser.findById(loggedInUserId);
      if (tUser.following.includes(userIdToFollow)) {
        return res.status(400).json({ error: 'You are already following this user' });
      }

        loggedInUser.following.push(userIdToFollow);
        userToFollow.followers.push(loggedInUserId);

        await loggedInUser.save();
        await userToFollow.save();

        res.status(200).json({message: 'User followed successfully', userToFollow});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Server error'});
    }
});

//unfollow user
router.post('/api/user/:id/unfollow', protectedRoute, async (req, res) => {
    try {
        const userIdToUnfollow = req.params.id;
    const loggedInUserId = req.user._id;

    const [loggedInUser, userToUnfollow] = await Promise.all([
        TwitterUser.findById(loggedInUserId),
        TwitterUser.findById(userIdToUnfollow)
    ]);

    if(!userToUnfollow) {
        return res.status(404).json({error: 'User to unfollow not found'});
    }

    //user cannot unfollow themselves
    if(loggedInUserId.toString() === userIdToUnfollow) {
        return res.status(400).json({error: 'You cannot unfollow yourself'});
    }

    const tUser = await TwitterUser.findById(loggedInUserId);
    if(!tUser.following.includes(userIdToUnfollow)) {
        return res.status(400).json({error: 'You are not following this user'});
    }

    loggedInUser.following.pull(userIdToUnfollow);
    userToUnfollow.followers.pull(loggedInUserId);

    await loggedInUser.save();
    await userToUnfollow.save();

    res.status(200).json({message: 'User unfollowed successfully', userToUnfollow});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Server error'});
    }
});

//for updating user details
router.put('/api/user/:id', protectedRoute, async (req, res) => {
    try {
        const tUserId = req.params.id;

        //to ensure that the user making put request is the owener of the account
        if(req.user._id.toString() !== tUserId) {
            return res.status(401).json({error: 'You are not authorized to update the details'});
        }

        const {name, dob, location} = req.body;

        const updateFields = {};
        if(name) updateFields.name = name;
        if(dob) updateFields.dob = dob;
        if(location) updateFields.location = location;

        //check if atleast there is one field to update
        if(Object.keys(updateFields).length === 0) {
            return res.status(400).json({error: 'There is nothing to update'});
        }

        //update the provided fields
        const updatedUser = await TwitterUser.findByIdAndUpdate(
            tUserId,
            {$set: updateFields},
            {new: true, runValidators: true}
        );

        if(!updatedUser) {
            return res.status(400).json({error: 'User not found'});
        }

        res.status(200).json({message: 'User updated successfully', user: updatedUser});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Server error'});
    }
});

//endpoint for profile picture upload
router.post('/api/user/:id/uploadProfilePic', protectedRoute, upload.single('profilePicture'), async (req, res) => {
    try {
        //handle the uploaded file
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.params.id;
        const imagePath = 'uploads/' + req.file.path.replace(/\\/g, '/'); 

        //update user profile picture in the database
        const user = await TwitterUser.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.profilePicture = imagePath;
        await user.save();

        res.status(200).json({ message: 'Profile picture uploaded successfully', imagePath: imagePath });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


module.exports = router;