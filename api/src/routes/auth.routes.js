const express = require("express");
const router = express.Router();
const { z } = require("zod");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { requireAuth } = require("../middleware/auth");

// POST /api/v1/auth/register
router.post("/register", async (req, res) => {
  const schema = z.object({
    full_name: z.string().min(2).max(120),
    email: z.string().email().max(255),
    password: z.string().min(8).max(200),
    role: z.enum(["customer", "tailor"]), // keep admin out of public registration
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
  }

  try {
    const { full_name, email, password, role } = parsed.data;

    const existing = await db.query("SELECT user_id FROM public.users WHERE email = $1", [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const created = await db.query(
      `INSERT INTO public.users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, full_name, email, role, created_at`,
      [full_name, email, password_hash, role]
    );

    return res.status(201).json({ data: created.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/v1/auth/login
router.post("/login", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
  }

  try {
    const { email, password } = parsed.data;

    const userRes = await db.query(
      `SELECT user_id, full_name, email, password_hash, role
       FROM public.users
       WHERE email = $1`,
      [email]
    );

    if (userRes.rowCount === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = userRes.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      data: {
        token,
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/v1/auth/me
router.get("/me", requireAuth, async (req, res) => {
  return res.json({ data: req.user });
});

module.exports = router;