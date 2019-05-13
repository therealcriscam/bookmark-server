const {expect} = require('chai')
const knex = require('knex')
const app = require('../src/app.js')
const {makeBookmarksArray, makeMaliciousBookmark} = require('./bookmarks.fixtures')

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
  
  describe(`GET /api/bookmarks`, () => {
    context(`given no bookmarks`, () => {
      it(`responds with 200 and an empty array`, () => {
        return supertest(app)
          .get('/api/bookmarks')
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
          .get('/api/bookmarks')
          .expect(200, testBookmarks)
      })

    })

    context(`Given an XSS attack article`, () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([ maliciousBookmark ])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedBookmark.title)
            expect(res.body[0].description).to.eql(expectedBookmark.description)
          })
      })
    })

  })

  describe(`GET /api/bookmarks/:bookmarkId `, () => {
    context(`given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 32131
        
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
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
          .get(`/api/bookmarks/${bookmarkId}`)
          .expect(200, expectedBookmark)
      })
    })

    context(`Given an XSS attack bookmark`, () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([ maliciousBookmark ])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title)
            expect(res.body.description).to.eql(expectedBookmark.description)
          })
      })
    })

  })

  describe(`POST /api/bookmarks`, () => {
    it(`creates a bookmark, responding with 201 and the new bookmark`, () => {
      const newBookmark = {
        title: 'test new bookmark',
        url: 'https://test.com',
        description: 'test description',
        rating: 3
      }

      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.description).to.eql(newBookmark.description)
          expect(res.body.rating).to.eql(newBookmark.rating)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
            .expect(postRes.body)
        )
    })

    it(`responds with 400 and an error message when the 'title' is missing`, () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({
          url: 'https://test.com',
          description: 'test description',
          rating: 3
        })
        .expect(400, {
          error: {message: `Missing 'title' in request body`}
        })
    })

    it(`responds with 400 and an error message when the 'url' is missing`, () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({
          title: 'test',
          description: 'test description',
          rating: 3
        })
        .expect(400, {
          error: {message: `Missing 'url' in request body`}
        })
    })

    it(`responds with 400 and an error message if the url does not include 'http://' or 'https://' is missing`, () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({
          title: 'test',
          url: 'test example',
          description: 'test description',
          rating: 3
        })
        .expect(400, {
          error: {message: `Invalid 'url' in request body`}
        })
    })

    it(`responds with 400 and an error message if rating is not an int between 1 and 5`, () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({
          title: 'test',
          url: 'https://test.com',
          description: 'test description',
          rating: 7
        })
        .expect(400, {
          error: {message: `Rating must be between 1 and 5`}
        })
    })

    it('removes XSS attack content from response', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()
      return supertest(app)
        .post(`/api/bookmarks`)
        .send(maliciousBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title)
          expect(res.body.description).to.eql(expectedBookmark.description)
        })
    })

  })

  describe(`DELETE /api/bookmarks/:bookmarkId`, () => {
    context(`given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 321321
        return supertest(app)
          .delete(`/api/bookmarks/${bookmarkId}`)
          .expect(404, {error: {message: `Bookmark doesn't exist`}})
      })
    })
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

    it('responds with 204 and removes the bookmark', () => {
      const idToRemove = 2
      const expectedBookmark = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
      return supertest(app)
        .delete(`/api/bookmarks/${idToRemove}`)
        .expect(204)
        .then(res =>
          supertest(app)
            .get(`/api/bookmarks`)
            .expect(expectedBookmark)
        )
    })
   })
  })

  describe.only(`PATCH /api/bookmarks/:bookmarkId`, () => {
    context(`given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 132123
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .expect(404, {error: {message: `Bookmark doesn't exist`}})
      })
    })

    context(`given there are bookmarks in the database`, () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it(`responds with 204 and updates the bookmark`, () => {
        const idToUpdate = 2
        const updateBookmark = {
          title: 'updated bookmark title',
          url: 'https://update.com',
          description: 'updated description',
          rating: 1
        }
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        }
        
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send(updateBookmark)
          .expect(204)
          .then(res => 
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .expect(expectedBookmark)
          )
      })

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({irrelevantField: 'foo'})
          .expect(400, {error: {message: `Request body must contain either 'title', 'url', 'description' or 'rating'`}})
      })

      it(`responds with 204 and updates the bookmark`, () => {
        const idToUpdate = 2
        const updateBookmark = {
          title: 'updated bookmark title',
          description: 'updated description',
        }
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        }
        
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({...updateBookmark, fieldToIgnore: 'should not be in GET response'})
          .expect(204)
          .then(res => 
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .expect(expectedBookmark)
          )
      })

    })
  })

})