"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface UserProfile {
  email: string;
  name: string;
  plan: string;
  currency: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setUser({
        email: "dev@quantara.io",
        name: "Dev Trader",
        plan: "Pro Plan",
        currency: "INR",
      });
    } else {
      setUser(null);
    }
  }, [isAuthenticated]);

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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
