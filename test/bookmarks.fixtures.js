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

module.exports = {
  makeBookmarksArray,
}