import { useEffect } from "react";
import CreatePostForm from "./CreatePostForm";

export default function CreatePostDialog({ open, onClose, onCreate }) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="community-modal-overlay" onMouseDown={onClose}>
      <div
        className="community-modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="create post dialog"
      >
        <div className="community-modal-header">
          <div>
            <div className="community-modal-title">Create post</div>
            <div className="community-modal-subtitle">
              keep it simple for now, no editing or reporting yet
            </div>
          </div>

          <button
            type="button"
            className="community-btn community-btn-icon"
            onClick={onClose}
            aria-label="close dialog"
            title="close"
          >
            ✕
          </button>
        </div>

        <CreatePostForm
          onCreate={async (payload) => {
            await onCreate(payload);
            onClose?.();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
