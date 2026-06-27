import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
        <p style={{ color: 'var(--accent-gold)' }}>Carregando...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Admin has access to everything
  if (currentUser.role === 'admin') {
    return children;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // If author tries to access reader portal, they usually can, but let's handle viewRoleOverride in the components
    // Wait, the user specifically requested strict separation. Let's strictly enforce unless 'reader' is allowed for 'author' too.
    if (currentUser.role === 'author' && allowedRoles.includes('reader')) {
      return children;
    }
    
    return (
      <div style={{ color: 'white', padding: '3rem', textAlign: 'center', background: 'var(--bg-main)', height: '100vh' }}>
        <h2>Acesso Negado</h2>
        <p>Seu perfil de <strong>{currentUser.role}</strong> não tem permissão para acessar esta página.</p>
        <button onClick={() => window.location.href = '/'} className="btn-primary" style={{ marginTop: '1rem', marginRight: '1rem' }}>Ir para Home</button>
      </div>
    );
  }

  return children;
}
