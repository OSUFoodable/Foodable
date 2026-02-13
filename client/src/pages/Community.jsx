import { useEffect, useMemo, useState } from "react";
import { createCommunityPost, getPosts } from "../services/communityPostsService";
import CreatePostDialog from "../components/CreatePostDialog";
import PostsList from "../components/PostsList";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

export default function Community() {
  const { user, logout } = useContext(AuthContext);
  if (!user) return <p>Loading user information...</p>;

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function load() {
    setError("");
    setIsLoading(true);
    try {
      const data = await getPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setError("failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(payload) {
    const newPost = await createCommunityPost(payload);
    setPosts((prev) => [newPost, ...prev]);
  }

  const countLabel = useMemo(() => {
    if (isLoading) return "";
    if (!posts.length) return "0 posts";
    return posts.length === 1 ? "1 post" : `${posts.length} posts`;
  }, [isLoading, posts.length]);

  return (
    <div className="community-page">
      <h2>Welcome, {user["cognito:username"]}!</h2>
      <div className="community-shell">
        <header className="community-header">
          <div className="community-header-left">
            <div className="community-title-row">
              <h1 className="community-title">Community</h1>
              <span className="community-count">{countLabel}</span>
            </div>
            <p className="community-subtitle">
              share recipes, tips, grocery wins, anything helpful
            </p>
          </div>

          <div className="community-header-right">
            <button
              type="button"
              className="community-btn community-btn-ghost"
              onClick={load}
            >
              Refresh
            </button>

            <button
              type="button"
              className="community-btn community-btn-primary"
              onClick={() => setIsDialogOpen(true)}
            >
              New post
            </button>
          </div>
        </header>

        <main className="community-feed">
          <PostsList posts={posts} isLoading={isLoading} error={error} />
        </main>
      </div>

      <CreatePostDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
