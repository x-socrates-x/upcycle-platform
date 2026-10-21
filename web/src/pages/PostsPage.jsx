import { useEffect, useState } from "react";
import { apiFetch } from "../api";

export default function PostsPage({ token }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const [openComments, setOpenComments] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentDraft, setCommentDraft] = useState({});

  async function loadPosts() {
    setError("");
    try {
      const res = await apiFetch("/posts");
      setPosts(res.data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadComments(postId) {
    setError("");
    try {
      const res = await apiFetch(`/posts/${postId}/comments`);
      setCommentsByPost((prev) => ({ ...prev, [postId]: res.data }));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function createPost(e) {
    e.preventDefault();
    setError("");
    try {
      await apiFetch("/posts", { method: "POST", body: { content }, token });
      setContent("");
      await loadPosts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleLike(postId) {
    setError("");
    try {
      await apiFetch(`/posts/${postId}/likes`, { method: "POST", token });
      await loadPosts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addComment(postId) {
    const text = (commentDraft[postId] || "").trim();
    if (!text) return;

    setError("");
    try {
      await apiFetch(`/posts/${postId}/comments`, {
        method: "POST",
        token,
        body: { content: text },
      });

      setCommentDraft((prev) => ({ ...prev, [postId]: "" }));
      await loadComments(postId);
      await loadPosts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 920, margin: "16px auto", padding: "0 12px" }}>
      <h3 style={{ marginTop: 16 }}>Community Posts</h3>

      <form onSubmit={createPost} style={{ marginTop: 10 }}>
        <textarea
          placeholder="Write a post..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: 10 }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button disabled={!content.trim()}>Post</button>
          <button type="button" onClick={loadPosts}>
            Refresh
          </button>
        </div>
      </form>

      {error && <div style={{ color: "crimson", marginTop: 10 }}>{error}</div>}

      <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
        {posts.map((p) => (
          <div key={p.post_id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: "#666" }}>
              #{p.post_id} • {p.author_name} • {new Date(p.created_at).toLocaleString()}
            </div>

            <div style={{ margin: "8px 0", whiteSpace: "pre-wrap" }}>{p.content}</div>

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={() => toggleLike(p.post_id)}>Like/Unlike</button>

              <button
                type="button"
                onClick={async () => {
                  const next = !openComments[p.post_id];
                  setOpenComments((prev) => ({ ...prev, [p.post_id]: next }));
                  if (next) await loadComments(p.post_id);
                }}
              >
                {openComments[p.post_id] ? "Hide comments" : "Show comments"}
              </button>

              <span style={{ color: "#555" }}>
                👍 {p.like_count} • 💬 {p.comment_count}
              </span>
            </div>

            {openComments[p.post_id] && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #eee" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    style={{ flex: 1, padding: 8 }}
                    placeholder="Write a comment..."
                    value={commentDraft[p.post_id] || ""}
                    onChange={(e) =>
                      setCommentDraft((prev) => ({ ...prev, [p.post_id]: e.target.value }))
                    }
                  />
                  <button type="button" onClick={() => addComment(p.post_id)}>
                    Comment
                  </button>
                </div>

                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  {(commentsByPost[p.post_id] || []).map((c) => (
                    <div key={c.comment_id} style={{ background: "#fafafa", padding: 8, borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {c.author_name} • {new Date(c.created_at).toLocaleString()}
                      </div>
                      <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{c.content}</div>
                    </div>
                  ))}
                  {(commentsByPost[p.post_id] || []).length === 0 && (
                    <div style={{ color: "#777" }}>No comments yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {posts.length === 0 && <div style={{ color: "#777" }}>No posts yet.</div>}
      </div>
    </div>
  );
}