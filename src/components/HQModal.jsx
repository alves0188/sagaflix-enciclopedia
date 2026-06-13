import React from 'react';
import { X, Image as ImageIcon } from 'lucide-react';

export default function HQModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content animate-fade-in" style={{ 
        maxWidth: '650px', 
        padding: '2.5rem',
        borderRadius: '16px',
        background: 'var(--card-bg)',
        border: '1px solid var(--accent-gold)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(226, 192, 68, 0.1)', borderRadius: '12px', color: 'var(--accent-gold)' }}>
            <ImageIcon size={32} />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', margin: 0, fontSize: '1.8rem' }}>
              Leitor de HQs em Breve!
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0 0', fontSize: '0.9rem' }}>
              Mangás, Manhwas e Webcomics
            </p>
          </div>
        </div>

        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p>
            O mercado de <strong>Mangás, Manhwas (quadrinhos coreanos) e HQs (Webcomics)</strong> tem um dos públicos jovens mais engajados e apaixonados da internet. Esse modelo encaixa perfeitamente com a compra de moedas virtuais para desbloquear capítulos antecipados ou dar gorjetas para autores!
          </p>
          
          <h4 style={{ color: 'var(--text-main)', margin: '0.5rem 0 0 0' }}>Como vai funcionar tecnicamente?</h4>
          
          <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>O Sistema Comporta?</strong> Sim, totalmente! No banco de dados, uma HQ ou um Livro de texto são praticamente a mesma coisa. O esqueleto que já construímos serve perfeitamente.</li>
            <li><strong>Leitor Diferente:</strong> Nós criaremos um "Leitor de Imagens". Para Manhwas será em "Scroll Vertical Infinito". Para Mangás tradicionais será paginado (da direita para a esquerda).</li>
            <li><strong>Área do Autor:</strong> Em vez do editor de texto atual, haverá uma tela de <strong>Upload em Lote</strong>, onde o autor arrasta e solta as dezenas de páginas do seu capítulo.</li>
          </ul>

          <div style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '4px solid var(--accent-gold)', padding: '1rem', marginTop: '1rem', borderRadius: '0 8px 8px 0' }}>
            <p style={{ margin: 0, fontStyle: 'italic' }}>
              "Como a estrutura base de usuários e livros já está sendo feita agora, adicionar o suporte a Quadrinhos depois seria apenas criar a telinha de Leitor de Imagens. O resto da plataforma já estaria pronto para eles também!"
            </p>
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '0.8rem 2rem' }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
