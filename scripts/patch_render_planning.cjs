const fs = require('fs');
let content = fs.readFileSync('src/components/AuthorDashboard.jsx', 'utf8');

const targetStr = `            {sortedBooks.length > 0 ? (
              <select
                value={selectedIdeaBookId || activeBookForPlanning?.id || ''}
                onChange={(e) => setSelectedIdeaBookId(e.target.value)}
                style={{`;

const repStr = `            <select
              value={selectedIdeaBookId || (sortedBooks.length > 0 ? (activeBookForPlanning?.id || 'general') : 'general')}
              onChange={(e) => setSelectedIdeaBookId(e.target.value)}
              style={{`;
              
let content2 = content.replace(targetStr, repStr);

const targetStr2 = `                {sortedBooks.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum livro publicado.</span>
            )}
          </div>`;

const repStr2 = `                <option value="general">Ideias Gerais (Sem Obra Vinculada)</option>
              {sortedBooks.map(book => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
          </div>`;
          
content2 = content2.replace(targetStr2, repStr2);

// Now update the Board Area
const targetStr3 = `          {/* Board Area */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
            {activeBookForPlanning ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                {(() => {
                  const headerTabs = (
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.3rem', borderRadius: '8px', flexShrink: 0 }}>`;

const repStr3 = `          {/* Board Area */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
            {activeBookForPlanning || selectedIdeaBookId === 'general' || sortedBooks.length === 0 ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                {(() => {
                  const isGeneral = selectedIdeaBookId === 'general' || (!activeBookForPlanning && sortedBooks.length === 0);
                  const headerTabs = (
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.3rem', borderRadius: '8px', flexShrink: 0 }}>`;

content2 = content2.replace(targetStr3, repStr3);

fs.writeFileSync('src/components/AuthorDashboard.jsx', content2, 'utf8');
console.log('Success renderPlanning patch');
