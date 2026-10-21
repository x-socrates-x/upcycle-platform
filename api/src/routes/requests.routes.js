const quotesRouter = require("./quotes.routes");
const { z } = require("zod");
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");


// GET /api/v1/requests
router.get("/", requireAuth, async (req, res) => {
  try {
    // customer: only their own requests
    if (req.user.role === "customer") {
      const result = await db.query(
        `SELECT request_id, customer_id, title, description, status, created_at
         FROM public.requests
         WHERE customer_id = $1
         ORDER BY created_at DESC`,
        [req.user.user_id]
      );
      return res.json({ data: result.rows });
    }

    // tailor/admin: show open requests (tailors need work to quote on)
    const result = await db.query(
      `SELECT request_id, customer_id, title, description, status, created_at
       FROM public.requests
       WHERE status = 'open'
       ORDER BY created_at DESC`
    );

    return res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.use("/:id/quotes", quotesRouter);

// POST /api/v1/requests
router.post("/", requireAuth, requireRole("customer"), async (req, res) => {
  const schema = z.object({
    title: z.string().min(3).max(120),
    description: z.string().min(10).max(5000),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parsed.error.issues,
    });
  }

  try {
    const { title, description } = parsed.data;
    const customer_id = req.user.user_id;

    const result = await db.query(
      `INSERT INTO requests (customer_id, title, description, status)
       VALUES ($1, $2, $3, 'open')
       RETURNING request_id, customer_id, title, description, status, created_at`,
      [customer_id, title, description]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;