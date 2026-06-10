import { useState } from 'react';
import { User, LogOut, Search, Plus, Trash2, Edit2, ShieldAlert, ArrowLeft, ArrowUp, ArrowDown, Save, FileText, Image, ChevronRight, ChevronDown, Bold, Layout, Layers, Tag, Eye, Lightbulb, Star, Book } from 'lucide-react';
import CustomEditor from './CustomEditor';
import JoditEditor from 'jodit-react';
import DossierEditor from './DossierEditor';
import PagesConfig from './PagesConfig';
import SynopsisConfig from './SynopsisConfig';
import BookIdeasBoard from './BookIdeasBoard';
import { uploadImage } from '../lib/supabaseClient';

const editorConfig = {
  readonly: false,
  theme: 'dark',
  height: 600,
  askBeforePasteHTML: true,
  askBeforePasteFromWord: true,
  style: {
    background: 'var(--card-bg)',
    color: 'var(--text-main)',
    fontSize: '1.1rem',
    lineHeight: '1.8'
  },
  buttons: ['bold', 'italic', 'underline', 'strikethrough', '|', 'ul', 'ol', '|', 'paragraph', 'align', '|', 'quote', '|', 'undo', 'redo']
};

export default function AdminPanel({ data, onUpdate, bookId, currentBook, onUpdateBook, currentUser, onLogChange, isReadOnly = false, restrictedTabs = null }) {
  const [activeList, setActiveList] = useState('chapters'); // Default to chapters
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [uploading, setUploading] = useState(false);
  const [activeSubthemeStr, setActiveSubthemeStr] = useState('');
  const [activePageIdxWithinSubtheme, setActivePageIdxWithinSubtheme] = useState(0);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({ what: '', why: '', impact: '' });

  const localEditorConfig = {
    ...editorConfig,
    readonly: isReadOnly
  };

  const canCreateNew = !isReadOnly && (currentBook?.status === 'draft' || currentUser?.role === 'curator');
  const canEditChapter = !isReadOnly && (currentBook?.status === 'draft' || currentUser?.role === 'curator');
  const canViewChapter = isReadOnly || canEditChapter;

  const uniqueSubthemes = formData.type === 'chapter' ? Array.from(new Set((formData.pages || []).map(p => p.subtheme || ''))) : [];
  const activeSubthemePages = formData.type === 'chapter' ? (formData.pages || []).map((p, idx) => ({ ...p, globalIdx: idx })).filter(p => (p.subtheme || '') === (activeSubthemeStr || '')) : [];

  const getListKey = (type) => {
    if (type === 'personagem') return 'characters';
    if (type === 'local') return 'locations';
    if (type === 'pista') return 'clues';
    if (type === 'post') return 'posts';
    if (type === 'chapter') return 'chapters';
    if (type === 'evento') return 'events';
    return 'organizations';
  };

  const isTabVisible = (tabKey) => {
    if (tabKey === 'posts') return false; // Hiding blog posts tab temporarily as requested
    if (!restrictedTabs) return true;
    if (tabKey === 'ideias') return true; // Ideias board is always visible unless specifically restricted
    return restrictedTabs.includes(tabKey);
  };

  const handleEdit = (item, type) => {
    setEditingItem(item.id);
    setFormData({ ...item, type });
    if (type === 'chapter') {
      const firstSubtheme = item.pages && item.pages.length > 0 ? (item.pages[0].subtheme || '') : '';
      setActiveSubthemeStr(firstSubtheme);
      setActivePageIdxWithinSubtheme(0);
    }
  };

  const handleNew = () => {
    if (isReadOnly) return;
    setEditingItem('new');
    let type = 'personagem';
    if (activeList === 'locations') type = 'local';
    if (activeList === 'clues') type = 'pista';
    if (activeList === 'organizations') type = 'organizacao';
    if (activeList === 'posts') type = 'post';
    if (activeList === 'chapters') type = 'chapter';
    if (activeList === 'events') type = 'evento';
    
    if (type === 'pista') {
      setFormData({ id: Date.now().toString(), type, name: '', image: '', found: '', wrong_view: '', reality: '', gallery: [] });
    } else if (type === 'post') {
      setFormData({ id: Date.now().toString(), type, title: '', content: '', image: '', date: new Date().toLocaleDateString('pt-BR') });
    } else if (type === 'chapter') {
      setFormData({ id: Date.now().toString(), type, title: '', pages: [{ subtheme: 'Novo Subtema', text: '', image: '' }] });
      setActiveSubthemeStr('Novo Subtema');
      setActivePageIdxWithinSubtheme(0);
    } else if (type === 'evento') {
      setFormData({ id: Date.now().toString(), type, name: '', content: '', tags: '' });
    } else {
      setFormData({ id: Date.now().toString(), type, name: '', role: '', territory: '', age: '', image: '', description: '', motivations: '', curiosities: '', connections: [], gallery: [], customFields: [], privateNotes: '' });
    }
  };

  const handleDelete = (id, type) => {
    if (isReadOnly) return;
    if (window.confirm('Tem certeza que deseja excluir?')) {
      const listKey = getListKey(type);
      const updatedList = (data[listKey] || []).filter(item => item.id !== id);
      const deletedItem = (data[listKey] || []).find(item => item.id === id);
      
      if (onLogChange && deletedItem) {
        const typeNames = { chapters: 'capítulo', characters: 'personagem', locations: 'local', organizations: 'organização', clues: 'complemento', items: 'item', events: 'evento/tag', posts: 'notícia/post' };
        const typeName = typeNames[listKey] || 'registro';
        onLogChange(`Excluiu ${typeName}`, deletedItem.name || deletedItem.title || `ID: ${id}`);
      }

      onUpdate({ ...data, [listKey]: updatedList });
      if (editingItem === id) setEditingItem(null);
    }
  };

  const handleSave = () => {
    if (isReadOnly) return;
    const listKey = getListKey(formData.type);
    let updatedList;
    
    if (editingItem === 'new') {
      updatedList = [...(data[listKey] || []), formData];
      setEditingItem(formData.id);
      if (onLogChange) {
        const typeNames = { chapters: 'capítulo', characters: 'personagem', locations: 'local', organizations: 'organização', clues: 'complemento', items: 'item', events: 'evento/tag', posts: 'notícia/post' };
        const typeName = typeNames[activeList] || 'registro';
        onLogChange(`Criou novo(a) ${typeName}`, formData.name || formData.title || 'Sem título');
      }
    } else {
      updatedList = (data[listKey] || []).map(item => item.id === formData.id ? formData : item);
      if (onLogChange) {
        const typeNames = { chapters: 'capítulo', characters: 'personagem', locations: 'local', organizations: 'organização', clues: 'complemento', items: 'item', events: 'evento/tag', posts: 'notícia/post' };
        const typeName = typeNames[activeList] || 'registro';
        onLogChange(`Editou ${typeName}`, formData.name || formData.title || 'Sem título');
      }
    }

    onUpdate({ ...data, [listKey]: updatedList });
  };

  const handleChange = (e) => {
    if (isReadOnly) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e, fieldName, isGallery = false) => {
    if (isReadOnly) return;
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    let newGalleryUrls = [];

    for (const file of files) {
      try {
        const url = await uploadImage(file);
        if (url) {
          if (isGallery) {
            newGalleryUrls.push(url);
          } else {
            setFormData(prev => ({ ...prev, [fieldName]: url }));
            break; 
          }
        }
      } catch (err) {
        console.error("Erro no upload", err);
        alert(err.message || "Erro ao fazer upload da imagem: " + file.name);
      }
    }

    if (isGallery && newGalleryUrls.length > 0) {
      setFormData(prev => ({ ...prev, gallery: [...(prev.gallery || []), ...newGalleryUrls] }));
    }

    setUploading(false);
    e.target.value = null;
  };

  const handleFeatureImageUpload = async (e, sectionKey) => {
    if (isReadOnly) return;
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        const fallbackPages = {
          characters: { title: "Personagens", author: "Habitantes do Universo", category: "Conheça os protagonistas e antagonistas", description: "Explore os perfis, motivações e segredos de cada personagem desta história.", image: "/characters_cover.png" },
          locations: { title: "Locais e Territórios", author: "Geografia do Mundo", category: "Onde tudo acontece", description: "Navegue pelos cenários da história. Descubra as zonas seguras, os territórios perigosos e os esconderijos.", image: "/locations_cover.png" },
          organizations: { title: "Organizações", author: "Estruturas de Poder", category: "Facções, Comércios e Instituições", description: "Entenda a engrenagem que move este mundo. De pequenos grupos a grandes impérios.", image: "/org_cover.png" },
          clues: { title: "Complementos", author: "Dossiês Complementares", category: "Complementos e Extras", description: "Explore informações, materiais e arquivos complementares que enriquecem o universo da obra.", image: "/clues_cover.png" }
        };

        const currentPages = { ...(data.pages || fallbackPages) };
        if (currentPages[sectionKey]) {
          currentPages[sectionKey] = { ...currentPages[sectionKey], image: url };
        }
        
        onUpdate({ ...data, pages: currentPages });
        
        if (onLogChange) {
          const sectionNames = { characters: 'Personagens', locations: 'Locais', organizations: 'Organizações', clues: 'Complementos' };
          const secName = sectionNames[sectionKey] || sectionKey;
          onLogChange(`Alterou imagem de destaque`, `Seção: ${secName}`);
        }
        alert("Imagem de destaque atualizada com sucesso!");
      }
    } catch (err) {
      console.error("Erro no upload da imagem de destaque", err);
      alert(err.message || "Erro ao fazer upload da imagem de destaque.");
    }
    setUploading(false);
    e.target.value = null;
  };

  const handlePageChange = (index, field, value) => {
    if (isReadOnly) return;
    const newPages = [...(formData.pages || [])];
    newPages[index] = { ...newPages[index], [field]: value };
    setFormData({ ...formData, pages: newPages });
  };

  const handleSendRequest = () => {
    if (isReadOnly) return;
    if (!requestData.what || !requestData.why) {
      alert("Preencha os campos obrigatórios.");
      return;
    }
    if (onLogChange) {
      onLogChange('Pediu alteração', JSON.stringify(requestData), 'request');
    }
    setShowRequestModal(false);
    setRequestData({ what: '', why: '', impact: '' });
    alert("Pedido enviado para a curadoria com sucesso!");
  };

  const handleAddPage = () => {
    if (isReadOnly) return;
    setFormData({ ...formData, pages: [...(formData.pages || []), { subtheme: '', text: '', image: '' }] });
  };

  const handleRemovePage = (index) => {
    if (isReadOnly) return;
    const newPages = formData.pages.filter((_, i) => i !== index);
    setFormData({ ...formData, pages: newPages });
  };

  const handlePageImageUpload = async (e, pageIndex) => {
    if (isReadOnly) return;
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        handlePageChange(pageIndex, 'image', url);
      }
    } catch (err) {
      console.error("Erro no upload", err);
      alert(err.message || "Erro ao fazer upload da imagem");
    }
    setUploading(false);
    e.target.value = null;
  };

  const handleAddSubtheme = () => {
    if (isReadOnly) return;
    const newSubName = `Novo Subtema ${uniqueSubthemes.length + 1}`;
    setFormData({ ...formData, pages: [...(formData.pages || []), { subtheme: newSubName, text: '', image: '' }] });
    setActiveSubthemeStr(newSubName);
    setActivePageIdxWithinSubtheme(0);
  };

  const handleAddPageToSubtheme = () => {
    if (isReadOnly) return;
    setFormData({ ...formData, pages: [...(formData.pages || []), { subtheme: activeSubthemeStr, text: '', image: '' }] });
    setActivePageIdxWithinSubtheme(activeSubthemePages.length);
  };

  const handleRemoveGlobalPage = (globalIdx) => {
    if (isReadOnly) return;
    const newPages = formData.pages.filter((_, i) => i !== globalIdx);
    setFormData({ ...formData, pages: newPages });
    setActivePageIdxWithinSubtheme(Math.max(0, activePageIdxWithinSubtheme - 1));
  };

  const handleSubthemeNameChange = (newName) => {
    if (isReadOnly) return;
    const oldName = activeSubthemeStr;
    const newPages = (formData.pages || []).map(p => {
      if ((p.subtheme || '') === oldName) {
        return { ...p, subtheme: newName };
      }
      return p;
    });
    setFormData({ ...formData, pages: newPages });
    setActiveSubthemeStr(newName);
  };

  const handleDeleteReview = (userId) => {
    if (window.confirm('Tem certeza que deseja excluir esta avaliação?')) {
      const updatedRatings = (currentBook.ratings || []).filter(r => r.userId !== userId);
      const updatedBook = {
        ...currentBook,
        ratings: updatedRatings
      };
      
      onUpdateBook(updatedBook);
      
      if (onLogChange) {
        const deletedReview = (currentBook.ratings || []).find(r => r.userId === userId);
        onLogChange('Moderou avaliação', `Removeu avaliação de ${deletedReview?.userName || userId} (Nota: ${deletedReview?.stars})`);
      }
      alert('Avaliação removida com sucesso!');
    }
  };

  const renderReviewsTab = () => {
    const ratings = currentBook?.ratings || [];
    const count = ratings.length;
    const avg = count > 0 
      ? (ratings.reduce((sum, r) => sum + r.stars, 0) / count).toFixed(1)
      : '0.0';

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(r => {
      if (distribution[r.stars] !== undefined) {
        distribution[r.stars]++;
      }
    });

    const isCurator = currentUser?.role === 'curator';

    return (
      <div style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '12px', minHeight: '100%', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontFamily: "'Playfair Display', serif", margin: '0 0 0.5rem 0' }}>Avaliações & Recomendações</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Opiniões e avaliações do público sobre a obra <strong>{currentBook?.title}</strong>.</p>
        </div>

        {/* Tutorial Box */}
        <div style={{ 
          background: 'rgba(212, 175, 55, 0.05)', 
          border: '1px solid rgba(212, 175, 55, 0.2)', 
          borderRadius: '8px', 
          padding: '1.2rem', 
          fontSize: '0.9rem',
          lineHeight: 1.5,
          color: '#e2d4b7'
        }}>
          <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '0.5rem', fontSize: '1rem' }}>
            ⭐ Central de Avaliações e Feedback dos Leitores
          </div>
          <p style={{ margin: '0 0 0.5rem 0' }}><strong>Para que serve:</strong> Acompanhar as notas médias, a distribuição de estrelas e os comentários/críticas dos leitores que estão acompanhando a obra.</p>
          <p style={{ margin: 0 }}><strong>Onde o leitor acessa:</strong> Os leitores avaliam o livro no modal final de leitura ou pela vitrine. A média e a quantidade de avaliações são expostas em destaque nos cards da vitrine principal para novos leitores.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', border: '2px solid var(--accent-gold)' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{avg}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.2rem' }}>de 5.0</span>
            </div>
            <div>
              <div style={{ display: 'flex', color: 'var(--accent-gold)', marginBottom: '0.4rem' }}>
                {Array.from({ length: Math.round(Number(avg)) }).map((_, i) => <Star key={i} size={18} fill="var(--accent-gold)" color="var(--accent-gold)" />)}
                {Array.from({ length: 5 - Math.round(Number(avg)) }).map((_, i) => <Star key={i} size={18} fill="none" color="var(--accent-gold)" />)}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>{count === 1 ? '1 avaliação' : `${count} avaliações`}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Média acumulada do livro</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[5, 4, 3, 2, 1].map(stars => {
              const starsCount = distribution[stars];
              const pct = count > 0 ? (starsCount / count) * 100 : 0;
              return (
                <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.85rem' }}>
                  <span style={{ width: '60px', color: 'var(--text-muted)', textAlign: 'right' }}>{stars} estrela{stars > 1 ? 's' : ''}</span>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-gold)', borderRadius: '4px' }}></div>
                  </div>
                  <span style={{ width: '30px', color: 'var(--text-main)', fontWeight: 'bold' }}>{starsCount}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", margin: 0 }}>Comentários Recentes</h2>
          {count === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              Nenhuma avaliação recebida ainda para este livro.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>Leitor</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Avaliação</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Comentário (Máx. 12 char)</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Data</th>
                  {isCurator && !isReadOnly && <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Moderação</th>}
                </tr>
              </thead>
              <tbody>
                {ratings.map((rating, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.95rem' }}>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>{rating.userName}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ display: 'flex', color: 'var(--accent-gold)' }}>
                        {Array.from({ length: rating.stars }).map((_, i) => <Star key={i} size={14} fill="var(--accent-gold)" color="var(--accent-gold)" />)}
                        {Array.from({ length: 5 - rating.stars }).map((_, i) => <Star key={i} size={14} fill="none" color="var(--accent-gold)" />)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      {rating.comment ? (
                        <span style={{ 
                          background: 'rgba(212,175,55,0.08)', 
                          border: '1px solid rgba(212,175,55,0.2)', 
                          padding: '0.2rem 0.6rem', 
                          borderRadius: '4px', 
                          color: 'var(--accent-gold)', 
                          fontWeight: 'bold',
                          fontSize: '0.85rem'
                        }}>
                          {rating.comment}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>Sem comentário</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{rating.date}</td>
                    {isCurator && !isReadOnly && (
                      <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDeleteReview(rating.userId)}
                          style={{ background: 'rgba(255, 68, 68, 0.1)', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '0.4rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Excluir Avaliação"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const renderSectionTutorial = (listKey) => {
    const tutorials = {
      chapters: {
        title: "📖 Capítulos e Lançamentos",
        purpose: "Escrever a história principal dividida em capítulos e sessões. Cada sessão representa um trecho ou subtema que pode ser ilustrado com uma imagem específica de cena.",
        where: "No leitor de livros (Modo Leitura). Quando o leitor avança na leitura das sessões, a respectiva ilustração de cena aparece no painel lateral direito.",
        imageDim: "Ilustrações de sessão/capítulo: Qualquer proporção (idealmente paisagem ou conceitual para preencher o painel lateral)."
      },
      characters: {
        title: "👥 Dossiê de Personagens",
        purpose: "Criar a galeria de personagens da sua história. Permite detalhar dados pessoais, biografia, conexões de relacionamento e curiosidades para engajar o leitor.",
        where: "Na aba 'Personagens' do Universo do livro. O leitor clica no card do personagem para abrir o dossiê completo. A listagem é ordenada automaticamente pela importância de cena.",
        imageDim: "Capa de Destaque da Seção (botão acima): Proporção 2:3 (800x1200px). Fotos de identificação no dossiê: Proporção 1:1 (quadrada, ex: 400x400px)."
      },
      locations: {
        title: "📍 Dossiê de Locais e Ambientação",
        purpose: "Registrar os pontos de encontro, territórios, edifícios ou geografias onde se passam as cenas. Útil para estruturar a ambientação do cenário e os frequentadores.",
        where: "Na aba 'Locais' do Universo do livro. O leitor clica no local para abrir a ficha de ambientação e conferir as curiosidades e segredos.",
        imageDim: "Capa de Destaque da Seção (botão acima): Proporção 2:3 (800x1200px). Fotos de identificação do local: Qualquer proporção (idealmente paisagem)."
      },
      organizations: {
        title: "🏢 Dossiê de Organizações e Grupos",
        purpose: "Mapear corporações, clãs, facções, empresas ou órgãos públicos do seu mundo fictício. Serve para o leitor entender as estruturas de poder, objetivos e afiliações.",
        where: "Na aba 'Organizações' do Universo. O leitor confere a estrutura da entidade e a lista de membros e afiliados vinculados.",
        imageDim: "Capa de Destaque da Seção (botão acima): Proporção 2:3 (800x1200px). Foto da organização (brasão/sede): Qualquer proporção."
      },
      clues: {
        title: "🔮 Dossiê de Complementos e Lore Extra",
        purpose: "Seção livre e adaptável para enriquecer o lore do seu livro com segredos, grimórios, itens mágicos, diários ou lendas específicas do gênero literário da sua obra.",
        where: "Na aba 'Complementos' do Universo. Os leitores que gostam de explorar detalhes profundos da história acessam esses dossiês extras para desvendar mistérios e curiosidades.",
        imageDim: "Capa de Destaque da Seção (botão acima): Proporção 2:3 (800x1200px). Imagem do complemento (item/artefato): Qualquer proporção."
      },
      events: {
        title: "📅 Ocorrências e Tags de Linha do Tempo",
        purpose: "Registrar eventos importantes da história (ex: reuniões, crimes, festas, incidentes). Ao associar tags com os nomes exatos de personagens ou locais, o sistema realiza o cruzamento de dados automaticamente.",
        where: "Como post-its azuis dinâmicos anexados no canto das fichas técnicas dos personagens ou locais correspondentes, enriquecendo o dossiê deles com ocorrências em que participaram.",
        imageDim: "Não possui imagens. O foco desta seção é puramente textual e relacional."
      }
    };

    const tut = tutorials[listKey];
    if (!tut) return null;

    return (
      <div style={{ 
        background: 'rgba(212, 175, 55, 0.05)', 
        border: '1px solid rgba(212, 175, 55, 0.2)', 
        borderRadius: '8px', 
        padding: '1.2rem', 
        marginBottom: '2rem',
        fontSize: '0.9rem',
        lineHeight: 1.5,
        color: '#e2d4b7'
      }}>
        <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '0.5rem', fontSize: '1rem' }}>
          {tut.title}
        </div>
        <p style={{ margin: '0 0 0.5rem 0' }}><strong>Para que serve:</strong> {tut.purpose}</p>
        <p style={{ margin: '0 0 0.5rem 0' }}><strong>Onde o leitor acessa:</strong> {tut.where}</p>
        <p style={{ margin: 0 }}><strong>Diretrizes de Imagens:</strong> {tut.imageDim}</p>
      </div>
    );
  };

  const navItemStyle = (isActive) => ({
    background: isActive ? 'var(--accent-gold)' : 'transparent',
    color: isActive ? '#000' : 'var(--text-muted)',
    border: isActive ? 'none' : '1px solid var(--border-color)',
    padding: '1rem 1.5rem',
    textAlign: 'left',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.3s',
    margin: '0 1.5rem 0.5rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  });

  const formFieldStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', color: 'var(--text-main)', background: 'var(--bg-color)' }}>
      
      {/* Left Sidebar: CMS Menu */}
      <div style={{ width: '260px', borderRight: '1px solid var(--border-color)', backgroundColor: '#1a1c20', display: 'flex', flexDirection: 'column', padding: '2rem 0', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '0 1.5rem' }}>
          <ShieldAlert size={24} color="var(--accent-gold)" />
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>CMS</h2>
        </div>

        <div style={{ borderBottom: '1px solid var(--border-color)', margin: '0 1.5rem 2rem 1.5rem' }}></div>

        {isTabVisible('chapters') && (
          <button style={navItemStyle(activeList === 'chapters')} onClick={() => {setActiveList('chapters'); setEditingItem(null);}}>
            <Book size={18} /> Livro / Capítulos
          </button>
        )}
        {isTabVisible('pages') && (
          <button style={navItemStyle(activeList === 'pages')} onClick={() => {setActiveList('pages'); setEditingItem(null);}}>Bio e Apresentações</button>
        )}
        {isTabVisible('characters') && (
          <button style={navItemStyle(activeList === 'characters')} onClick={() => {setActiveList('characters'); setEditingItem(null);}}>Personagens</button>
        )}
        {isTabVisible('locations') && (
          <button style={navItemStyle(activeList === 'locations')} onClick={() => {setActiveList('locations'); setEditingItem(null);}}>Locais</button>
        )}
        {isTabVisible('organizations') && (
          <button style={navItemStyle(activeList === 'organizations')} onClick={() => {setActiveList('organizations'); setEditingItem(null);}}>Organizações</button>
        )}
        {isTabVisible('clues') && (
          <button style={navItemStyle(activeList === 'clues')} onClick={() => {setActiveList('clues'); setEditingItem(null);}}>Complementos</button>
        )}
        {isTabVisible('posts') && (
          <button style={navItemStyle(activeList === 'posts')} onClick={() => {setActiveList('posts'); setEditingItem(null);}}>Blog / Notícias</button>
        )}
        {isTabVisible('events') && (
          <button style={navItemStyle(activeList === 'events')} onClick={() => {setActiveList('events'); setEditingItem(null);}}>Eventos / Tags</button>
        )}
        {isTabVisible('reviews') && (
          <button style={navItemStyle(activeList === 'reviews')} onClick={() => {setActiveList('reviews'); setEditingItem(null);}}>
            <Star size={18} /> Avaliações
          </button>
        )}
        {isTabVisible('ideias') && (
          <button style={navItemStyle(activeList === 'ideias')} onClick={() => {setActiveList('ideias'); setEditingItem(null);}}>
            <Lightbulb size={18} /> Painel de Ideias
          </button>
        )}
        
        <div style={{ flex: 1 }}></div>
        {currentBook?.status !== 'draft' && !isReadOnly && (
          <button style={{...navItemStyle(false), background: '#2196F3', color: '#fff'}} onClick={() => setShowRequestModal(true)}>
            Solicitar alteração
          </button>
        )}
        {!isReadOnly && isTabVisible('synopsis') && (
          <button style={{...navItemStyle(activeList === 'synopsis'), background: activeList === 'synopsis' ? 'var(--accent-gold)' : 'rgba(212, 175, 55, 0.1)', color: activeList === 'synopsis' ? '#000' : 'var(--accent-gold)'}} onClick={() => {setActiveList('synopsis'); setEditingItem(null);}}>Publicar obra</button>
        )}
      </div>

      {/* Center Area: List */}
      <div style={{ flex: 1, padding: '3rem', overflowY: 'auto', backgroundColor: 'var(--bg-color)' }}>
        {activeList === 'pages' ? (
          <PagesConfig universe={data} onUpdate={onUpdate} isReadOnly={isReadOnly} currentBook={currentBook} onLogChange={onLogChange} />
        ) : activeList === 'synopsis' && currentBook ? (
          <SynopsisConfig book={currentBook} onUpdateBook={onUpdateBook} isReadOnly={isReadOnly} onLogChange={onLogChange} />
        ) : activeList === 'reviews' ? (
          renderReviewsTab()
        ) : activeList === 'ideias' ? (
          <BookIdeasBoard 
            book={currentBook} 
            onUpdateBook={(updatedBook) => onUpdateBook(updatedBook)}
          />
        ) : (
          <div style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '12px', minHeight: '100%', border: '1px solid var(--border-color)' }}>
            {!canCreateNew && currentUser?.role === 'author' && (
              <div style={{ background: 'rgba(255, 152, 0, 0.1)', border: '1px solid #ff9800', color: '#ff9800', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} />
                <span><strong>Atenção:</strong> Como o livro foi enviado, a criação de novos itens e edição de Capítulos estão bloqueados. As demais edições serão logadas para a Curadoria.</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <h1 style={{ fontSize: '1.8rem', fontFamily: "'Playfair Display', serif" }}>
                {activeList === 'characters' ? 'Personagens' : 
                 activeList === 'locations' ? 'Locais' : 
                 activeList === 'organizations' ? 'Organizações' : 
                 activeList === 'posts' ? 'Blog / Notícias' : 
                 activeList === 'events' ? 'Eventos / Ocorrências' : 
                 activeList === 'chapters' ? 'Capítulos do Livro' : 'Complementos'}
              </h1>
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                {canCreateNew && !isReadOnly && ['characters', 'locations', 'organizations', 'clues'].includes(activeList) && (
                  <label className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }} title="Dimensões recomendadas: Proporção 2:3 (Ex: 800x1200px)">
                    {uploading ? 'Enviando...' : <><Upload size={16} /> Alterar Capa Destaque</>}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFeatureImageUpload(e, activeList)} />
                  </label>
                )}
                {canCreateNew && !isReadOnly && (
                  <button className="btn-primary" onClick={handleNew} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    <Plus size={16} /> Novo Registro
                  </button>
                )}
              </div>
            </div>

            {renderSectionTutorial(activeList)}

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem', fontWeight: '500' }}>{activeList === 'chapters' ? '' : 'Imagem'}</th>
                  <th style={{ padding: '1rem', fontWeight: '500' }}>{activeList === 'posts' || activeList === 'chapters' ? 'Título' : 'Nome / Título'}</th>
                  <th style={{ padding: '1rem', fontWeight: '500' }}>{activeList === 'posts' ? 'Data' : activeList === 'chapters' ? 'Sessões' : 'Detalhe'}</th>
                  <th style={{ padding: '1rem', fontWeight: '500', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {(data[activeList] || []).length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum registro encontrado.</td>
                  </tr>
                ) : (
                  (data[activeList] || []).map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>
                        {activeList !== 'chapters' && (
                          <img src={item.image} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                        )}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>
                        <span 
                          onClick={() => {
                            if (!canViewChapter && activeList === 'chapters') return;
                            handleEdit(item, item.type || (activeList === 'chapters' ? 'chapter' : ''));
                          }} 
                          style={{ cursor: (!canViewChapter && activeList === 'chapters') ? 'default' : 'pointer', transition: 'color 0.2s', display: 'inline-block' }}
                          onMouseEnter={(e) => { if(!(!canViewChapter && activeList === 'chapters')) e.target.style.color = 'var(--accent-gold)' }}
                          onMouseLeave={(e) => { if(!(!canViewChapter && activeList === 'chapters')) e.target.style.color = '' }}
                          title={(!canViewChapter && activeList === 'chapters') ? '' : 'Clique para visualizar/editar'}
                        >
                          {item.title || item.name}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                        {item.type === 'post' ? item.date : 
                         item.type === 'chapter' ? `${item.pages?.length || 0} sessões` :
                         item.type === 'pista' ? 'Complemento' : item.territory}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {isReadOnly ? (
                          <button style={{ background: 'var(--border-color)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.8rem' }} onClick={() => handleEdit(item, item.type || (activeList === 'chapters' ? 'chapter' : ''))}>Visualizar</button>
                        ) : (
                          <>
                            {!(activeList === 'chapters' && !canEditChapter) && (
                              <button style={{ background: 'var(--border-color)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', marginRight: '0.5rem', padding: '0.5rem', borderRadius: '4px' }} onClick={() => handleEdit(item, item.type || (activeList === 'chapters' ? 'chapter' : ''))} title="Editar"><Edit2 size={16} /></button>
                            )}
                            {canCreateNew && (
                              <button style={{ background: 'rgba(255, 68, 68, 0.1)', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '0.5rem', borderRadius: '4px' }} onClick={() => handleDelete(item.id, item.type)} title="Excluir"><Trash2 size={16} /></button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Right Area: Edit Panel (Standard or Dossier) */}
      {editingItem && formData.type !== 'chapter' && (
        formData.type === 'post' || formData.type === 'evento' ? (
          <div style={{ width: '450px', borderLeft: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '-5px 0 25px rgba(0,0,0,0.5)', zIndex: 10, flexShrink: 0 }}>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1c20' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, fontFamily: "'Playfair Display', serif" }}>{isReadOnly ? 'Visualizar Registro' : (editingItem === 'new' ? 'Criar Registro' : 'Editar Registro')}</h2>
              <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {formData.type === 'post' ? (
                <>
                  <div style={formFieldStyle}>
                    <label>Título da Postagem</label>
                    <input type="text" name="title" value={formData.title || ''} onChange={handleChange} disabled={isReadOnly} className="form-input" style={{ opacity: isReadOnly ? 0.7 : 1 }} />
                  </div>
                  <div style={formFieldStyle}>
                    <label>Data de Publicação</label>
                    <input type="text" name="date" value={formData.date || ''} onChange={handleChange} disabled={isReadOnly} className="form-input" style={{ opacity: isReadOnly ? 0.7 : 1 }} />
                  </div>
                  <div style={formFieldStyle}>
                    <label>Conteúdo da Postagem</label>
                    <JoditEditor
                      value={formData.content || ''}
                      config={localEditorConfig}
                      onBlur={(newContent) => {
                        if (!isReadOnly) setFormData({ ...formData, content: newContent });
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div style={formFieldStyle}>
                    <label>Nome do Evento (Ex: Confusão no bar)</label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} disabled={isReadOnly} className="form-input" style={{ opacity: isReadOnly ? 0.7 : 1 }} />
                  </div>
                  <div style={formFieldStyle}>
                    <label>Descrição do Evento / Curiosidade</label>
                    <CustomEditor 
                      value={formData.content || ''} 
                      onChange={(val) => setFormData({...formData, content: val})} 
                      disabled={isReadOnly} 
                      placeholder="Escreva o conteúdo do subtema aqui..."
                    />
                  </div>
                  <div style={formFieldStyle}>
                    <label>Tags (Nomes separados por vírgula)</label>
                    <input type="text" name="tags" value={formData.tags || ''} onChange={handleChange} disabled={isReadOnly} className="form-input" placeholder="Ex: Luan, Camila, Bar da Esquina" style={{ opacity: isReadOnly ? 0.7 : 1 }} />
                    <small style={{ color: 'var(--text-muted)' }}>Ao colocar o nome idêntico de um personagem ou local aqui, este evento aparecerá no Dossiê dele(a).</small>
                  </div>
                </>
              )}
            </div>
            
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', justifyContent: 'flex-end', backgroundColor: '#1a1c20' }}>
              <button className="btn-secondary" onClick={() => setEditingItem(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={18} /> Voltar
              </button>
              {!isReadOnly && <button className="btn-primary" onClick={handleSave}><Save size={18} /> Salvar</button>}
            </div>
          </div>
        ) : (
          <DossierEditor 
            formData={formData} 
            setFormData={setFormData} 
            onSave={handleSave} 
            onCancel={() => setEditingItem(null)} 
            uploading={uploading} 
            handleFileUpload={handleFileUpload} 
            isReadOnly={isReadOnly}
            bookTitle={currentBook?.title}
          />
        )
      )}

      {/* Full Screen Modal: Chapter Editor (3 Columns) */}
      {editingItem && formData.type === 'chapter' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
          backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column',
          color: 'var(--text-main)'
        }}>
          {/* Header */}
          <div style={{ padding: '1.5rem 3rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1c20' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0, fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)' }}>
              {isReadOnly ? 'Visualizar Capítulo' : (editingItem === 'new' ? 'Escrever Novo Capítulo' : 'Editar Capítulo')}
            </h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setEditingItem(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={18} /> Voltar
              </button>
              {!isReadOnly && <button className="btn-primary" onClick={handleSave} style={{ padding: '0.8rem 1.5rem', fontSize: '1.1rem' }}><Save size={18} /> Salvar Capítulo</button>}
            </div>
          </div>
          
          {/* 3-Column Body */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* COLUMN 1: Left (Navegação de Subtemas) */}
            <div style={{ width: '320px', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', display: 'flex', flexDirection: 'column', padding: '2rem 1.5rem', gap: '2rem', overflowY: 'auto' }}>
              
              <div style={formFieldStyle}>
                <label style={{ fontSize: '1.1rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>Título do Capítulo</label>
                <input type="text" name="title" value={formData.title || ''} onChange={handleChange} disabled={isReadOnly} className="form-input" placeholder="Ex: Um dia comum" style={{ fontSize: '1.2rem', padding: '0.8rem', opacity: isReadOnly ? 0.7 : 1 }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 'bold' }}>Subtemas</h3>
                  {!isReadOnly && <button onClick={handleAddSubtheme} style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Novo Subtema"><Plus size={20} /></button>}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {uniqueSubthemes.map((subName, idx) => {
                    const isActive = subName === activeSubthemeStr;
                    return (
                      <button 
                        key={idx}
                        onClick={() => { setActiveSubthemeStr(subName); setActivePageIdxWithinSubtheme(0); }}
                        style={{
                          background: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                          color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
                          border: isActive ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                          padding: '0.8rem 1rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'all 0.2s'
                        }}
                      >
                        {subName || 'Sem Título'}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* COLUMN 2: Center (Editor de Texto) */}
            <div style={{ flex: 1, backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              
              {uniqueSubthemes.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Nenhum subtema configurado.</div>
              ) : activeSubthemePages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Nenhuma página encontrada.</div>
              ) : (() => {
                const activePage = activeSubthemePages[activePageIdxWithinSubtheme];
                if (!activePage) return null;

                return (
                  <>
                    <div style={{ padding: '2rem 3rem 0 3rem', flexShrink: 0 }}>
                      <input 
                        type="text" 
                        value={activeSubthemeStr || ''} 
                        onChange={(e) => handleSubthemeNameChange(e.target.value)} 
                        disabled={isReadOnly}
                        className="form-input" 
                        placeholder="Nome do Subtema..." 
                        style={{ fontSize: '2rem', padding: '1rem', fontFamily: "'Playfair Display', serif", backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid var(--border-color)', borderRadius: 0, color: 'var(--accent-gold)', opacity: isReadOnly ? 0.8 : 1 }} 
                      />

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                        {activeSubthemePages.map((p, idx) => (
                          <button 
                            key={idx}
                            onClick={() => setActivePageIdxWithinSubtheme(idx)}
                            style={{
                              background: idx === activePageIdxWithinSubtheme ? 'var(--card-bg)' : 'transparent',
                              color: idx === activePageIdxWithinSubtheme ? 'var(--text-main)' : 'var(--text-muted)',
                              border: '1px solid var(--border-color)',
                              borderBottom: idx === activePageIdxWithinSubtheme ? '1px solid var(--card-bg)' : '1px solid var(--border-color)',
                              padding: '0.6rem 1.5rem', borderRadius: '8px 8px 0 0', cursor: 'pointer',
                              fontWeight: idx === activePageIdxWithinSubtheme ? 'bold' : 'normal',
                              marginBottom: '-1px', zIndex: idx === activePageIdxWithinSubtheme ? 2 : 1
                            }}
                          >
                            Sessão {idx + 1}
                          </button>
                        ))}
                        {!isReadOnly && (
                          <button 
                            onClick={handleAddPageToSubtheme} 
                            style={{ background: 'transparent', color: 'var(--accent-gold)', border: '1px dashed var(--accent-gold)', padding: '0.6rem 1.2rem', borderRadius: '8px 8px 0 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}
                          >
                            <Plus size={14} /> Nova Sessão
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ flex: 1, padding: '0 3rem 3rem 3rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                      <CustomEditor
                        value={activePage.text || ''}
                        onChange={(newContent) => {
                          if (!isReadOnly) handlePageChange(activePage.globalIdx, 'text', newContent);
                        }}
                        disabled={isReadOnly}
                        placeholder="Escreva a sessão do capítulo aqui..."
                      />
                    </div>
                  </>
                );
              })()}
            </div>

            {/* COLUMN 3: Right (Imagem e Ações) */}
            <div style={{ width: '340px', borderLeft: '1px solid var(--border-color)', backgroundColor: '#1a1c20', display: 'flex', flexDirection: 'column', padding: '2.5rem', gap: '2rem', overflowY: 'auto' }}>
              
              {uniqueSubthemes.length > 0 && activeSubthemePages.length > 0 && (() => {
                const activePage = activeSubthemePages[activePageIdxWithinSubtheme];
                if (!activePage) return null;

                return (
                  <>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Mídia da Sessão {activePageIdxWithinSubtheme + 1}</h3>
                    
                    <div style={formFieldStyle}>
                      <label style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Ilustração (Aparece na direita do Leitor)</label>
                      {activePage.image && <img src={activePage.image} style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '0.5rem' }} />}
                      
                      {!isReadOnly ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                          <label className="btn-secondary" style={{ cursor: 'pointer', margin: 0, padding: '0.8rem', justifyContent: 'center' }}>
                            {uploading ? 'Enviando...' : <><Upload size={18} /> Fazer Upload da Imagem</>}
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handlePageImageUpload(e, activePage.globalIdx)} />
                          </label>
                          <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>OU COLE UMA URL</div>
                          <input type="text" value={activePage.image || ''} onChange={(e) => handlePageChange(activePage.globalIdx, 'image', e.target.value)} className="form-input" placeholder="https://..." style={{ padding: '0.8rem', fontSize: '0.9rem' }} />
                        </div>
                      ) : (
                        activePage.image && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.5rem' }}>Link: {activePage.image}</div>
                      )}
                    </div>

                    {!isReadOnly && (
                      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,68,68,0.2)', paddingTop: '2rem' }}>
                        <button onClick={() => {
                          handleRemoveGlobalPage(activePage.globalIdx);
                        }} style={{ width: '100%', background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: '1px solid rgba(255, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                          <Trash2 size={18} /> Excluir Sessão Atual
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}

            </div>

          </div>
        </div>
      )}

      {showRequestModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'var(--card-bg)', padding: '3rem', borderRadius: '12px', width: '500px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', marginTop: 0 }}>Pedido de Alteração</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>O livro já foi publicado ou enviado. A criação de novos capítulos e personagens passará por avaliação.</p>
            
            <div style={formFieldStyle}>
              <label>O que você quer editar/adicionar?</label>
              <input type="text" value={requestData.what} onChange={(e) => setRequestData({...requestData, what: e.target.value})} className="form-input" placeholder="Ex: Adicionar um novo personagem..." />
            </div>
            
            <div style={formFieldStyle}>
              <label>Por que deseja realizar essa alteração?</label>
              <textarea value={requestData.why} onChange={(e) => setRequestData({...requestData, why: e.target.value})} className="form-input" rows="3"></textarea>
            </div>
            
            <div style={formFieldStyle}>
              <label>Qual o impacto na obra já publicada?</label>
              <textarea value={requestData.impact} onChange={(e) => setRequestData({...requestData, impact: e.target.value})} className="form-input" rows="3"></textarea>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn-secondary" onClick={() => setShowRequestModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSendRequest} style={{ background: '#2196F3' }}>Enviar Pedido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
