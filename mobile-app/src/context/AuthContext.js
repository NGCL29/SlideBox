import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.setUnauthorizedHandler(() => setUser(null));
    api.loadSession().then((u) => { setUser(u); setReady(true); });
  }, []);

  const signIn = useCallback(async (email, password) => setUser(await api.login(email, password)), []);
  const signUp = useCallback(async (data) => setUser(await api.register(data)), []);
  const signOut = useCallback(async () => { await api.logout(); setUser(null); }, []);

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signUp, signOut, isInstructor: user?.role === 'instructor' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
