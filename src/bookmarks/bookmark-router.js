const express = require('express')
const logger = require('../logger')
const BookmarksService = require('./bookmarks-service')
const xss = require('xss')
const path = require('path')

const bookmarkRouter = express.Router();
const bodyParser = express.json();

const sanitizeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title), // sanitize title
  url: bookmark.url, // sanitize url
  description: xss(bookmark.description), // sanitize description 
  rating: Number(bookmark.rating)
})

bookmarkRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res
          .json(bookmarks.map(sanitizeBookmark))
      })
      .catch(next)
  })
  .post(bodyParser, (req, res, next) => {
    const {title, url, description, rating} = req.body
    const newBookmark = {title, url, description, rating}
    const knexInstance = req.app.get('db')

    if (!title) {
      logger.error(`Title is required`)
      return res
        .status(400)
        .json({
          error: {message: `Missing 'title' in request body`}
        })
    }

    if (!url) {
      logger.error(`URL is required`)
      return res
        .status(400)
        .json({
          error: {message: `Missing 'url' in request body`}
        })
    }

    if (!url.includes('http://') && !url.includes('https://')) {
      logger.error(`Invalid URL '${url}' supplied.`)
      return res
        .status(400)
        .json({
          error: {message: `Invalid 'url' in request body`}
        })
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      logger.error(`Invalid rating '${rating}' supplied.`)
      return res
        .status(400)
        .json({
          error: {message: `Rating must be between 1 and 5`}
        })
    }

    BookmarksService.insertBookmark(knexInstance, newBookmark)
      .then(bookmark => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl + `/${bookmark.id}`))
          .json(sanitizeBookmark(bookmark))
      })
      .catch(next)
  })

bookmarkRouter
  .route('/:id')
  .all((req, res, next) => {
    const knexInstance = req.app.get('db')
    BookmarksService.getById(knexInstance, req.params.id)
      .then(bookmark => {
        if (!bookmark) {
          return res
            .status(404)
            .json({error: {message: `Bookmark doesn't exist`}})
        }
        res.bookmark = bookmark
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res
      .json(sanitizeBookmark(res.bookmark))
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get('db')
    BookmarksService.deleteBookmark(knexInstance, req.params.id)
      .then(() => {
        logger.info(`Bookmark with id ${req.params.id} deleted.`);
        res
          .status(204)
          .end()
      })
      .catch(next)
  })
  .patch(bodyParser, (req, res, next) => {
    const {title, url, description, rating} = req.body
    const bookmarkToUpdate = {title, url, description, rating}

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length

    if(numberOfValues === 0) {
      return res
        .status(400)
        .json({error: {message: `Request body must contain either 'title', 'url', 'description' or 'rating'`}})
    }

    BookmarksService.updateBookmark(
      req.app.get('db'),
      req.params.id,
      bookmarkToUpdate
    )
      .then(numRowsAffected => {
        res
          .status(204)
          .end()
      })
      .catch(next)
  })

  module.exports = bookmarkRouter