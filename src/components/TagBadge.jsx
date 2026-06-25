import React, { useState, useMemo } from 'react';

export default function TagBadge({ tag, universe }) {
  const [showPopup, setShowPopup] = useState(false);

  // Busca a imagem do dossiê correspondente à tag
  const imageUrl = useMemo(() => {
    if (!universe || !tag) return null;
    
    // Remove pontuação comum e espaços extras para melhorar o match
    const normalize = (str) => (str || '').toLowerCase().replace(/[#@*]/g, '').trim();
    const nameToSearch = normalize(tag);
    
    const categories = ['characters', 'locations', 'organizations', 'clues'];
    
    for (const cat of categories) {
      if (universe[cat]) {
        const match = universe[cat].find(item => 
          normalize(item.name) === nameToSearch || normalize(item.title) === nameToSearch || 
          (normalize(item.name) && nameToSearch.includes(normalize(item.name)))
        );
        if (match && match.image) return match.image;
      }
    }
    return null;
  }, [tag, universe]);

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => imageUrl && setShowPopup(true)}
      onMouseLeave={() => setShowPopup(false)}
      onClick={(e) => {
        if (imageUrl) {
          e.stopPropagation();
          setShowPopup(!showPopup);
        }
      }}
    >
      <span style={{ 
        background: 'var(--accent-gold)', 
        color: '#000', 
        padding: '0.4rem 0.8rem', 
        borderRadius: '20px', 
        fontSize: '0.85rem', 
        fontWeight: 'bold', 
        cursor: imageUrl ? 'pointer' : 'default',
        display: 'inline-block'
      }}>
        {tag}
      </span>
      
      {showPopup && imageUrl && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '10px',
          background: 'var(--card-bg)',
          border: '1px solid var(--accent-gold)',
          borderRadius: '8px',
          padding: '4px',
          zIndex: 10000,
          width: '100px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none'
        }}>
          <img src={imageUrl} alt={tag} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
          <div style={{ color: 'var(--text-main)', fontSize: '0.7rem', marginTop: '4px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', fontWeight: 'bold' }}>
            {tag}
          </div>
          {/* Seta do tooltip */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            borderWidth: '6px',
            borderStyle: 'solid',
            borderColor: 'var(--accent-gold) transparent transparent transparent'
          }}></div>
        </div>
      )}
    </div>
  );
}
