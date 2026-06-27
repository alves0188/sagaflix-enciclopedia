import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sagaflix_user');
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const withTimeout = (promise, ms = 8000) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de conexão Supabase')), ms))
      ]);
    };

    const fetchUser = async () => {
      const savedUser = localStorage.getItem('sagaflix_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        try {
          const { data: profile } = await withTimeout(
            supabase.from('profiles').select('*').eq('id', parsed.id).single(),
            8000
          );
          if (profile) {
            const userObj = {
              id: profile.id, role: profile.role, name: profile.name, nickname: profile.nickname,
              email: profile.email, avatar: profile.avatar_url,
              favorites: profile.favorites,
              readingStatus: profile.reading_status,
              completedTutorials: profile.completed_tutorials || []
            };
            
            // Hardcoded role overrides for specific users
            if (userObj.email === 'suporte@sagaflix.com.br') userObj.role = 'admin';
            else if (userObj.email === 'alves0188@gmail.com') userObj.role = 'author';
            else if (userObj.email === 'alves0188@icloud.com') userObj.role = 'reader';

            setCurrentUser(userObj);
            localStorage.setItem('sagaflix_user', JSON.stringify(userObj));
          }
        } catch (err) {
          console.error("Error fetching profile", err);
        }
      }
      setLoading(false);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          localStorage.removeItem('sagaflix_user');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = (user) => {
    setCurrentUser(user);
    localStorage.setItem('sagaflix_user', JSON.stringify(user));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('sagaflix_user');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
