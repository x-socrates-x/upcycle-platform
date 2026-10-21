const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { z } = require("zod");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/auth");

// GET /api/v1/orders
router.get("/", requireAuth, async (req, res) => {
  try {
    let where = "";
    let params = [];

    if (req.user.role === "customer") {
      where = "WHERE o.customer_id = $1";
      params = [req.user.user_id];
    } else if (req.user.role === "tailor") {
      where = "WHERE o.tailor_id = $1";
      params = [req.user.user_id];
    } // else admin: no filter

    const result = await db.query(
      `SELECT
         o.order_id,
         o.status,
         o.created_at,
         o.request_id,
         r.title AS request_title,
         o.quote_id,
         q.price_gbp,
         o.customer_id,
         cu.full_name AS customer_name,
         o.tailor_id,
         tu.full_name AS tailor_name
       FROM public.orders o
       JOIN public.requests r ON r.request_id = o.request_id
       LEFT JOIN public.quotes q ON q.quote_id = o.quote_id
       JOIN public.users cu ON cu.user_id = o.customer_id
       JOIN public.users tu ON tu.user_id = o.tailor_id
       ${where}
       ORDER BY o.created_at DESC`,
      params
    );

    return res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});


// GET /api/v1/orders/:id
router.get("/:id", requireAuth, async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ error: "Invalid order id" });
  }

  try {
    const result = await db.query(
      `SELECT
         o.order_id,
         o.status,
         o.created_at,
         o.request_id,
         r.title AS request_title,
         r.description AS request_description,
         o.quote_id,
         q.price_gbp,
         q.message AS quote_message,
         o.customer_id,
         cu.full_name AS customer_name,
         o.tailor_id,
         tu.full_name AS tailor_name
       FROM public.orders o
       JOIN public.requests r ON r.request_id = o.request_id
       LEFT JOIN public.quotes q ON q.quote_id = o.quote_id
       JOIN public.users cu ON cu.user_id = o.customer_id
       JOIN public.users tu ON tu.user_id = o.tailor_id
       WHERE o.order_id = $1`,
      [orderId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = result.rows[0];

    // Ownership rules
    if (req.user.role === "customer" && order.customer_id !== req.user.user_id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (req.user.role === "tailor" && order.tailor_id !== req.user.user_id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.json({ data: order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/v1/orders/:id/status
router.patch("/:id/status", requireAuth, requireRole("tailor", "admin"), async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ error: "Invalid order id" });
  }

  const schema = z.object({
    status: z.enum(["active", "completed", "cancelled"]),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parsed.error.issues,
    });
  }

  try {
    const result = await db.query(
      `UPDATE public.orders
       SET status = $1
       WHERE order_id = $2
       RETURNING order_id, request_id, quote_id, status, created_at`,
      [parsed.data.status, orderId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;