import { useState, useEffect, useRef } from 'react';

/**
 * Hook para amarrar o estado de Abas (Tabs) ao histórico do navegador via Hash (#).
 * Permite que a navegação entre abas funcione com o botão "Voltar".
 * @param {string} initialTab A aba inicial
 * @param {string[]} validTabs Lista de abas válidas para ignorar hashes de outras telas
 * @param {string} localStorageKey Opcional. Chave para persistir a aba no localStorage.
 * @returns {[string, function]} O estado atual da aba e o setter
 */
export function useHashTabs(initialTab, validTabs = [], localStorageKey = null) {
  const [activeTab, setActiveTabState] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (validTabs.includes(hash)) return hash;
    if (localStorageKey) {
      try {
        const saved = localStorage.getItem(localStorageKey);
        if (saved && validTabs.includes(saved)) return saved;
      } catch (err) {}
    }
    return initialTab;
  });

  // Handle initial mount hash replacement
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash && activeTab) {
      window.history.replaceState(null, '', '#' + activeTab);
    }
  }, []); // Run once on mount

  // Sync URL Hash -> state (Back button)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (validTabs.includes(hash)) {
        setActiveTabState(hash);
      } else if (!hash) {
        setActiveTabState(initialTab);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [validTabs, initialTab]);

  const setActiveTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTabState(tab);
      window.history.pushState(null, '', '#' + tab);
      window.dispatchEvent(new Event('popstate'));
      if (localStorageKey) {
        localStorage.setItem(localStorageKey, tab);
      }
    }
  };

  return [activeTab, setActiveTab];
}
