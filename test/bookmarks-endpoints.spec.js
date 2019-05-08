const {expect} = require('chai')
const knex = require('knex')
const app = require('../src/app.js')
const {makeBookmarksArray} = require('./bookmarks.fixtures')

describe.only('Bookmarks Endpoints', () => {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () => db('bookmarks').truncate())

  afterEach('cleanup', () => db('bookmarks').truncate())
  
  describe(`GET /bookmarks`, () => {
    context(`given no bookmarks`, () => {
      it(`responds with 200 and an empty array`, () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(200, [])
      })
    })

    context('given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('responds with 200 and all the bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(200, testBookmarks)
      })

    })
  })

  describe(`GET /bookmarks/:bookmarkId `, () => {
    context(`given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 32131
        
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .expect(404, {error: {message: `Bookmark doesn't exist`} })
      })
    })
    
    context('given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2
        const expectedBookmark = testBookmarks[bookmarkId - 1]

        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .expect(200, expectedBookmark)
      })

    })
  })

})