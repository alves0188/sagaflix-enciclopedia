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
    const handleUserSession = async (session) => {
      if (!session || !session.user) {
        setCurrentUser(null);
        localStorage.removeItem('sagaflix_user');
        setLoading(false);
        return;
      }

      const user = session.user;
      try {
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Perfil não encontrado -> criar perfil automático de Leitor (ex: Login com Google/Apple)
          const newProfile = {
            id: user.id,
            email: user.email,
            role: 'reader',
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            nickname: 'leitor_' + Math.random().toString(36).substring(7),
            bio: '',
            writing_style: '',
            avatar_url: user.user_metadata?.avatar_url || ''
          };

          const { error: insertError } = await supabase.from('profiles').insert(newProfile);
          if (insertError) {
            console.error('Erro ao criar perfil social:', insertError);
          } else {
            profile = { ...newProfile, completed_tutorials: [], favorites: [], reading_status: {} };
            
            profile = { ...newProfile, completed_tutorials: [], favorites: [], reading_status: {}, status: 'active' };
          }
        }

        if (profile) {
          let tastes = [];
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              const res = await fetch((window.API_BASE_URL || '') + '/api/profile/tastes', {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`
                }
              });
              if (res.ok) {
                const tastesData = await res.json();
                tastes = tastesData.tastes || [];
              }
            }
          } catch (tastesErr) {
            console.error("Erro ao carregar gostos do perfil:", tastesErr);
          }

          const userObj = {
            id: profile.id,
            role: profile.role || 'reader',
            name: profile.name,
            nickname: profile.nickname,
            email: profile.email,
            avatar: profile.avatar_url,
            favorites: profile.favorites || [],
            readingStatus: profile.reading_status || {},
            completedTutorials: profile.completed_tutorials || [],
            tastes: tastes
          };
          
          if (userObj.email === 'suporte@sagaflix.com.br') userObj.role = 'admin';

          setCurrentUser(userObj);
          localStorage.setItem('sagaflix_user', JSON.stringify(userObj));

          // AUTO-ATIVAR: Garante que qualquer usuário logado com sucesso esteja 'active' na tabela profiles
          try {
            if (profile.status !== 'active') {
              await supabase.from('profiles').update({ status: 'active' }).eq('id', user.id);
              profile.status = 'active';
            }
          } catch (dbErr) {
            console.error("Erro ao auto-ativar usuário logado:", dbErr);
          }
        }
      } catch (err) {
        console.error("Erro no carregamento do perfil:", err);
      } finally {
        setLoading(false);
      }
    };

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await handleUserSession(session);
      } catch (err) {
        console.error("Erro ao pegar sessao:", err);
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          localStorage.removeItem('sagaflix_user');
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          await handleUserSession(session);
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

  const updateUserTastes = async (newTastes) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const res = await fetch((window.API_BASE_URL || '') + '/api/profile/tastes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ tastes: newTastes })
      });

      if (res.ok) {
        setCurrentUser(prev => {
          const updated = { ...prev, tastes: newTastes };
          localStorage.setItem('sagaflix_user', JSON.stringify(updated));
          return updated;
        });
        return true;
      }
    } catch (err) {
      console.error("Erro ao atualizar gostos:", err);
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading, setCurrentUser, updateUserTastes }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
