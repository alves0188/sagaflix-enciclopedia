import { useEffect, useRef } from 'react';

/**
 * Hook para amarrar o estado de um modal ou tela ao histórico do navegador via Hash (#).
 * @param {boolean} isOpen Se a tela está aberta.
 * @param {string} hashSegment O hash desejado na URL (ex: 'editando', 'livro').
 * @param {function} onClose Função chamada para fechar a tela.
 * @returns {function} Uma função envelopada para fechar a tela e remover o hash do histórico adequadamente.
 */
export function useHashHistory(isOpen, hashSegment, onClose) {
  const isInternalClose = useRef(false);

  useEffect(() => {
    if (isOpen) {
      const currentHash = window.location.hash;
      if (!currentHash.includes(hashSegment)) {
        const separator = currentHash && currentHash !== '#' ? '/' : '#';
        window.location.hash = currentHash + separator + hashSegment;
      }
    }
  }, [isOpen, hashSegment]);

  useEffect(() => {
    const handleHashChange = () => {
      if (isOpen) {
        if (!window.location.hash.includes(hashSegment)) {
          if (!isInternalClose.current) {
            onClose();
          }
        }
      }
      isInternalClose.current = false;
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isOpen, hashSegment, onClose]);

  const handleClose = () => {
    onClose();
    if (window.location.hash.includes(hashSegment)) {
      isInternalClose.current = true;
      window.history.back();
    }
  };

  return handleClose;
}
