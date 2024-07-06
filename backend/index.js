const express = require('express');
const mongoose = require('mongoose');
const app = express();
const { MONGO_DB_URL } = require('./config.js');
const PORT = process.env.PORT || 5000;
const cors = require('cors');
const path = require('path');


//connecting to database
mongoose.connect(MONGO_DB_URL);

mongoose.connection.on('connected', () => {
    console.log('Connected to database...');
});

mongoose.connection.on('error', (error) => {
    console.error('Error coonecting to database: ', error);
});

//required schemas
require('./models/user_schema.js');
require('./models/tweet_schema.js');

//serving static files from the images directory
app.use('/uploads/images/', express.static(path.join(__dirname, 'images')));


app.use(express.json());
app.use(cors());

app.use(require('./routes/user_routes.js'));
app.use(require('./routes/tweet_routes.js'));

app.listen(PORT, () => {
    console.log(`Server running on port number ${PORT}`);
});