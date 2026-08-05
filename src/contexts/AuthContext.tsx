import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { getUsers, saveUsers, generateId } from '../utils/storage';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sessionUser = sessionStorage.getItem('meditrack_session');
    if (sessionUser) {
      setUser(JSON.parse(sessionUser));
    }
  }, []);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    const users = getUsers();
    const identifierLower = identifier.toLowerCase().trim();
    const encodedPassword = btoa(password);

    const found = users.find((u) => {
      const emailMatch = u.email.toLowerCase() === identifierLower;
      const phoneMatch = u.phone.replace(/[\s\-\(\)]/g, '') === identifier.replace(/[\s\-\(\)]/g, '');
      const passwordMatch = u.password === encodedPassword;
      return (emailMatch || phoneMatch) && passwordMatch;
    });

    if (found) {
      const updated = { ...found, lastLogin: new Date().toISOString() };
      const updatedUsers = users.map((u) => (u.id === updated.id ? updated : u));
      saveUsers(updatedUsers);
      setUser(updated);
      sessionStorage.setItem('meditrack_session', JSON.stringify(updated));
      return true;
    }
    return false;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone: string,
    role: 'user' | 'admin' = 'user'
  ): Promise<boolean> => {
    const users = getUsers();
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return false;
    }
    const newUser: User = {
      id: generateId(),
      name,
      email,
      phone,
      password: btoa(password),
      role: role,
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);
    setUser(newUser);
    sessionStorage.setItem('meditrack_session', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('meditrack_session');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    const users = getUsers();
    saveUsers(users.map((u) => (u.id === updated.id ? updated : u)));
    setUser(updated);
    sessionStorage.setItem('meditrack_session', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, updateUser, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
