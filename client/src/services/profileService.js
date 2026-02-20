// profileService.js

const DEFAULT_PREFS = {
  vegetarian: false,
  vegan: false,
  pescatarian: false,
};

function getUsername(user) {
  return (
    user?.["cognito:username"] ||
    user?.username ||
    user?.email ||
    "guest"
  );
}

function storageKey(user) {
  return `dietPrefs_v1:${getUsername(user)}`;
}

export function loadDietPrefs(user) {
  try {
    const saved = localStorage.getItem(storageKey(user));
    if (!saved) return DEFAULT_PREFS;

    // merge with defaults so new prefs don't break old storage
    return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveDietPrefs(user, prefs) {
  localStorage.setItem(storageKey(user), JSON.stringify(prefs));
}