export function getUsername(user) {
  return (
    user?.["cognito:username"] ||
    user?.username ||
    user?.email ||
    "guest"
  );
}