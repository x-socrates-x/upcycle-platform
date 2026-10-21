import { useState } from "react";
import { apiFetch } from "../api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("alice@test.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", fontFamily: "system-ui" }}>
      <h2>Upcycle Web</h2>
      <p>Login to use the API</p>

      <form onSubmit={submit}>
        <label>Email</label>
        <input
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div style={{ color: "crimson", marginBottom: 10 }}>{error}</div>}

        <button style={{ padding: "10px 14px" }}>Login</button>
      </form>

      <div style={{ marginTop: 12, color: "#555", fontSize: 12 }}>
        Demo accounts: <b>alice@test.com</b> (customer), <b>tailor@test.com</b> (tailor) — password{" "}
        <b>Password123!</b>
      </div>
    </div>
  );
}