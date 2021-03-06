require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const auth = require('./auth')
const error = require('./error')
const bookmarkRouter = require('./bookmarks/bookmark-router')


const app = express();

const morganOption = (NODE_ENV === 'production') ? 'tiny' : 'common';

app.use(morgan(morganOption));
app.use(cors());
app.use(helmet());

// auth not being used for testing purposes
// app.use(auth);

app.get('/', (req, res) => {
  res
    .send('Hello, world!')
})

app.use('/api/bookmarks', bookmarkRouter);

app.use(error);

module.exports = app
