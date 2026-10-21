import { useEffect, useState } from "react";
import { apiFetch } from "../api";

export default function RequestsPage({ token, user }) {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  // customer create request
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // quote viewing per request
  const [openQuotes, setOpenQuotes] = useState({});
  const [quotesByRequest, setQuotesByRequest] = useState({});

  // tailor quote draft per request
  const [quoteDraft, setQuoteDraft] = useState({}); // requestId -> {price, message}

  async function loadRequests() {
    setError("");
    try {
      const res = await apiFetch("/requests", { token }); // requires auth in your backend
      setRequests(res.data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadQuotes(requestId) {
    setError("");
    try {
      const res = await apiFetch(`/requests/${requestId}/quotes`, { token });
      setQuotesByRequest((prev) => ({ ...prev, [requestId]: res.data }));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function createRequest(e) {
    e.preventDefault();
    setError("");
    try {
      await apiFetch("/requests", {
        method: "POST",
        token,
        body: { title, description }, // customer_id comes from token server-side
      });
      setTitle("");
      setDescription("");
      await loadRequests();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitQuote(requestId) {
    const price = Number(quoteDraft[requestId]?.price_gbp || "");
    const message = quoteDraft[requestId]?.message || "";

    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid price (>= 0).");
      return;
    }

    setError("");
    try {
      await apiFetch(`/requests/${requestId}/quotes`, {
        method: "POST",
        token,
        body: { price_gbp: price, message }, // tailor_id from token server-side
      });
      setQuoteDraft((prev) => ({ ...prev, [requestId]: { price_gbp: "", message: "" } }));
      await loadQuotes(requestId);
      await loadRequests();
    } catch (err) {
      setError(err.message);
    }
  }

  async function acceptQuote(quoteId, requestId) {
    setError("");
    try {
      await apiFetch(`/quotes/${quoteId}/accept`, { method: "PATCH", token });
      await loadQuotes(requestId);
      await loadRequests();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 920, margin: "16px auto", padding: "0 12px" }}>
      <h3 style={{ marginTop: 16 }}>Requests</h3>

      {user?.role === "customer" && (
        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, marginTop: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Create a request</div>
          <form onSubmit={createRequest}>
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: 10, marginBottom: 8 }}
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: 10 }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button disabled={!title.trim() || description.trim().length < 10}>Submit</button>
              <button type="button" onClick={loadRequests}>Refresh</button>
            </div>
          </form>
        </div>
      )}

      {error && <div style={{ color: "crimson", marginTop: 10 }}>{error}</div>}

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        {requests.map((r) => (
          <div key={r.request_id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: "#666" }}>
              Request #{r.request_id} • status: <b>{r.status}</b> • {new Date(r.created_at).toLocaleString()}
            </div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>{r.title}</div>
            <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{r.description}</div>

            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={async () => {
                  const next = !openQuotes[r.request_id];
                  setOpenQuotes((prev) => ({ ...prev, [r.request_id]: next }));
                  if (next) await loadQuotes(r.request_id);
                }}
              >
                {openQuotes[r.request_id] ? "Hide quotes" : "View quotes"}
              </button>

              {user?.role === "tailor" && r.status === "open" && (
                <button type="button" onClick={() => submitQuote(r.request_id)}>
                  Submit quote
                </button>
              )}
            </div>

            {user?.role === "tailor" && r.status === "open" && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #eee" }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Your quote</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    placeholder="Price (GBP)"
                    value={quoteDraft[r.request_id]?.price_gbp ?? ""}
                    onChange={(e) =>
                      setQuoteDraft((prev) => ({
                        ...prev,
                        [r.request_id]: { ...(prev[r.request_id] || {}), price_gbp: e.target.value },
                      }))
                    }
                    style={{ padding: 8, width: 140 }}
                  />
                  <input
                    placeholder="Message (optional)"
                    value={quoteDraft[r.request_id]?.message ?? ""}
                    onChange={(e) =>
                      setQuoteDraft((prev) => ({
                        ...prev,
                        [r.request_id]: { ...(prev[r.request_id] || {}), message: e.target.value },
                      }))
                    }
                    style={{ padding: 8, flex: 1, minWidth: 240 }}
                  />
                </div>
              </div>
            )}

            {openQuotes[r.request_id] && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #eee" }}>
                <div style={{ fontWeight: 700 }}>Quotes</div>
                <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                  {(quotesByRequest[r.request_id] || []).map((q) => (
                    <div key={q.quote_id} style={{ background: "#fafafa", padding: 10, borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        Quote #{q.quote_id} • status: <b>{q.status}</b> • £{q.price_gbp}
                      </div>
                      {q.message && <div style={{ marginTop: 6 }}>{q.message}</div>}

                      {user?.role === "customer" && r.status === "open" && q.status === "pending" && (
                        <button
                          style={{ marginTop: 8 }}
                          type="button"
                          onClick={() => acceptQuote(q.quote_id, r.request_id)}
                        >
                          Accept quote
                        </button>
                      )}
                    </div>
                  ))}

                  {(quotesByRequest[r.request_id] || []).length === 0 && (
                    <div style={{ color: "#777" }}>No quotes yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {requests.length === 0 && <div style={{ color: "#777" }}>No requests found.</div>}
      </div>
    </div>
  );
}