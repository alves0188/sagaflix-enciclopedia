const fs = require('fs');
let content = fs.readFileSync('src/components/AuthorDashboard.jsx', 'utf8');

const tabsTarget = `                  const headerTabs = (
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.3rem', borderRadius: '8px', flexShrink: 0 }}>
                      <button 
                        onClick={() => setPlanningTab('resumo')}`;

const tabsRep = `                  const headerTabs = (
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.3rem', borderRadius: '8px', flexShrink: 0 }}>
                      {!isGeneral && <button 
                        onClick={() => setPlanningTab('resumo')}`;

content = content.replace(tabsTarget, tabsRep);

const escTarget = `                        Resumo / Premissa
                      </button>
                      <button 
                        onClick={() => setPlanningTab('escaleta')}`;

const escRep = `                        Resumo / Premissa
                      </button>}
                      {!isGeneral && <button 
                        onClick={() => setPlanningTab('escaleta')}`;

content = content.replace(escTarget, escRep);

const endEscTarget = `                        Escaletas
                      </button>
                      <button 
                        onClick={() => setPlanningTab('ideias')}`;
                        
const endEscRep = `                        Escaletas
                      </button>}
                      <button 
                        onClick={() => setPlanningTab('ideias')}`;
                        
content = content.replace(endEscTarget, endEscRep);

// For the content body:
const bodyTarget = `                    {planningTab === 'resumo' && (
                        <div style={{ height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto' }}>
                          <BookPremissaBoard 
                            bookId={activeBookForPlanning.id} 
                            premissa={activeBookForPlanning.premissa || ''} 
                            onUpdateBook={onUpdateBook}
                          />
                        </div>
                      )}
                      {planningTab === 'escaleta' && (
                        <div style={{ height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto' }}>
                          <BookEscaletaBoard 
                            bookId={activeBookForPlanning.id}
                          />
                        </div>
                      )}
                      {planningTab === 'ideias' && (
                        <div style={{ height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto' }}>
                          <BookIdeasBoard 
                            bookId={activeBookForPlanning.id} 
                          />
                        </div>
                      )}`;

const bodyRep = `                    {(planningTab === 'resumo' && !isGeneral) && (
                        <div style={{ height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto' }}>
                          <BookPremissaBoard 
                            bookId={activeBookForPlanning?.id} 
                            premissa={activeBookForPlanning?.premissa || ''} 
                            onUpdateBook={onUpdateBook}
                          />
                        </div>
                      )}
                      {(planningTab === 'escaleta' && !isGeneral) && (
                        <div style={{ height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto' }}>
                          <BookEscaletaBoard 
                            bookId={activeBookForPlanning?.id}
                          />
                        </div>
                      )}
                      {(planningTab === 'ideias' || isGeneral) && (
                        <div style={{ height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto' }}>
                          <BookIdeasBoard 
                            bookId={isGeneral ? null : activeBookForPlanning?.id} 
                            authorId={isGeneral ? currentUser.id : null}
                          />
                        </div>
                      )}`;

content = content.replace(bodyTarget, bodyRep);

fs.writeFileSync('src/components/AuthorDashboard.jsx', content, 'utf8');
console.log('Success tabs patch');
