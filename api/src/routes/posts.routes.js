const express = require("express");
const router = express.Router();
const { z } = require("zod");
const db = require("../config/db");
const { requireAuth } = require("../middleware/auth");

// GET /api/v1/posts  (simple feed)
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         p.post_id,
         p.content,
         p.created_at,
         p.user_id,
         u.full_name AS author_name,
         (SELECT COUNT(*)::int FROM public.post_likes pl WHERE pl.post_id = p.post_id) AS like_count,
         (SELECT COUNT(*)::int FROM public.comments c WHERE c.post_id = p.post_id) AS comment_count
       FROM public.posts p
       JOIN public.users u ON u.user_id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT 50`
    );

    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/v1/posts  (create post)
router.post("/", requireAuth, async (req, res) => {
  const schema = z.object({
    content: z.string().min(1).max(2000),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
  }

  try {
    const created = await db.query(
      `INSERT INTO public.posts (user_id, content)
       VALUES ($1, $2)
       RETURNING post_id, user_id, content, created_at`,
      [req.user.user_id, parsed.data.content]
    );

    res.status(201).json({ data: created.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/v1/posts/:postId/comments
router.get("/:postId/comments", async (req, res) => {
  const postId = Number(req.params.postId);
  if (!Number.isInteger(postId)) {
    return res.status(400).json({ error: "Invalid post id" });
  }

  try {
    const postExists = await db.query(
      "SELECT post_id FROM public.posts WHERE post_id = $1",
      [postId]
    );
    if (postExists.rowCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comments = await db.query(
      `SELECT
         c.comment_id,
         c.post_id,
         c.user_id,
         u.full_name AS author_name,
         c.content,
         c.created_at
       FROM public.comments c
       JOIN public.users u ON u.user_id = c.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );

    return res.json({ data: comments.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/v1/posts/:postId/comments
router.post("/:postId/comments", requireAuth, async (req, res) => {
  const postId = Number(req.params.postId);
  if (!Number.isInteger(postId)) {
    return res.status(400).json({ error: "Invalid post id" });
  }

  const schema = z.object({
    content: z.string().min(1).max(1000),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
  }

  try {
    // Ensure post exists
    const postExists = await db.query("SELECT post_id FROM public.posts WHERE post_id = $1", [postId]);
    if (postExists.rowCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const created = await db.query(
      `INSERT INTO public.comments (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING comment_id, post_id, user_id, content, created_at`,
      [postId, req.user.user_id, parsed.data.content]
    );

    res.status(201).json({ data: created.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/v1/posts/:postId/likes  (toggle like)
router.post("/:postId/likes", requireAuth, async (req, res) => {
  const postId = Number(req.params.postId);
  if (!Number.isInteger(postId)) {
    return res.status(400).json({ error: "Invalid post id" });
  }

  try {
    // Ensure post exists
    const postExists = await db.query("SELECT post_id FROM public.posts WHERE post_id = $1", [postId]);
    if (postExists.rowCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Toggle: if exists -> delete; else -> insert
    const existing = await db.query(
      "SELECT 1 FROM public.post_likes WHERE post_id = $1 AND user_id = $2",
      [postId, req.user.user_id]
    );

    if (existing.rowCount > 0) {
      await db.query(
        "DELETE FROM public.post_likes WHERE post_id = $1 AND user_id = $2",
        [postId, req.user.user_id]
      );
      return res.json({ data: { liked: false } });
    }

    await db.query(
      "INSERT INTO public.post_likes (post_id, user_id) VALUES ($1, $2)",
      [postId, req.user.user_id]
    );

    return res.json({ data: { liked: true } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;