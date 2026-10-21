import { useState } from "react";
import Login from "./components/Login";
import NavBar from "./components/NavBar";

import PostsPage from "./pages/PostsPage";
import RequestsPage from "./pages/RequestsPage";
import OrdersPage from "./pages/OrdersPage";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const [tab, setTab] = useState("posts"); // "posts" | "requests" | "orders"

  function onLogin(t, u) {
    setToken(t);
    setUser(u);
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
  }

  function onLogout() {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setTab("posts");
  }

  if (!token) return <Login onLogin={onLogin} />;

  return (
    <div style={{ fontFamily: "system-ui" }}>
      <NavBar user={user} tab={tab} setTab={setTab} onLogout={onLogout} />

      {tab === "posts" && <PostsPage token={token} user={user} />}
      {tab === "requests" && <RequestsPage token={token} user={user} />}
      {tab === "orders" && <OrdersPage token={token} user={user} />}
    </div>
  );
}
