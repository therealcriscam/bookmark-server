const BookmarksService = require('../src/bookmarks-service')
const knex = require('knex')
const {makeBookmarksArray} = require('./bookmarks.fixtures')


describe(`Bookmarks service object`, () => {
  let db;
  let testBookmarks = makeBookmarksArray()

  before(() => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
  })

  before(() => db('bookmarks').truncate())

  afterEach(() => db('bookmarks').truncate())

  after(() => db.destroy())

  context(`given 'bookmarks' has data`, () => {
    beforeEach(() => {
      return db
        .into('bookmarks')
        .insert(testBookmarks)
    })

    it(`getAllBookmarks resolves all bookmarks from 'bookmarks' table`, () => {
      return BookmarksService.getAllBookmarks(db)
        .then(actual => {
          expect(actual).to.eql(testBookmarks)
        })
    })

    it(`getById() resolves a bookmark by id from 'bookmarks' table`, () => {
      const thirdId = 3
      const thirdTestBookmark = testBookmarks[thirdId - 1]

      return BookmarksService.getById(db, thirdId)
        .then(actual => {
          expect(actual).to.eql({
            id: thirdId,
            title: thirdTestBookmark.title,
            url: thirdTestBookmark.url,
            description: thirdTestBookmark.description,
            rating: thirdTestBookmark.rating
          })
        })
    })

    it(`deleteBookmark() removes a bookmark by id from 'bookmarks' table`, () => {
      const bookmarkId = 3
      return BookmarksService.deleteBookmark(db, bookmarkId)
        .then(() => BookmarksService.getAllBookmarks(db))
        .then(allBookmarks => {
          // copy the test bookmarks array without the "deleted" bookmark
          const expected = testBookmarks.filter(bookmark => bookmark.id !== bookmarkId)
          expect(allBookmarks).to.eql(expected)
        })
    })

    it(`updateBookmark() updates a bookmark from the 'bookmarks' table`, () => {
      const idOfBookmarkToUpdate = 3
      const newBookmarkData = {
        title: 'updated title',
        url: 'updated url',
        description: 'updated content',
        rating: 4
      }
      return BookmarksService.updateBookmark(db, idOfBookmarkToUpdate, newBookmarkData)
        .then(() => BookmarksService.getById(db, idOfBookmarkToUpdate))
        .then(bookmark => {
          expect(bookmark).to.eql({
            id: idOfBookmarkToUpdate,
            ...newBookmarkData,
          })
        })
    })

  })

  context(`given 'bookmarks' has no data`, () => {
    it(`getAllBookmarks() resolves an empty array`, () => {
      return BookmarksService.getAllBookmarks(db)
        .then(actual => {
          expect(actual).to.eql([])
        })
    })

    it(`insertBookmark inserts a new bookmark with an 'id'`, () => {
      const newBookmark = {
        title: 'example title',
        url: 'https://example.com',
        description: 'example desc',
        rating: 3
      }

      return BookmarksService.insertBookmark(db, newBookmark)
        .then(actual => {
          expect(actual).to.eql({
            id: 1,
            title: newBookmark.title,
            url: newBookmark.url,
            description: newBookmark.description,
            rating: newBookmark.rating
          })
        })
    })

  })

})