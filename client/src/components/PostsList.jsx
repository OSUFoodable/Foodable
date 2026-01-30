function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
}

function getInitial(name) {
  const s = String(name || "").trim();
  if (!s) return "A";
  return s[0].toUpperCase();
}

function PostCard({ post }) {
  return (
    <article className="community-card">
      <div className="community-card-header">
        <div className="community-avatar" aria-hidden="true">
          {getInitial(post.author)}
        </div>

        <div className="community-card-meta">
          <div className="community-card-author">
            {post.author || "Anonymous"}
          </div>
          <div className="community-card-date">{formatDate(post.createdAt)}</div>
        </div>
      </div>

      <div className="community-card-content">
        <div className="community-card-title">
          {post.title?.trim() ? post.title : "untitled"}
        </div>
        <div className="community-card-body">{post.body}</div>

        {Array.isArray(post.tags) && post.tags.length ? (
          <div className="community-tags">
            {post.tags.map((t) => (
              <span className="community-tag" key={`${post.id}-${t}`}>
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function PostsList({ posts, isLoading, error }) {
  if (isLoading) return <div className="community-muted">Loading posts...</div>;
  if (error) return <div className="community-error">{error}</div>;
  if (!posts.length) {
    return <div className="community-muted">No posts yet, be the first one.</div>;
  }

  return (
    <div className="community-list">
      {posts.map((p) => (
        <PostCard key={p.id || p._id} post={p} />
      ))}
    </div>
  );
}
