-- =========================
-- DEMO SEED DATA
-- =========================

-- USERS (password = Password123!)
INSERT INTO users (email, password_hash, full_name, role)
VALUES
('alice@test.com', '$2b$10$demo', 'Alice Customer', 'customer'),
('tailor@test.com', '$2b$10$demo', 'Tom Tailor', 'tailor');

-- POSTS
INSERT INTO posts (user_id, content)
VALUES
(1, 'Hello! This is my first post on the Upcycle platform.');

-- REQUESTS
INSERT INTO requests (customer_id, title, description)
VALUES
(1, 'Shorten trousers', 'Need trousers shortened by 2 inches.');

-- QUOTES (optional demo)
INSERT INTO quotes (request_id, tailor_id, price_gbp, message)
VALUES
(1, 2, 18.50, 'Can complete within 48 hours.');
