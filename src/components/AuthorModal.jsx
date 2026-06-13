import { X, BookOpen, User } from 'lucide-react';

export default function AuthorModal({ author, db, onClose }) {
  if (!author) return null;

  // Encontrar todas as obras publicadas deste autor
  const authorBooks = db.books.filter(b => b.authorId === author.id && (b.status === 'published' || b.status === 'draft'));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }} onClick={onClose}>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--accent-gold)', borderRadius: '8px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        {/* Capa do Perfil (Header) */}
        <div style={{ background: 'linear-gradient(45deg, #1a1a1a, #2a2a2a)', padding: '3rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg-main)', border: '2px solid var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {author.avatar ? (
              <img src={author.avatar} alt={(author.displayMode === 'name' ? author.name : (author.nickname || author.name))} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={48} color="var(--accent-gold)" />
            )}
          </div>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', margin: '0 0 0.5rem 0', fontSize: '2rem' }}>{(author.displayMode === 'name' ? author.name : (author.nickname || author.name))}</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Idade: {author.age} anos
              {author.tastes && author.tastes.length > 0 && ` • Gosta de: ${author.tastes.join(', ')}`}
            </p>
          </div>
        </div>

        {/* Bio */}
        <div style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--text-main)', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} color="var(--accent-gold)" /> Sobre o Autor
          </h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '4px', borderLeft: '3px solid var(--accent-gold)' }}>
            {author.about || "Este autor ainda não escreveu uma biografia pública."}
          </p>
        </div>

        {/* Obras */}
        <div style={{ padding: '0 2rem 2rem 2rem' }}>
          <h3 style={{ color: 'var(--text-main)', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} color="var(--accent-gold)" /> Obras Publicadas ({authorBooks.length})
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            {authorBooks.length > 0 ? (
              authorBooks.map(book => (
                <div key={book.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '2/3', width: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {book.cover ? (
                      <>
                        <img 
                          src={book.cover} 
                          alt="" 
                          style={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover', 
                            filter: 'blur(10px)', 
                            opacity: 0.35, 
                            zIndex: 0 
                          }} 
                        />
                        <img 
                          src={book.cover} 
                          alt={book.title} 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain', 
                            zIndex: 1 
                          }} 
                        />
                      </>
                    ) : (
                      <BookOpen size={32} color="rgba(255,255,255,0.1)" />
                    )}
                  </div>
                  <div style={{ padding: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--accent-gold)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</h4>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', gridColumn: '1 / -1' }}>Nenhuma obra publicada ainda.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
