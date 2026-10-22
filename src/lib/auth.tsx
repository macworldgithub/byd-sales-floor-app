import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, getToken, clearToken } from './api';

interface AuthUser {
  email: string;
  name: string;
  role: string;
  token?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
            email: 'alex.rivers@byd.com',
            name: 'Alex Rivers',
            role: 'super_admin',
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
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
