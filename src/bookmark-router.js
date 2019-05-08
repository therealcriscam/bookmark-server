const express = require('express')
const uuid = require('uuid/v4')
const logger = require('./logger')
const {bookmarks} = require('./store')
const BookmarksService = require('./bookmarks-service')

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter
  .route('/bookmarks')
  .get((req, res) => {
    const knexInstance = req.app.get('db')
    
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks)
      })
  })
  .post(bodyParser, (req, res) => {
    const {title, url, description="", rating=1} = req.body

    if (!title) {
      logger.error(`Title is required`)
      return res
        .status(400)
        .send('Invalid Data')
    }

    if (!url) {
      logger.error(`URL is required`)
      return res
        .status(400)
        .send('Invalid Data')
    }

    if (!url.includes('http://') && !url.includes('https://')) {
      logger.error(`Invalid URL '${url}' supplied.`)
      return res
        .status(400)
        .send("'url' must be a valid URL")
    }

    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Invalid rating '${rating}' supplied.`)
      return res
        .status(400)
        .send("'rating' must be a number between 0 and 5")
    }

    const id = uuid();

    const bookmark = {
      id,
      title,
      url,
      description,
      rating
    }

    bookmarks.push(bookmark)

    logger.info(`Bookmark with id ${id} created.`)

    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${id}`)
      .json(bookmark)
  })

bookmarkRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
    const knexInstance = req.app.get('db')

    BookmarksService.getById(knexInstance, req.params.id)
      .then(bookmark => {
        if (!bookmark) {
          return res
            .status(404)
            .json({error: {message: `Bookmark doesn't exist`} })
        }
        res.json(bookmark)
      })
  })
  .delete((req, res) => {
    const {id} = req.params;
    const bookmarkIndex = bookmarks.findIndex(bookmark => bookmark.id == id);

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`)
      return res
        .status(404)
        .send('Bookmark Not Found')
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted.`);
    res
      .status(204)
      .end();
  })

  module.exports = bookmarkRouter