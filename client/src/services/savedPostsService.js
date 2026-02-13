// src/services/savedPostsService.js
function getUsername(user) {
  return user?.["cognito:username"] || "guest";
}

function storageKey(user) {
  return `savedPosts:${getUsername(user)}`;
}

export function loadSavedPosts(user) {
  try {
    const raw = localStorage.getItem(storageKey(user));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isPostSaved(user, postId) {
  const saved = loadSavedPosts(user);
  return saved.some((p) => p.id === postId);
}

export function savePost(user, post) {
  const saved = loadSavedPosts(user);
  const postId = post.id;

  if (!postId) return saved; // safety

  // avoid duplicates
  if (saved.some((p) => (p.id) === postId)) return saved;

  const updated = [post, ...saved];
  localStorage.setItem(storageKey(user), JSON.stringify(updated));
  return updated;
}

export function unsavePost(user, postId) {
  const saved = loadSavedPosts(user);
  const updated = saved.filter((p) => (p.id) !== postId);
  localStorage.setItem(storageKey(user), JSON.stringify(updated));
  return updated;
}