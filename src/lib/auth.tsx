import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, getToken, clearToken, onSessionExpired, setApiSite } from './api';

export interface AuthUser {
  id?: string;
  email: string;
  name: string;
  role: string;
  location?: string;
  phone?: string;
  token?: string;
  allowedSites?: string[];
  allSites?: boolean;
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

const resolveInitialSite = (u: any): string => {
  const raw = u?.site || u?.active_site;
  if (raw && raw !== 'BYD Dealership') return raw;
  if (Array.isArray(u?.allowed_sites) && u.allowed_sites.length > 0) return u.allowed_sites[0];
  if (u?.all_sites || ['super_admin', 'admin', 'manager', 'sales_manager'].includes(u?.role)) return 'All Sites';
  return 'BYD Melbourne City';
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { onSessionExpired(() => setUser(null)); return () => onSessionExpired(); }, []);

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
              id: u.id || u._id,
              email: u.email,
              name: u.name || 'Sales Consultant',
              role: u.role || 'sales_consultant',
              location: resolveInitialSite(u),
              phone: u.phone || u.contractor_phone || '',
              token,
              allowedSites: u.allowed_sites,
              allSites: u.all_sites,
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
      id: u?.id || u?._id,
      email: u?.email || email,
      name: u?.name || 'Sales Consultant',
      role: u?.role || 'sales_consultant',
      location: resolveInitialSite(u),
      phone: u?.phone || u?.contractor_phone || '',
      token: res.token,
      allowedSites: u?.allowed_sites,
      allSites: u?.all_sites,
    };
    setUser(userData);
  };

  const logout = async () => {
    await authApi.logout();
    setApiSite('');
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
