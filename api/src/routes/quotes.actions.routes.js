const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");

router.patch(
  "/:quoteId/accept",
  requireAuth,
  requireRole("customer"),
  async (req, res) => {
    const quoteId = Number(req.params.quoteId);
    if (!Number.isInteger(quoteId)) {
      return res.status(400).json({ error: "Invalid quote id" });
    }

    const client = await db.pool.connect();

    try {
      await client.query("BEGIN");

      // 1) Load quote + owning request (lock row)
      const q = await client.query(
        `SELECT q.quote_id, q.request_id, q.tailor_id, r.customer_id
         FROM public.quotes q
         JOIN public.requests r ON r.request_id = q.request_id
         WHERE q.quote_id = $1
         FOR UPDATE`,
        [quoteId]
      );

      if (q.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Quote not found" });
      }

      const { request_id, tailor_id, customer_id } = q.rows[0];

      // 2) Ownership check (only owner customer can accept)
      if (customer_id !== req.user.user_id) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "You do not own this request" });
      }

      // 3) Prevent creating multiple orders for same request
      const existing = await client.query(
        "SELECT order_id FROM public.orders WHERE request_id = $1",
        [request_id]
      );

      if (existing.rowCount > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Order already exists for this request" });
      }

      // 4) Accept selected quote
      await client.query(
        `UPDATE public.quotes
         SET status = 'accepted'
         WHERE quote_id = $1`,
        [quoteId]
      );

      // 5) Reject all other quotes for that request
      await client.query(
        `UPDATE public.quotes
         SET status = 'rejected'
         WHERE request_id = $1 AND quote_id <> $2`,
        [request_id, quoteId]
      );

      // 6) Update request status
      await client.query(
        `UPDATE public.requests
         SET status = 'accepted'
         WHERE request_id = $1`,
        [request_id]
      );

      // 7) Create the order
      const order = await client.query(
        `INSERT INTO public.orders (request_id, quote_id, customer_id, tailor_id, status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING order_id, request_id, quote_id, customer_id, tailor_id, status, created_at`,
        [request_id, quoteId, customer_id, tailor_id]
      );

      await client.query("COMMIT");
      return res.status(201).json({
        message: "Quote accepted and order created",
        data: order.rows[0],
      });
    } catch (err) {
      await client.query("ROLLBACK");

      // Handle unique constraint (one order per request)
      if (err.code === "23505") {
        return res.status(409).json({ error: "Order already exists for this request" });
      }

      console.error("ACCEPT QUOTE ERROR:", err);
      return res.status(500).json({ error: "Server error" });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
