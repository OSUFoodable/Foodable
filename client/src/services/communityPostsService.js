// client/src/services/communityPostsService.js
// local storage only for now, later we can swap to apiFetch

const STORAGE_KEY = "foodable.community.posts.v1";

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadAll() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = safeParse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function saveAll(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function seedIfEmpty() {
  const current = loadAll();
  if (current.length) return;

  const seeded = [
    {
      id: crypto.randomUUID(),
      title: "quick high protein lunch ideas",
      body: "any go to meals when you have chicken, rice, and random veggies, trying to keep it cheap too",
      author: "Anonymous",
      tags: ["budget", "protein"],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: "best way to use leftovers",
      body: "how do you plan meals when you only have half ingredients left, i always waste stuff",
      author: "Sameer",
      tags: ["planning"],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    },
  ];

  saveAll(seeded);
}

export async function getPosts() {
  seedIfEmpty();
  const posts = loadAll();
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return posts;
}

export async function createCommunityPost({ title, body, author, tags }) {
  const cleanBody = String(body || "").trim();
  if (!cleanBody) throw new Error("post text is required");

  const post = {
    id: crypto.randomUUID(),
    title: String(title || "").trim(),
    body: cleanBody,
    author: String(author || "").trim() || "Anonymous",
    tags: Array.isArray(tags)
      ? tags
          .map((t) => String(t).trim())
          .filter(Boolean)
          .slice(0, 8)
      : [],
    createdAt: new Date().toISOString(),
  };

  const posts = loadAll();
  posts.unshift(post);
  saveAll(posts);

  return post;
}
