import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Single user mode - no authentication needed
const defaultUser: User = {
  id: 1,
  email: 'user@budgetmanager.local',
  name: 'Budget Manager User'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(defaultUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Always set default user - no authentication needed
    setUser(defaultUser);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // No-op - authentication disabled
    setUser(defaultUser);
  };

  const register = async (email: string, password: string, name: string) => {
    // No-op - authentication disabled
    setUser(defaultUser);
  };

  const logout = () => {
    // No-op - authentication disabled
    // User stays logged in
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: true,
        login,
        register,
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
