// Display-friendly name for the user. For pools that allow email-based sign-up,
// Cognito sets `cognito:username` to a UUID, so we fall through to email
// (returning just the local part for compactness) before that as a last resort.
export function getDisplayName(user) {
  if (!user) return "guest";
  return (
    user.name ||
    user.preferred_username ||
    user.given_name ||
    user.nickname ||
    emailLocalPart(user.email) ||
    user["cognito:username"] ||
    "guest"
  );
}

export function getInitial(user) {
  return (getDisplayName(user)?.[0] || "U").toUpperCase();
}

// Stable per-user key for client-side caches (localStorage keys, etc.).
// Prefers cognito:username because it's the same string across renames;
// not intended for display.
export function getUsername(user) {
  return (
    user?.["cognito:username"] ||
    user?.username ||
    user?.email ||
    "guest"
  );
}

function emailLocalPart(email) {
  if (!email) return "";
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}
