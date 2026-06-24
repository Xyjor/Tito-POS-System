import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    const saved = localStorage.getItem("shop_pos_user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("shop_pos_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("shop_pos_user");
    }
  }, [user]);

  function logout() {
    setUserState(null);
  }

  function setUser(newUser: User | null) {
    setUserState(newUser);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
