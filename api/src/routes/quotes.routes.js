const express = require("express");
const router = express.Router({ mergeParams: true });
const { z } = require("zod");
const db = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");

// POST /api/v1/requests/:id/quotes
router.post("/", requireAuth, requireRole("tailor"), async (req, res) => {
  const schema = z.object({
    price_gbp: z.number().nonnegative(),
    message: z.string().max(2000).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parsed.error.issues,
    });
  }

  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId)) {
    return res.status(400).json({ error: "Invalid request id" });
  }

  try {
    // Ensure request exists
    const reqCheck = await db.query(
      "SELECT request_id FROM requests WHERE request_id = $1",
      [requestId]
    );

    if (reqCheck.rowCount === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const { price_gbp, message } = parsed.data;
    const tailor_id = req.user.user_id;

    const result = await db.query(
      `INSERT INTO quotes (request_id, tailor_id, price_gbp, message, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING quote_id, request_id, tailor_id, price_gbp, message, status, created_at`,
      [requestId, tailor_id, price_gbp, message || null]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    // UNIQUE constraint → tailor already quoted
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "Tailor has already submitted a quote for this request" });
    }

    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/v1/requests/:id/quotes
router.get("/", requireAuth, async (req, res) => {
  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId)) {
    return res.status(400).json({ error: "Invalid request id" });
  }

  try {
    // Ensure the request exists + get owner
    const reqInfo = await db.query(
      "SELECT customer_id FROM public.requests WHERE request_id = $1",
      [requestId]
    );

    if (reqInfo.rowCount === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const ownerCustomerId = reqInfo.rows[0].customer_id;

    // CUSTOMER: can see all quotes for own request
    if (req.user.role === "customer") {
      if (ownerCustomerId !== req.user.user_id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const quotes = await db.query(
        `SELECT quote_id, tailor_id, price_gbp, message, status, created_at
         FROM public.quotes
         WHERE request_id = $1
         ORDER BY created_at`,
        [requestId]
      );

      return res.json({ data: quotes.rows });
    }

    // TAILOR: can see only their own quotes for that request
    if (req.user.role === "tailor") {
      const quotes = await db.query(
        `SELECT quote_id, request_id, price_gbp, message, status, created_at
         FROM public.quotes
         WHERE request_id = $1 AND tailor_id = $2
         ORDER BY created_at`,
        [requestId, req.user.user_id]
      );

      return res.json({ data: quotes.rows });
    }

    // Admin (if ever used): allow full access
    const quotes = await db.query(
      `SELECT quote_id, tailor_id, price_gbp, message, status, created_at
       FROM public.quotes
       WHERE request_id = $1
       ORDER BY created_at`,
      [requestId]
    );

    return res.json({ data: quotes.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
