import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Sparkles, BookOpen, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SearchSection({ onSelectBook, db }) {
  const [query, setQuery] = useState('');
  const [isSemantic, setIsSemantic] = useState(true);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const baseUrl = window.API_BASE_URL || '';
      
      if (isSemantic) {
        // Query the semantic search API route (T021)
        const { data: { session } } = await supabase.auth.getSession();
        
        const res = await fetch(`${baseUrl}/api/search/semantic`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': session ? `Bearer ${session.access_token}` : ''
          },
          body: JSON.stringify({ query: query.trim() })
        });

        if (res.ok) {
          const data = await res.json();
          setResults(data.books || []);
        } else {
          toast.error('Erro ao realizar busca inteligente.');
        }
      } else {
        // Local classic search: match query text in title, synopsis, premise
        const lowerQuery = query.toLowerCase();
        const filtered = (db?.books || []).filter(b => 
          b.status === 'published' && (
            b.title?.toLowerCase().includes(lowerQuery) ||
            b.synopsis?.toLowerCase().includes(lowerQuery) ||
            b.premise?.toLowerCase().includes(lowerQuery)
          )
        );
        setResults(filtered);
      }
    } catch (err) {
      console.error(err);
      toast.error('Falha de conexão ao pesquisar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '1rem 0' }}>
      
      {/* Search Input Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ 
          display: 'flex', 
          background: 'var(--card-bg)', 
          border: '1px solid var(--accent-gold)', 
          borderRadius: '30px', 
          padding: '0.4rem 0.6rem 0.4rem 1.5rem',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          {isSemantic ? <Sparkles size={20} color="var(--accent-gold)" /> : <Search size={20} color="var(--text-muted)" />}
          <input 
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={isSemantic ? "Ex: Uma história de um menino na lua com uma raposa..." : "Pesquisar por título, sinopse..."}
            style={{ 
              flex: 1, 
              background: 'transparent', 
              border: 'none', 
              color: '#fff', 
              outline: 'none', 
              fontSize: '1rem' 
            }}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ 
              borderRadius: '20px', 
              padding: '0.6rem 1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              fontWeight: 'bold' 
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
            <span>Pesquisar</span>
          </button>
        </div>

        {/* Toggle Mode */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input 
              type="checkbox" 
              checked={isSemantic} 
              onChange={e => setIsSemantic(e.target.checked)}
              style={{ accentColor: 'var(--accent-gold)' }}
            />
            <span style={{ color: isSemantic ? 'var(--accent-gold)' : 'var(--text-muted)', fontWeight: isSemantic ? 'bold' : 'normal' }}>
              Ativar Busca por IA (Enredo & Conceitos)
            </span>
          </label>
        </div>
      </form>

      {/* Results Container */}
      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1rem', color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={32} color="var(--accent-gold)" />
            <p>Buscando na biblioteca...</p>
          </div>
        ) : searched && results.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p style={{ margin: 0 }}>Nenhuma obra correspondente encontrada.</p>
          </div>
        ) : results.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
              Resultados Encontrados ({results.length})
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {results.map(book => (
                <div 
                  key={book.id}
                  onClick={() => onSelectBook(book.id)}
                  style={{ 
                    background: 'var(--card-bg)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px', 
                    padding: '1rem', 
                    display: 'flex', 
                    gap: '1rem', 
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ width: '80px', height: '120px', background: '#000', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                    {book.cover_url || book.cover ? (
                      <img src={book.cover_url || book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={24} color="var(--text-muted)" />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', justifyContent: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{book.title}</h4>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.85rem', 
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.3'
                    }}>
                      {book.synopsis || book.premise || 'Nenhuma sinopse disponível.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

    </div>
  );
}
