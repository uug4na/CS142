const mongoose = require('mongoose');
const express = require('express');
const async = require('async');
const bodyParser = require('body-parser');

// Importing Mongoose schemas
const User = require('./schema/user');
const Photo = require('./schema/photo');
const SchemaInfo = require('./schema/schemaInfo');

// Setup Express app
const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost/cs142project6', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Route: /test
app.get('/test', async (req, res) => {
  try {
    const schemaInfo = await SchemaInfo.find();
    res.status(200).send({
      schemaInfo,
      counts: {
        users: await User.countDocuments(),
        photos: await Photo.countDocuments(),
      },
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Route: /user/list
app.get('/user/list', async (req, res) => {
  try {
    const users = await User.find({}, '_id first_name last_name');
    res.status(200).send(users);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Route: /user/:id
app.get('/user/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId, '_id first_name last_name location description occupation');
    if (!user) {
      return res.status(400).send({ error: 'User not found' });
    }
    res.status(200).send(user);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Route: /photosOfUser/:id
app.get('/photosOfUser/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const photos = await Photo.find({ user_id: userId });
    if (!photos) {
      return res.status(400).send({ error: 'Photos not found' });
    }

    const photosWithComments = await Promise.all(
      photos.map(async (photo) => {
        const commentsWithUsers = await Promise.all(
          photo.comments.map(async (comment) => {
            const user = await User.findById(comment.user_id, '_id first_name last_name');
            return { ...comment.toObject(), user };
          })
        );
        return { ...photo.toObject(), comments: commentsWithUsers };
      })
    );

    res.status(200).send(photosWithComments);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Start the server
const server = app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

module.exports = server;
