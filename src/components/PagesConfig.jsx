import { useState } from 'react';
import { Save, Upload } from 'lucide-react';

const defaultPages = {
  characters: { title: "Personagens", author: "Habitantes do Universo", category: "Conheça os protagonistas e antagonistas", description: "Explore os perfis, motivações e segredos de cada personagem desta história.", image: "/characters_cover.png" },
  locations: { title: "Locais e Territórios", author: "Geografia do Mundo", category: "Onde tudo acontece", description: "Navegue pelos cenários da história. Descubra as zonas seguras, os territórios perigosos e os esconderijos.", image: "/locations_cover.png" },
  organizations: { title: "Organizações", author: "Estruturas de Poder", category: "Facções, Comércios e Instituições", description: "Entenda a engrenagem que move este mundo. De pequenos grupos a grandes impérios.", image: "/org_cover.png" },
  clues: { title: "Complementos", author: "Dossiês Complementares", category: "Complementos e Extras", description: "Explore informações, materiais e arquivos complementares que enriquecem o universo da obra.", image: "/clues_cover.png" }
};

export default function PagesConfig({ universe, onUpdate, isReadOnly }) {
  const [pages, setPages] = useState(universe.pages || defaultPages);
  const [activeTab, setActiveTab] = useState('characters');
  const [uploading, setUploading] = useState(false);

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
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: uploadData
      });
      const data = await res.json();
      const newPages = { ...pages };
      newPages[activeTab] = { ...currentPage, image: data.url };
      setPages(newPages);
    } catch (err) {
      console.error('Erro no upload', err);
      alert('Erro ao fazer upload da capa.');
    }
    setUploading(false);
  };

  const handleSave = () => {
    onUpdate({ ...universe, pages });
    alert("Configurações das páginas salvas com sucesso!");
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
    <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', overflow: 'hidden', height: '100%' }}>
      {/* Tabs Menu */}
      <div style={{ width: '250px', borderRight: '1px solid var(--border-color)', backgroundColor: '#1a1c20', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ padding: '1.5rem', margin: 0, borderBottom: '1px solid var(--border-color)', color: 'var(--accent-gold)', fontFamily: "'Playfair Display', serif" }}>Seções do Universo</h3>
        
        {['characters', 'locations', 'organizations', 'clues'].map(tabKey => (
          <button 
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
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
      <div style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: 'var(--text-main)' }}>Personalizar: {currentPage.title}</h2>
          {!isReadOnly && (
            <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={18} /> Salvar Configurações
            </button>
          )}
        </div>

        {/* Tutorial Box */}
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
          <p style={{ margin: 0 }}><strong>Dimensões sugeridas:</strong> {tut.dim}</p>
        </div>

        <div style={{ display: 'flex', gap: '3rem' }}>
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

          <div style={{ width: '300px' }}>
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
