import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { Save, Upload, Info, X, Menu } from 'lucide-react';
import { uploadImage } from '../lib/supabaseClient';

const defaultPages = {
  characters: { title: "Personagens", author: "Habitantes do Universo", category: "Conheça os protagonistas e antagonistas", description: "Explore os perfis, motivações e segredos de cada personagem desta história.", image: "/characters_cover.png" },
  locations: { title: "Locais e Territórios", author: "Geografia do Mundo", category: "Onde tudo acontece", description: "Navegue pelos cenários da história. Descubra as zonas seguras, os territórios perigosos e os esconderijos.", image: "/locations_cover.png" },
  organizations: { title: "Organizações", author: "Estruturas de Poder", category: "Facções, Comércios e Instituições", description: "Entenda a engrenagem que move este mundo. De pequenos grupos a grandes impérios.", image: "/org_cover.png" },
  clues: { title: "Complementos", author: "Dossiês Complementares", category: "Complementos e Extras", description: "Explore informações, materiais e arquivos complementares que enriquecem o universo da obra.", image: "/clues_cover.png" }
};

export default function PagesConfig({ universe, onUpdate, isReadOnly, currentBook, onLogChange, onOpenMenu }) {
  const [pages, setPages] = useState(universe.pages || defaultPages);
  const [activeTab, setActiveTab] = useState('characters');
  const [uploading, setUploading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const currentPage = pages[activeTab] || defaultPages[activeTab];

  const handleChange = (e) => {
    const newPages = { ...pages };
    newPages[activeTab] = { ...currentPage, [e.target.name]: e.target.value };
    setPages(newPages);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        const newPages = { ...pages };
        newPages[activeTab] = { ...currentPage, image: url };
        setPages(newPages);
      }
    } catch (err) {
      console.error('Erro no upload', err);
      toast.error(err.message || 'Erro ao fazer upload da capa.');
    }
    setUploading(false);
  };

  const handleSave = () => {
    onUpdate({ ...universe, pages });
    toast("Configurações das páginas salvas com sucesso!");
  };

  const getTabTutorial = (tabKey) => {
    const tutorials = {
      characters: {
        title: "✍️ Apresentação da Galeria de Personagens",
        purpose: "Configurar o cabeçalho e banner de introdução que os leitores veem ao acessar a aba de Personagens no Universo do seu livro. Permite mudar o título da seção, subtítulo/crédito, categoria curta, descrição geral e imagem de capa da seção.",
        where: "Na vitrine do Universo do livro. Quando o leitor clica no menu 'Personagens', o banner superior exibirá a imagem de capa (proporção sugerida 2:3) e a descrição configurada aqui.",
        dim: "Proporção recomendada para a imagem de capa: 2:3 (Ex: 800 x 1200 pixels)."
      },
      locations: {
        title: "✍️ Apresentação do Guia de Locais",
        purpose: "Personalizar o banner de entrada e a descrição geral dos cenários, infraestrutura e geografia da obra. Você pode definir uma imagem marcante do seu mundo fictício e um texto que situe o leitor sobre a ambientação geral.",
        where: "Na aba 'Locais' do Universo. O leitor verá essa capa e descrição destacadas no topo da página antes da lista de locais cadastrados.",
        dim: "Proporção recomendada para a imagem de capa: 2:3 (Ex: 800 x 1200 pixels)."
      },
      organizations: {
        title: "✍️ Apresentação da Estrutura de Organizações",
        purpose: "Customizar as informações do banner introdutório sobre as corporações, gangues, órgãos públicos, clãs e entidades da sua história. Ideal para dar uma visão geral do balanço de poder no seu universo.",
        where: "Na aba 'Organizações' do Universo. O leitor acessa o banner com os dados gerais configurados aqui logo na abertura da aba.",
        dim: "Proporção recomendada para a imagem de capa: 2:3 (Ex: 800 x 1200 pixels)."
      },
      clues: {
        title: "✍️ Apresentação da Seção de Complementos",
        purpose: "Configurar o banner e descrição dos materiais extras, lendas, raças ou segredos do livro. Você pode renomear a aba para 'Lore', 'Extras' ou manter 'Complementos', definindo um texto atrativo de introdução à lore oculta.",
        where: "Na aba 'Complementos' do Universo do livro. O leitor visualiza os detalhes deste banner ao abrir a seção de lore extra.",
        dim: "Proporção recomendada para a imagem de capa: 2:3 (Ex: 800 x 1200 pixels)."
      }
    };
    return tutorials[tabKey] || tutorials.characters;
  };

  const tut = getTabTutorial(activeTab);
  const formFieldStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' };

  return (
    <div className="pages-config-container">
      {/* Tabs Menu */}
      <div className="pages-config-sidebar">
        <h3 style={{ padding: '1.5rem', margin: 0, borderBottom: '1px solid var(--border-color)', color: 'var(--accent-gold)', fontFamily: "'Playfair Display', serif" }}>Seções do Universo</h3>
        
        {['characters', 'locations', 'organizations', 'clues'].map(tabKey => (
          <button 
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={activeTab === tabKey ? 'active' : ''}
            style={{ 
              background: activeTab === tabKey ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
              color: activeTab === tabKey ? 'var(--accent-gold)' : 'var(--text-muted)',
              border: 'none', borderBottom: '1px solid var(--border-color)', borderLeft: activeTab === tabKey ? '4px solid var(--accent-gold)' : '4px solid transparent',
              padding: '1.5rem', textAlign: 'left', cursor: 'pointer', fontWeight: activeTab === tabKey ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            {tabKey === 'characters' ? 'Personagens' : tabKey === 'locations' ? 'Locais' : tabKey === 'organizations' ? 'Organizações' : 'Complementos'}
          </button>
        ))}
      </div>

      {/* Editor Content */}
      <div className="pages-config-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: 'var(--text-main)' }}>Personalizar: {currentPage.title}</h2>
            <button 
              onClick={() => setShowTutorial(true)} 
              title="Ajuda / Tutorial"
              style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
            >
              <Info size={20} />
            </button>
            {onOpenMenu && (
              <button 
                className="mobile-only admin-mobile-menu-btn"
                onClick={onOpenMenu}
                style={{ background: 'var(--accent-gold)', color: '#000', border: 'none', padding: '0.4rem 0.6rem', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Menu size={20} />
              </button>
            )}
          </div>
          {!isReadOnly && (
            <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={18} /> Salvar Configurações
            </button>
          )}
        </div>

        {/* Tutorial Modal */}
        {showTutorial && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--accent-gold)', borderRadius: '12px', padding: '2rem', maxWidth: '500px', width: '100%', position: 'relative' }}>
              <button 
                onClick={() => setShowTutorial(false)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
              <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.2rem', paddingRight: '2rem' }}>
                {tut.title}
              </div>
              <div style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
                <p style={{ margin: '0 0 1rem 0' }}><strong>Para que serve:</strong> {tut.purpose}</p>
                <p style={{ margin: '0 0 1rem 0' }}><strong>Onde o leitor acessa:</strong> {tut.where}</p>
                <p style={{ margin: 0, color: 'var(--accent-gold)' }}><strong>Dimensões sugeridas:</strong> {tut.dim}</p>
              </div>
            </div>
          </div>
        )}

        <div className="pages-config-form-split">
          <div style={{ flex: 1 }}>
            <div style={formFieldStyle}>
              <label style={{ color: 'var(--text-muted)' }}>Título da Seção</label>
              <input type="text" name="title" value={currentPage.title} onChange={handleChange} disabled={isReadOnly} className="form-input" style={{ opacity: isReadOnly ? 0.7 : 1 }} />
            </div>

            <div style={formFieldStyle}>
              <label style={{ color: 'var(--text-muted)' }}>Subtítulo / Autor Simulado</label>
              <input type="text" name="author" value={currentPage.author} onChange={handleChange} disabled={isReadOnly} className="form-input" placeholder="Ex: Geografia da Guerra" style={{ opacity: isReadOnly ? 0.7 : 1 }} />
            </div>

            <div style={formFieldStyle}>
              <label style={{ color: 'var(--text-muted)' }}>Categoria Curta</label>
              <input type="text" name="category" value={currentPage.category} onChange={handleChange} disabled={isReadOnly} className="form-input" placeholder="Ex: Conheça os protagonistas e antagonistas" style={{ opacity: isReadOnly ? 0.7 : 1 }} />
            </div>

            <div style={formFieldStyle}>
              <label style={{ color: 'var(--text-muted)' }}>Descrição Longa</label>
              <textarea name="description" value={currentPage.description} onChange={handleChange} disabled={isReadOnly} className="form-input" rows="4" style={{ opacity: isReadOnly ? 0.7 : 1 }}></textarea>
            </div>
          </div>

          <div className="pages-config-image-container">
            <div style={formFieldStyle}>
              <label style={{ color: 'var(--text-muted)' }}>Imagem de Capa (Aparece na direita)</label>
              {currentPage.image && <img src={currentPage.image} alt="Preview" style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />}
              
              {!isReadOnly && (
                <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  {uploading ? 'Enviando...' : <><Upload size={16} /> Enviar Nova Imagem</>}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
