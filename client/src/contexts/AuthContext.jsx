import { createContext } from "react";

/**
 * TEMPORARY AUTH CONTEXT
 * Until Cognito integration is finished.
 * Prevents Community/Profile from crashing.
 */

export const AuthContext = createContext({
  user: {
    "cognito:username": "dev-user"
  },
  logout: () => {},
});