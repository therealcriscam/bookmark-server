function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'google',
      url: 'https://google.com',
      description: 'use this to search',
      rating: 4
    },
    {
      id: 2,
      title: 'twitter',
      url: 'https://twitter.com',
      description: 'use this to tweet',
      rating: 5
    },
    {
      id: 3,
      title: 'facebook',
      url: 'https://facebook.com',
      description: 'use this to connect',
      rating: 3
    },
    {
      id: 4,
      title: 'reddit',
      url: 'https://reddit.com',
      description: 'use this for anything',
      rating: 5
    }
  ];
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: 'https://maliciousexample.com',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    rating: 5
  }
  const expectedBookmark = {
    id: 911,
    title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    url: 'https://maliciousexample.com',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
    rating: 5
  }
  
  return {
    maliciousBookmark,
    expectedBookmark,
  }
}



module.exports = {
  makeBookmarksArray,
  makeMaliciousBookmark,
}