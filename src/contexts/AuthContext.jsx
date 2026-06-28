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
            
            // Sincronizar na tabela sagaflix_db JSON também
            try {
              const { data: dbData } = await supabase.from('sagaflix_db').select('data').eq('id', 1).single();
              if (dbData && dbData.data) {
                const newDb = { ...dbData.data };
                if (!newDb.users) newDb.users = [];
                newDb.users.push({
                  id: user.id,
                  email: user.email,
                  name: newProfile.name,
                  nickname: newProfile.nickname,
                  status: 'active',
                  role: 'reader'
                });
                await supabase.from('sagaflix_db').update({ data: newDb }).eq('id', 1);
              }
            } catch (dbErr) {
              console.error("Erro ao sincronizar login social no sagaflix_db:", dbErr);
            }
          }
        }

        if (profile) {
          const userObj = {
            id: profile.id,
            role: profile.role || 'reader',
            name: profile.name,
            nickname: profile.nickname,
            email: profile.email,
            avatar: profile.avatar_url,
            favorites: profile.favorites || [],
            readingStatus: profile.reading_status || {},
            completedTutorials: profile.completed_tutorials || []
          };
          
          if (userObj.email === 'suporte@sagaflix.com.br') userObj.role = 'admin';

          setCurrentUser(userObj);
          localStorage.setItem('sagaflix_user', JSON.stringify(userObj));
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

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
