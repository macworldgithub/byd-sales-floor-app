import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, getToken, clearToken } from './api';

export interface AuthUser {
  email: string;
  name: string;
  role: string;
  location?: string;
  phone?: string;
  token?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken();
        if (token) {
          // Validate stored token against the live backend
          const res = await authApi.getMe();
          if (res?.success && res?.data) {
            const u = res.data;
            setUser({
              email: u.email,
              name: u.name || 'Sales Consultant',
              role: u.role || 'sales_consultant',
              location: u.site || u.active_site || 'BYD Dealership',
              phone: u.phone || u.contractor_phone || '',
              token,
            });
          } else {
            // Token rejected by backend
            await clearToken();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        // Expired or invalid token
        await clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // Strictly authenticate against the backend. No demo fallback bypass.
    const res = await authApi.login(email, password);
    const u = res.user;
    const userData: AuthUser = {
      email: u?.email || email,
      name: u?.name || 'Sales Consultant',
      role: u?.role || 'sales_consultant',
      location: u?.site || u?.active_site || 'BYD Dealership',
      phone: u?.phone || u?.contractor_phone || '',
      token: res.token,
    };
    setUser(userData);
  };

  const logout = async () => {
    await clearToken();
    setUser(null);
  };

  const updateUser = (data: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
