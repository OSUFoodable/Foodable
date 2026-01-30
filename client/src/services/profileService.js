// profileService.js
const KEY = "dietPrefs_v1";

const DEFAULT_PREFS = {
  vegetarian: false,
  vegan: false,
  pescatarian: false,
};

export function loadDietPrefs() {
  try {
    const saved = localStorage.getItem(KEY);
    if (!saved) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveDietPrefs(prefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}