import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "STAFF" | "USER";
}






interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /*
   * Restore authentication when the page is refreshed.
   */
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setUser(null);
          return;
        }

        const result = await response.json();

        setUser(result.user);
      } catch (error) {
        console.error("Failed to restore session:", error);

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  /*
   * Real backend login.
   */
  const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const result = await response.json();

  console.log("LOGIN RESPONSE:", result);

  if (!response.ok) {
    throw new Error(
      result?.message ||
      result?.error ||
      "Invalid email or password"
    );
  }

  // Your backend uses sendSuccess(), so the actual data
  // may be inside result.data.
  const data = result.data ?? result;

  const token = data.token ?? data.accessToken;

  if (!token) {
    console.error("LOGIN RESPONSE DOES NOT CONTAIN TOKEN:", result);
    throw new Error("Login succeeded but no authentication token was returned");
  }

  localStorage.setItem("accessToken", token);

  if (data.refreshToken) {
    localStorage.setItem("refreshToken", data.refreshToken);
  }

  setUser(data.user);
};
  

  /*
   * Logout from backend and clear local session.
   */
  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refreshToken,
          }),
        });
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};