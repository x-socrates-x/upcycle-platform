export default function NavBar({ user, tab, setTab, onLogout }) {
  function TabButton({ id, label }) {
    const active = tab === id;
    return (
      <button
        onClick={() => setTab(id)}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #ddd",
          background: active ? "#eee" : "white",
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <div
      style={{
        maxWidth: 920,
        margin: "20px auto 0",
        padding: "12px 12px",
        border: "1px solid #ddd",
        borderRadius: 12,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontWeight: 700 }}>Upcycle Web</div>
        <div style={{ color: "#555", fontSize: 12 }}>
          {user?.full_name} ({user?.role})
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <TabButton id="posts" label="Posts" />
        <TabButton id="requests" label="Requests" />
        <TabButton id="orders" label="Orders" />
      </div>

      <button onClick={onLogout} style={{ padding: "8px 12px" }}>
        Logout
      </button>
    </div>
  );
}