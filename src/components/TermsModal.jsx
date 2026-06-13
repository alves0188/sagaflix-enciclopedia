import { X, Shield, BookOpen, AlertTriangle } from 'lucide-react';

export default function TermsModal({ isOpen, onClose, role }) {
  if (!isOpen) return null;

  const isAuthor = role === 'author';

  return (
    <div className="modal-overlay" style={{ zIndex: 99999, backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.8)' }}>
      <div className="modal-content" style={{ 
        maxWidth: '800px', 
        width: '90%', 
        maxHeight: '85vh', 
        display: 'flex', 
        flexDirection: 'column', 
        padding: 0,
        background: 'var(--bg-color)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isAuthor ? <BookOpen size={24} color="var(--accent-gold)" /> : <Shield size={24} color="var(--accent-gold)" />}
            <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)' }}>
              Termos de Uso e Privacidade ({isAuthor ? 'Autores' : 'Leitores'})
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
          
          <div style={{ background: 'rgba(226, 192, 68, 0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--accent-gold)', marginBottom: '2rem' }}>
            <strong>Aviso Importante:</strong> A leitura e concordância com os termos abaixo é obrigatória para a criação da sua conta na Sagaflix.
          </div>

          {isAuthor ? (
            <>
              <h3 style={{ color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>1. Direitos Autorais e Propriedade Intelectual</h3>
              <p>A Sagaflix <strong>não retém, não compra e não se apropria</strong> dos direitos autorais de nenhuma obra publicada em nossa plataforma. Você, como autor, é o único e exclusivo detentor de 100% dos direitos intelectuais e comerciais sobre as suas histórias.</p>
              <p>Ao publicar uma obra na Sagaflix, você nos concede apenas uma <strong>Licença Não-Exclusiva, Gratuita e Revogável</strong> para hospedar, formatar e exibir o seu texto para os nossos leitores. Você é livre para publicar a mesma obra em outras plataformas, editoras físicas ou vendê-la na Amazon simultaneamente.</p>

              <h3 style={{ color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginTop: '1.5rem' }}>2. Originalidade e Proibição de Plágio</h3>
              <p>Você declara e garante, sob as penas da lei civil e criminal brasileira, que <strong>todo o conteúdo publicado em sua conta é de sua autoria original</strong>, ou que você possui autorização expressa e documentada dos detentores dos direitos para publicá-lo (como no caso de traduções oficiais).</p>
              <p>A Sagaflix tem uma política de <strong>Tolerância Zero para Plágio</strong>. Caso a plataforma receba uma denúncia comprovada de violação de direitos autorais, a obra e a conta do infrator serão deletadas sumariamente, sem aviso prévio. A responsabilidade jurídica por danos a terceiros causados por plágio recairá inteiramente sobre o usuário que realizou a publicação.</p>

              <h3 style={{ color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginTop: '1.5rem' }}>3. Responsabilidade pelo Conteúdo</h3>
              <p>O autor é o único responsável legal pelo teor de suas obras. É estritamente proibido publicar conteúdo que promova discurso de ódio, racismo, homofobia, apologia a crimes, pedofilia ou qualquer material que viole os Direitos Humanos ou as leis vigentes na República Federativa do Brasil.</p>
              
              <h3 style={{ color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginTop: '1.5rem' }}>4. Isenção de Responsabilidade sobre Comentários (Safe Harbor)</h3>
              <p>A Sagaflix atua como provedora de hospedagem (nos termos do Marco Civil da Internet) e <strong>não exerce controle prévio, moderação ou edição</strong> sobre os comentários, avaliações e mensagens postadas por usuários e leitores em suas obras.</p>
              <p>Sendo assim, a plataforma <strong>não se responsabiliza civil ou criminalmente</strong> pelas opiniões, críticas, injúrias ou ofensas proferidas por terceiros no ambiente do site. Em caso de infrações ou quebra de decoro, a Sagaflix se compromete a remover o conteúdo nocivo mediante denúncia, aplicar sanções administrativas (banimento) ao infrator e fornecer os registros de acesso (IP) às autoridades competentes mediante ordem judicial, caso o autor ofendido decida tomar medidas legais.</p>
              
              <h3 style={{ color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginTop: '1.5rem' }}>5. Privacidade (LGPD) e Rescisão</h3>
              <p>Coletamos apenas os dados essenciais (Nome, E-mail e IP de cadastro) para o funcionamento da sua conta, em conformidade com a Lei Geral de Proteção de Dados (LGPD). Suas senhas são criptografadas e inacessíveis para nós.</p>
              <p>Você tem o direito de encerrar o presente acordo a qualquer momento. Para isso, basta utilizar a função <strong>"Excluir Minha Conta"</strong> no seu painel. Ao fazer isso, todos os seus dados pessoais, bem como todos os seus livros e capítulos hospedados, serão permanentemente e irreversivelmente apagados dos nossos servidores.</p>
            </>
          ) : (
            <>
              <h3 style={{ color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>1. Proteção às Obras e Direitos Autorais</h3>
              <p>A Sagaflix é uma plataforma criada para apoiar autores nacionais. Ao utilizar nosso sistema, você se compromete a <strong>respeitar os direitos autorais</strong> de todas as obras hospedadas aqui.</p>
              <p>É <strong>terminantemente proibido</strong> reproduzir, copiar, distribuir, vender, traduzir, publicar em blogs/grupos de WhatsApp ou realizar a extração automatizada de dados (web scraping) de qualquer obra literária, capítulo ou sinopse hospedada na Sagaflix para uso externo, sem a autorização prévia e escrita do autor original.</p>
              <p>Violações a esta regra configurarão infração de direitos autorais (Art. 184 do Código Penal Brasileiro e Lei nº 9.610/98) e resultarão no banimento imediato da sua conta, além do fornecimento de dados às autoridades para medidas legais cabíveis.</p>

              <h3 style={{ color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginTop: '1.5rem' }}>2. Código de Conduta e Respeito à Comunidade</h3>
              <p>O leitor se compromete a manter uma conduta civilizada e respeitosa em todas as interações dentro da plataforma (comentários, avaliações e mensagens). Avaliações destrutivas, discurso de ódio, assédio ou ofensas pessoais direcionadas aos autores ou a outros leitores não serão tolerados.</p>

              <h3 style={{ color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginTop: '1.5rem' }}>3. Isenção de Responsabilidade sobre Comentários (Safe Harbor)</h3>
              <p>A Sagaflix é um instrumento de divulgação de cultura e conhecimento, e <strong>não exerce controle prévio ou moderação</strong> sobre as opiniões emitidas pelos usuários. A plataforma <strong>não se responsabiliza civil ou criminalmente</strong> por comentários ofensivos ou injúrias proferidas por indivíduos no ambiente do site.</p>
              <p>A responsabilidade por atos ilícitos cometidos na plataforma recairá exclusivamente sobre o usuário infrator. A Sagaflix removerá contas tóxicas mediante denúncia e colaborará com as autoridades fornecendo dados de acesso (IP) caso as partes ofendidas busquem reparação legal.</p>

              <h3 style={{ color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginTop: '1.5rem' }}>4. Privacidade e Proteção de Dados (LGPD)</h3>
              <p>A Sagaflix valoriza a sua privacidade. Coletamos apenas os dados essenciais para permitir o seu acesso à plataforma: Nome, E-mail e histórico/preferências de leitura (para recomendar novos livros e registrar o seu progresso).</p>
              <p>Nós <strong>não vendemos</strong> seus dados pessoais para terceiros. Suas senhas são altamente criptografadas através do nosso provedor de autenticação e são inacessíveis até mesmo para os administradores do sistema.</p>
              <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você detém o <strong>Direito ao Esquecimento</strong>. A qualquer momento, você pode acessar as configurações do seu Perfil e solicitar a exclusão permanente e irreversível da sua conta e de todo o seu rastro de dados dos nossos servidores.</p>
            </>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', background: 'var(--card-bg)' }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '0.8rem 2rem' }}>
            Fechar e Voltar ao Cadastro
          </button>
        </div>
      </div>
    </div>
  );
}
