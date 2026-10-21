-- Social tables for posts/comments/likes

CREATE TABLE IF NOT EXISTS public.posts (
  post_id     BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
  comment_id  BIGSERIAL PRIMARY KEY,
  post_id     BIGINT NOT NULL REFERENCES public.posts(post_id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id     BIGINT NOT NULL REFERENCES public.posts(post_id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);