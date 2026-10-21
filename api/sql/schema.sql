-- =========================
-- UP CYCLE PLATFORM SCHEMA
-- =========================

DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'tailor', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- REQUESTS
CREATE TABLE requests (
  request_id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'accepted', 'closed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QUOTES
CREATE TABLE quotes (
  quote_id SERIAL PRIMARY KEY,
  request_id INT NOT NULL REFERENCES requests(request_id) ON DELETE CASCADE,
  tailor_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  price_gbp NUMERIC(10,2) NOT NULL CHECK (price_gbp >= 0),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (request_id, tailor_id)
);

-- ORDERS
CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  request_id INT NOT NULL REFERENCES requests(request_id),
  quote_id INT NOT NULL REFERENCES quotes(quote_id),
  customer_id INT NOT NULL REFERENCES users(user_id),
  tailor_id INT NOT NULL REFERENCES users(user_id),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (request_id)
);

-- POSTS
CREATE TABLE posts (
  post_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- COMMENTS
CREATE TABLE comments (
  comment_id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- POST LIKES
CREATE TABLE post_likes (
  post_id INT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);
