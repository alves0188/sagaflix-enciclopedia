import React, { useState } from 'react';
import { X, Crown, Gem, AlertTriangle, Gift } from 'lucide-react';

const ShopModal = ({ isOpen, onClose, userName }) => {
  const [activeTab, setActiveTab] = useState('premium'); // 'premium' ou 'crystals'

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--accent-gold)',
        borderRadius: '8px', width: '100%', maxWidth: '600px',
        maxHeight: '90vh', overflowY: 'auto',
        position: 'relative', display: 'flex', flexDirection: 'column'
      }}>
        
        <button onClick={onClose} style={{
          position: 'absolute', top: '1rem', right: '1rem', background: 'none',
          border: 'none', color: 'var(--text-main)', cursor: 'pointer', zIndex: 10
        }}>
          <X size={24} />
        </button>

        <div style={{ padding: '2rem 2rem 0 2rem', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
            Sagaflix Shop
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Prepare-se para o próximo nível. Nossa economia e clube de vantagens abrem no final do ano!
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '2rem 0 1rem 0' }}>
            <button 
              onClick={() => setActiveTab('premium')}
              className={activeTab === 'premium' ? 'btn-primary' : 'btn-secondary'}
              style={{ flex: 1, padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: 0 }}
            >
              <Crown size={18} /> Assinatura Premium
            </button>
            <button 
              onClick={() => setActiveTab('crystals')}
              className={activeTab === 'crystals' ? 'btn-primary' : 'btn-secondary'}
              style={{ flex: 1, padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: 0 }}
            >
              <Gem size={18} /> Cristais / Gorjetas
            </button>
          </div>
        </div>

        <div style={{ padding: '0 2rem 2rem 2rem' }}>
          {activeTab === 'premium' && (
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
              <Crown size={40} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'var(--text-main)', margin: '0 0 1rem 0' }}>Sagaflix Premium</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>✨ Acesso Ilimitado a todos os livros da plataforma</li>
                <li>🚀 Leitura Adiantada de Capítulos (Apoie os Autores!)</li>
                <li>💎 Ganhe um bônus mensal de Cristais para dar gorjetas</li>
                <li>👑 Destaque Especial no seu perfil e nos comentários</li>
              </ul>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>R$ 14,90 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/mês</span></span>
                <button 
                  onClick={() => alert("O Clube Premium será lançado no final de 2026! Aproveite a plataforma 100% gratuita por enquanto!")}
                  className="btn-primary" style={{ width: '100%', maxWidth: '300px', margin: '1rem 0 0 0' }}>
                  Assinar (Em Breve)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'crystals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
                <Gift size={40} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>Economia de Cristais</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.5rem 0' }}>
                  Use cristais para enviar presentes (gorjetas) aos seus autores favoritos e desbloquear recompensas visuais. Seus primeiros 50 Cristais serão dados no lançamento da loja!
                </p>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  
                  {/* Pacote 1 */}
                  <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '4px', flex: '1 1 120px' }}>
                    <Gem size={24} color="#a0aec0" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>100</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Cristais</div>
                    <div style={{ color: 'var(--accent-gold)', fontWeight: 'bold', marginBottom: '0.5rem' }}>R$ 4,90</div>
                    <button 
                      onClick={() => alert("A Loja de Cristais chega na próxima atualização principal!")}
                      className="btn-secondary" style={{ width: '100%', margin: 0, padding: '0.4rem', fontSize: '0.8rem' }}>Comprar</button>
                  </div>

                  {/* Pacote 2 */}
                  <div style={{ background: 'var(--bg-main)', border: '1px solid var(--accent-gold)', padding: '1rem', borderRadius: '4px', flex: '1 1 120px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-gold)', color: '#000', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>MAIS POPULAR</div>
                    <Gem size={24} color="var(--accent-gold)" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>500</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Cristais</div>
                    <div style={{ color: 'var(--accent-gold)', fontWeight: 'bold', marginBottom: '0.5rem' }}>R$ 19,90</div>
                    <button 
                      onClick={() => alert("A Loja de Cristais chega na próxima atualização principal!")}
                      className="btn-primary" style={{ width: '100%', margin: 0, padding: '0.4rem', fontSize: '0.8rem' }}>Comprar</button>
                  </div>

                  {/* Pacote 3 */}
                  <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '4px', flex: '1 1 120px' }}>
                    <Gem size={24} color="#9f7aea" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>1200</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Cristais (+20% Bônus)</div>
                    <div style={{ color: 'var(--accent-gold)', fontWeight: 'bold', marginBottom: '0.5rem' }}>R$ 39,90</div>
                    <button 
                      onClick={() => alert("A Loja de Cristais chega na próxima atualização principal!")}
                      className="btn-secondary" style={{ width: '100%', margin: 0, padding: '0.4rem', fontSize: '0.8rem' }}>Comprar</button>
                  </div>

                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <AlertTriangle size={14} color="var(--accent-gold)" />
            A monetização nos ajuda a manter os servidores e a recompensar os autores por seu trabalho incrível.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopModal;
