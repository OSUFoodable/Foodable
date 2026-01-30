import { useState } from "react";

export default function CreatePostForm({ onCreate, onCancel }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [tags, setTags] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = body.trim().length > 0 && !isSubmitting;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!body.trim()) {
      setError("post text is required");
      return;
    }

    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);

    try {
      setIsSubmitting(true);

      await onCreate?.({
        title: title.trim(),
        body: body.trim(),
        author: author.trim(),
        tags: tagList,
      });

      setTitle("");
      setBody("");
      setAuthor("");
      setTags("");
    } catch (err) {
      setError(err?.message || "something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="community-form">
      <label className="community-label">
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="optional"
          maxLength={120}
          className="community-input"
        />
      </label>

      <label className="community-label">
        Post
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="what do you want to share"
          rows={5}
          maxLength={2000}
          className="community-textarea"
        />
      </label>

      <div className="community-grid-2">
        <label className="community-label">
          Name
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="optional"
            maxLength={60}
            className="community-input"
          />
        </label>

        <label className="community-label">
          Tags
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="comma separated"
            className="community-input"
          />
        </label>
      </div>

      {error ? <div className="community-error">{error}</div> : null}

      <div className="community-form-actions">
        <button
          type="button"
          className="community-btn community-btn-ghost"
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="community-btn community-btn-primary"
          disabled={!canSubmit}
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
