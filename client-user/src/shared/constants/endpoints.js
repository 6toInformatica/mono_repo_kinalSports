export const ENDPOINTS = {
  AUTH:
    process.env.EXPO_PUBLIC_AUTH_URL ||
    "http://localhost:3000/kinal-sports/v1/auth",
  USER:
    process.env.EXPO_PUBLIC_USER_URL || "http://localhost:3001/kinal-sports/v1",
};
