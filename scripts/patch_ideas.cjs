const fs = require('fs');

// Patch BookIdeasBoard
let ideasContent = fs.readFileSync('src/components/BookIdeasBoard.jsx', 'utf8');

ideasContent = ideasContent.replace(
  'export default function BookIdeasBoard({ book, onUpdateBook, onOpenMenu, headerActions }) {',
  'export default function BookIdeasBoard({ book, bookId, authorId, onUpdateBook, onOpenMenu, headerActions }) {'
);

ideasContent = ideasContent.replace(
  'const data = await api.getBookIdeas(book.id);',
  'const data = await api.getBookIdeas(bookId || (book ? book.id : null), authorId);'
);

ideasContent = ideasContent.replace(
  'if (!book?.id) return;',
  'if (!bookId && !authorId && !book?.id) return;'
);

ideasContent = ideasContent.replace(
  'const ideaLegends = { ...DEFAULT_LEGENDS, ...(book.ideaLegends || {}) };',
  'const ideaLegends = { ...DEFAULT_LEGENDS, ...(book?.ideaLegends || {}) };'
);

ideasContent = ideasContent.replace(
  'book_id: book.id,',
  'book_id: bookId || (book ? book.id : null),\n        author_id: authorId,'
);

ideasContent = ideasContent.replace(
  'onUpdateBook({ ...book, ideaLegends: updatedLegends });',
  'if (onUpdateBook && book) { onUpdateBook({ ...book, ideaLegends: updatedLegends }); }'
);

ideasContent = ideasContent.replace(
  'Painel de Ideias: {book.title}',
  'Painel de Ideias: {book ? book.title : "Ideias Gerais"}'
);

ideasContent = ideasContent.replace(
  '}, [book?.id]);',
  '}, [book?.id, bookId, authorId]);'
);

fs.writeFileSync('src/components/BookIdeasBoard.jsx', ideasContent, 'utf8');
console.log('BookIdeasBoard.jsx patched successfully');

// Patch AuthorDashboard
let dashContent = fs.readFileSync('src/components/AuthorDashboard.jsx', 'utf8');

dashContent = dashContent.replace(
  `            {sortedBooks.length > 0 ? (
              <select
                value={selectedIdeaBookId || activeBookForPlanning?.id || ''}
                onChange={(e) => setSelectedIdeaBookId(e.target.value)}
                style={{`,
  `            <select
              value={selectedIdeaBookId || (sortedBooks.length > 0 ? (activeBookForPlanning?.id || 'general') : 'general')}
              onChange={(e) => setSelectedIdeaBookId(e.target.value)}
              style={{`
);

dashContent = dashContent.replace(
  `                {sortedBooks.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum livro publicado.</span>
            )}
          </div>`,
  `                <option value="general">Ideias Gerais (Sem Obra Vinculada)</option>
              {sortedBooks.map(book => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
          </div>`
);

dashContent = dashContent.replace(
  `          {/* Board Area */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
            {activeBookForPlanning ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                {(() => {
                  const headerTabs = (`,
  `          {/* Board Area */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
            {activeBookForPlanning || selectedIdeaBookId === 'general' || sortedBooks.length === 0 ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                {(() => {
                  const isGeneral = selectedIdeaBookId === 'general' || (!activeBookForPlanning && sortedBooks.length === 0);
                  const headerTabs = (`
);

dashContent = dashContent.replace(
  `                      <button 
                        onClick={() => setPlanningTab('resumo')}`,
  `                      {!isGeneral && <button 
                        onClick={() => setPlanningTab('resumo')}`
);

dashContent = dashContent.replace(
  `                        Resumo / Premissa
                      </button>
                      <button 
                        onClick={() => setPlanningTab('escaleta')}`,
  `                        Resumo / Premissa
                      </button>}
                      {!isGeneral && <button 
                        onClick={() => setPlanningTab('escaleta')}`
);

dashContent = dashContent.replace(
  `                        Escaletas
                      </button>
                      <button 
                        onClick={() => setPlanningTab('ideias')}`,
  `                        Escaletas
                      </button>}
                      <button 
                        onClick={() => setPlanningTab('ideias')}`
);

dashContent = dashContent.replace(
  `                      {planningTab === 'ideias' && (
                        <div style={{ height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto' }}>
                          <BookIdeasBoard 
                            bookId={activeBookForPlanning.id} 
                          />
                        </div>
                      )}`,
  `                      {(planningTab === 'ideias' || isGeneral) && (
                        <div style={{ height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto' }}>
                          <BookIdeasBoard 
                            bookId={isGeneral ? null : activeBookForPlanning?.id} 
                            authorId={isGeneral ? currentUser.id : null}
                            book={activeBookForPlanning}
                            onUpdateBook={onUpdateBook}
                          />
                        </div>
                      )}`
);

fs.writeFileSync('src/components/AuthorDashboard.jsx', dashContent, 'utf8');
console.log('AuthorDashboard.jsx patched successfully');
