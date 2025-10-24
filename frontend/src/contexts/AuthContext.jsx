// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext({
  user: null,
  setUser: () => {},
  loading: true,
  fetchMe: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function getCsrfToken() {
    return localStorage.getItem("csrfToken") || "";
  }

  // ✅ Fetch current logged-in user
  async function fetchMe() {
    try {
      const csrfToken = localStorage.getItem("csrfToken");
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "X-CSRF-TOKEN": csrfToken || "",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else if (res.status === 401 || res.status === 422) {
        // 👇 Normal: not logged in OR expired token → no console error
        setUser(null);
      } else {
        // Unexpected cases only log
        console.warn("Unexpected /me error:", res.status, await res.text());
        setUser(null);
      }
    } catch (err) {
      // Network-level errors only
      console.error("fetchMe network error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  // ✅ Logout function
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRF-TOKEN": getCsrfToken(),
        },
      });
    } catch (err) {
      console.error("logout error:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("csrfToken");
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, fetchMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
