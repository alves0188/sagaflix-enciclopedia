import { useEffect, useRef } from 'react';

/**
 * Hook para amarrar o estado de um modal ou tela ao histórico do navegador via Hash (#).
 * @param {boolean} isOpen Se a tela está aberta.
 * @param {string} hash O hash desejado na URL (ex: 'editando', 'livro').
 * @param {function} onClose Função chamada para fechar a tela.
 * @returns {function} Uma função envelopada para fechar a tela e remover o hash do histórico adequadamente.
 */
export function useHashHistory(isOpen, hash, onClose) {
  const isInternalClose = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (window.location.hash !== `#${hash}`) {
        window.location.hash = hash;
      }
    }
  }, [isOpen, hash]);

  useEffect(() => {
    const handleHashChange = () => {
      // Se a tela estava aberta, e o hash mudou (ou sumiu) para algo diferente do nosso hash
      if (isOpen && window.location.hash !== `#${hash}`) {
        // Se a mudança não foi disparada internamente pelo nosso botão de fechar, significa que foi o botão "Voltar"
        if (!isInternalClose.current) {
          onClose();
        }
      }
      isInternalClose.current = false;
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isOpen, hash, onClose]);

  const handleClose = () => {
    onClose();
    if (window.location.hash === `#${hash}`) {
      isInternalClose.current = true;
      window.history.back();
    }
  };

  return handleClose;
}
