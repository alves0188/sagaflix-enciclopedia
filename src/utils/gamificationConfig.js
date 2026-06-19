export const BADGE_CATEGORIES = [
  { id: 'cat1', name: 'Jornada de leitura', sub: 'Progresso e volume', icon: 'ti-book-2', bg: '#FAEEDA', color: '#854F0B' },
  { id: 'cat2', name: 'Sequências e constância', sub: 'Hábito de leitura diária', icon: 'ti-flame', bg: '#E1F5EE', color: '#0F6E56' },
  { id: 'cat3', name: 'Explorador de autores', sub: 'Diversidade de leituras', icon: 'ti-users', bg: '#EEEDFE', color: '#534AB7' },
  { id: 'cat4', name: 'Crítico literário', sub: 'Avaliações e engajamento', icon: 'ti-star', bg: '#FAECE7', color: '#993C1D' },
  { id: 'cat5', name: 'Velocidade e foco', sub: 'Tempo e sessões de leitura', icon: 'ti-clock', bg: '#E6F1FB', color: '#185FA5' },
  { id: 'cat6', name: 'Lendas da plataforma', sub: 'Conquistas máximas', icon: 'ti-crown', bg: '#FBEAF0', color: '#993556' }
];

export const BADGES_DB = {
  cat1: [
    { id: 'b_1_1', icon: "ti-book", bg: "#FAEEDA", ic: "#854F0B", name: "Primeiras páginas", meta: "Leia o 1º capítulo", tier: "bronze", xp: 50, desc: "Você deu o primeiro passo. Toda grande jornada começa com a primeira página.", progMax: 1, trigger: 'chapters_read' },
    { id: 'b_1_2', icon: "ti-books", bg: "#FAEEDA", ic: "#854F0B", name: "Obra completa", meta: "Finalize 1 livro", tier: "bronze", xp: 100, desc: "Você concluiu sua primeira obra. O fim de um livro é o começo de outro.", progMax: 1, trigger: 'books_finished' },
    { id: 'b_1_3', icon: "ti-stack-2", bg: "#FAC775", ic: "#633806", name: "Maratona literária", meta: "Finalize 5 livros", tier: "silver", xp: 250, desc: "Cinco histórias, cinco universos. Você está construindo sua biblioteca pessoal.", progMax: 5, trigger: 'books_finished' },
    { id: 'b_1_4', icon: "ti-library", bg: "#FAC775", ic: "#633806", name: "Colecionador", meta: "Finalize 20 livros", tier: "gold", xp: 600, desc: "Vinte obras concluídas. Sua estante virtual é invejável.", progMax: 20, trigger: 'books_finished' },
    { id: 'b_1_5', icon: "ti-world-book", bg: "#B5D4F4", ic: "#0C447C", name: "Leitor voraz", meta: "Finalize 50 livros", tier: "diamond", xp: 1500, desc: "Cinquenta livros. Você leu mais do que muitas pessoas em uma vida inteira.", progMax: 50, trigger: 'books_finished' },
    { id: 'b_1_6', icon: "ti-bookmark", bg: "#FAEEDA", ic: "#854F0B", name: "Metade do caminho", meta: "Leia 50% de qualquer obra", tier: "bronze", xp: 40, desc: "Chegou à metade. A partir daqui, a história te puxa sozinha.", progMax: 1, trigger: 'book_halfway' },
  ],
  cat2: [
    { id: 'b_2_1', icon: "ti-flame", bg: "#E1F5EE", ic: "#0F6E56", name: "Três dias seguidos", meta: "Leia por 3 dias seguidos", tier: "bronze", xp: 60, desc: "A consistência começa com pequenos passos. Você já tem uma chama acesa.", progMax: 3, trigger: 'streak_days' },
    { id: 'b_2_2', icon: "ti-flame", bg: "#5DCAA5", ic: "#085041", name: "Semana perfeita", meta: "Leia por 7 dias seguidos", tier: "silver", xp: 150, desc: "Uma semana inteira sem parar. O hábito está se formando.", progMax: 7, trigger: 'streak_days' },
    { id: 'b_2_3', icon: "ti-calendar-check", bg: "#FAC775", ic: "#633806", name: "Mês de ouro", meta: "Leia por 30 dias seguidos", tier: "gold", xp: 500, desc: "Trinta dias consecutivos. Isso não é mais um hábito — é um estilo de vida.", progMax: 30, trigger: 'streak_days' },
    { id: 'b_2_4', icon: "ti-calendar-stats", bg: "#B5D4F4", ic: "#0C447C", name: "Cem dias", meta: "Leia por 100 dias seguidos", tier: "diamond", xp: 2000, desc: "Cem dias sem falhar. Você entrou para a história desta plataforma.", progMax: 100, trigger: 'streak_days' },
    { id: 'b_2_5', icon: "ti-moon", bg: "#FAEEDA", ic: "#854F0B", name: "Leitor noturno", meta: "Leia após as 22h por 5x", tier: "bronze", xp: 80, desc: "As melhores histórias são lidas quando o mundo dorme.", progMax: 5, trigger: 'night_reads' },
    { id: 'b_2_6', icon: "ti-sun", bg: "#FAEEDA", ic: "#854F0B", name: "Manhã literária", meta: "Leia antes das 8h por 5x", tier: "bronze", xp: 80, desc: "Começar o dia com um bom livro é o ritual dos grandes leitores.", progMax: 5, trigger: 'morning_reads' },
  ],
  cat3: [
    { id: 'b_3_1', icon: "ti-user-check", bg: "#EEEDFE", ic: "#534AB7", name: "Novo fã", meta: "Leia 2 obras do mesmo autor", tier: "bronze", xp: 100, desc: "Você encontrou um autor que te conquista. Isso é especial.", progMax: 2, trigger: 'same_author' },
    { id: 'b_3_2', icon: "ti-users", bg: "#AFA9EC", ic: "#3C3489", name: "Fiel seguidor", meta: "Leia 5 obras do mesmo autor", tier: "silver", xp: 300, desc: "Cinco obras do mesmo autor. Você conhece a voz dele melhor do que ninguém.", progMax: 5, trigger: 'same_author' },
    { id: 'b_3_3', icon: "ti-map", bg: "#EEEDFE", ic: "#534AB7", name: "Explorador", meta: "Leia obras de 5 autores diferentes", tier: "bronze", xp: 150, desc: "Cada autor é um mundo diferente. Você está expandindo seus horizontes.", progMax: 5, trigger: 'unique_authors' },
    { id: 'b_3_4', icon: "ti-world", bg: "#AFA9EC", ic: "#3C3489", name: "Cosmopolita", meta: "Leia obras de 15 autores", tier: "gold", xp: 400, desc: "Quinze vozes diferentes enriquecendo sua visão de mundo.", progMax: 15, trigger: 'unique_authors' },
    { id: 'b_3_5', icon: "ti-tags", bg: "#EEEDFE", ic: "#534AB7", name: "Eclético", meta: "Leia em 5 gêneros diferentes", tier: "silver", xp: 200, desc: "Romance, fantasia, terror, drama... Você não se limita a um único universo.", progMax: 5, trigger: 'unique_genres' },
    { id: 'b_3_6', icon: "ti-sparkles", bg: "#AFA9EC", ic: "#3C3489", name: "Descobridor", meta: "Leia uma obra recém-publicada", tier: "bronze", xp: 80, desc: "Você foi um dos primeiros a explorar essa história. Um pioneiro.", progMax: 1, trigger: 'new_release_read' },
  ],
  cat4: [
    { id: 'b_4_1', icon: "ti-star", bg: "#FAECE7", ic: "#993C1D", name: "Primeira opinião", meta: "Avalie 1 livro", tier: "bronze", xp: 50, desc: "Você compartilhou o que sentiu. Avaliações ajudam outros leitores a descobrir boas histórias.", progMax: 1, trigger: 'reviews_count' },
    { id: 'b_4_2', icon: "ti-stars", bg: "#F0997B", ic: "#712B13", name: "Crítico em ascensão", meta: "Avalie 10 livros", tier: "silver", xp: 200, desc: "Dez avaliações. Sua opinião começa a moldar o gosto da comunidade.", progMax: 10, trigger: 'reviews_count' },
    { id: 'b_4_3', icon: "ti-pencil", bg: "#FAECE7", ic: "#993C1D", name: "Comentarista", meta: "Deixe 5 comentários", tier: "bronze", xp: 80, desc: "Você vai além da nota — você constrói diálogo.", progMax: 5, trigger: 'comments_count' },
    { id: 'b_4_4', icon: "ti-heart", bg: "#FAECE7", ic: "#993C1D", name: "Favorito", meta: "Adicione 10 livros à biblioteca", tier: "bronze", xp: 60, desc: "Dez livros salvos. Sua lista de desejos já é uma lista de tesouros.", progMax: 10, trigger: 'library_saves' },
    { id: 'b_4_5', icon: "ti-thumb-up", bg: "#F0997B", ic: "#712B13", name: "Influência", meta: "5 curtidas nas suas avaliações", tier: "silver", xp: 150, desc: "Outras pessoas acharam sua opinião útil. Você tem voz nessa comunidade.", progMax: 5, trigger: 'likes_received' },
    { id: 'b_4_6', icon: "ti-award", bg: "#FAECE7", ic: "#993C1D", name: "Avaliação destaque", meta: "Receba 20 curtidas em 1 review", tier: "gold", xp: 350, desc: "Uma avaliação tão boa que virou referência. Isso é crítica literária de verdade.", progMax: 20, trigger: 'likes_received_single' },
  ],
  cat5: [
    { id: 'b_5_1', icon: "ti-bolt", bg: "#E6F1FB", ic: "#185FA5", name: "Leitura relâmpago", meta: "Leia um capítulo em < 5 min", tier: "bronze", xp: 40, desc: "Rápido e focado. Às vezes a história simplesmente te puxa.", progMax: 1, trigger: 'fast_chapter' },
    { id: 'b_5_2', icon: "ti-hourglass", bg: "#85B7EB", ic: "#0C447C", name: "Sessão longa", meta: "Leia por 2h sem parar", tier: "silver", xp: 200, desc: "Duas horas de imersão total. O mundo externo simplesmente desapareceu.", progMax: 120, trigger: 'long_session_mins' },
    { id: 'b_5_3', icon: "ti-clock-play", bg: "#E6F1FB", ic: "#185FA5", name: "50 horas lidas", meta: "Acumule 50h de leitura", tier: "gold", xp: 600, desc: "Cinquenta horas dentro de histórias. Isso é dedicação de verdade.", progMax: 3000, trigger: 'total_mins_read' },
    { id: 'b_5_4', icon: "ti-player-play", bg: "#85B7EB", ic: "#0C447C", name: "Madrugada literária", meta: "Leia mais de 3h em 1 dia", tier: "silver", xp: 250, desc: "Três horas em um único dia. Você claramente não conseguia parar.", progMax: 1, trigger: 'marathon_day' },
    { id: 'b_5_5', icon: "ti-target", bg: "#E6F1FB", ic: "#185FA5", name: "Foco total", meta: "Leia 10 dias em modo foco", tier: "silver", xp: 180, desc: "Sem distrações, sem interrupções. Só você e a história.", progMax: 10, trigger: 'focus_mode_days' },
    { id: 'b_5_6', icon: "ti-run", bg: "#E6F1FB", ic: "#185FA5", name: "Velocidade de leitura", meta: "Termine um livro em < 3 dias", tier: "gold", xp: 300, desc: "Um livro inteiro em menos de 72 horas. Você devorou essa obra.", progMax: 1, trigger: 'fast_book' },
  ],
  cat6: [
    { id: 'b_6_1', icon: "ti-crown", bg: "#CECBF6", ic: "#3C3489", name: "Lenda do BookFlix", meta: "Desbloqueie 30 selos", tier: "legend", xp: 5000, desc: "Trinta selos conquistados. Você é uma referência absoluta nesta plataforma.", progMax: 30, trigger: 'total_badges' },
    { id: 'b_6_2', icon: "ti-trophy", bg: "#CECBF6", ic: "#3C3489", name: "O autor preferido", meta: "Leia tudo de 1 autor", tier: "legend", xp: 3000, desc: "Você leu a obra completa de um autor. Isso é devoção literária.", progMax: 1, trigger: 'full_author_read' },
    { id: 'b_6_3', icon: "ti-infinity", bg: "#CECBF6", ic: "#3C3489", name: "365 dias", meta: "Leia por 365 dias seguidos", tier: "legend", xp: 10000, desc: "Um ano inteiro de leitura diária. Você transcendeu o hábito — isso é quem você é.", progMax: 365, trigger: 'streak_days' },
    { id: 'b_6_4', icon: "ti-diamond", bg: "#CECBF6", ic: "#3C3489", name: "100 obras", meta: "Finalize 100 livros", tier: "legend", xp: 8000, desc: "Cem obras concluídas. Pouquíssimos leitores chegam até aqui.", progMax: 100, trigger: 'books_finished' },
  ]
};

export const TIER_INFO = {
  bronze: { label: "Bronze", fill: "#F0997B", pillClass: "tier-bronze", bg: "#F5C4B3", color: "#712B13" },
  silver: { label: "Prata", fill: "#B4B2A9", pillClass: "tier-silver", bg: "#D3D1C7", color: "#444441" },
  gold: { label: "Ouro", fill: "#EF9F27", pillClass: "tier-gold", bg: "#FAC775", color: "#633806" },
  diamond: { label: "Diamante", fill: "#378ADD", pillClass: "tier-diamond", bg: "#B5D4F4", color: "#0C447C" },
  legend: { label: "Lenda", fill: "#7F77DD", pillClass: "tier-legend", bg: "#CECBF6", color: "#3C3489" }
};

export function calculateLevel(xp) {
  if (xp < 501) return { level: 1, title: 'Leitor', min: 0, max: 500 };
  if (xp < 1501) return { level: 2, title: 'Leitor assíduo', min: 501, max: 1500 };
  if (xp < 3501) return { level: 3, title: 'Devorador de histórias', min: 1501, max: 3500 };
  if (xp < 7001) return { level: 4, title: 'Bibliófilo', min: 3501, max: 7000 };
  if (xp < 15001) return { level: 5, title: 'Guardião das palavras', min: 7001, max: 15000 };
  return { level: 6, title: 'Lenda do BookFlix', min: 15001, max: 999999 };
}
