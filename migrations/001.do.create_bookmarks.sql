CREATE TABLE bookmarks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  rating SMALLINT DEFAULT 1 CHECK (rating BETWEEN 1 AND 5)
);