import { useEffect, useState } from "react";
import { apiFetch } from "../api";

export default function OrdersPage({ token, user }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  async function loadOrders() {
    setError("");
    try {
      const res = await apiFetch("/orders", { token });
      setOrders(res.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateStatus(orderId, status) {
    setError("");
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await loadOrders();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 920, margin: "16px auto", padding: "0 12px" }}>
      <h3 style={{ marginTop: 16 }}>Orders</h3>

      <button type="button" onClick={loadOrders} style={{ marginTop: 6 }}>
        Refresh
      </button>

      {error && <div style={{ color: "crimson", marginTop: 10 }}>{error}</div>}

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        {orders.map((o) => (
          <div key={o.order_id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: "#666" }}>
              Order #{o.order_id} • status: <b>{o.status}</b> • {new Date(o.created_at).toLocaleString()}
            </div>

            <div style={{ marginTop: 8 }}>
              <div>
                <b>Request:</b> {o.request_title} (#{o.request_id})
              </div>
              <div>
                <b>Quote:</b> #{o.quote_id} • £{o.price_gbp}
              </div>
              <div style={{ color: "#555", fontSize: 12, marginTop: 4 }}>
                Customer: {o.customer_name} • Tailor: {o.tailor_name}
              </div>
            </div>

            {user?.role === "tailor" && (
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={() => updateStatus(o.order_id, "active")}>
                  Mark Active
                </button>
                <button type="button" onClick={() => updateStatus(o.order_id, "completed")}>
                  Mark Completed
                </button>
                <button type="button" onClick={() => updateStatus(o.order_id, "cancelled")}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}

        {orders.length === 0 && <div style={{ color: "#777" }}>No orders found.</div>}
      </div>
    </div>
  );
}