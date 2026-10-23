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
          // Restore from stored token - in a real app you'd validate the token
          setUser({
            email: 'admin@byd.com',
            name: 'Alex Rivers',
            role: 'super_admin',
            location: 'Melbourne CBD',
            phone: '+61 412 345 678',
            token,
          });
        }
      } catch (err) {
        // Token check failed
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await authApi.login(email, password);
      const userData: AuthUser = {
        email: res.user?.email || email,
        name: res.user?.name || 'Alex Rivers',
        role: res.user?.role || 'super_admin',
        location: 'Melbourne CBD',
        phone: '+61 412 345 678',
        token: res.token,
      };
      setUser(userData);
    } catch (err: any) {
      // Demo fallback: accept any login for demo purposes
      if (email && password) {
        const userData: AuthUser = {
          email,
          name: 'Alex Rivers',
          role: 'super_admin',
          location: 'Melbourne CBD',
          phone: '+61 412 345 678',
        };
        setUser(userData);
      } else {
        throw err;
      }
    }
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
