export const characters = [
  {
    id: "luan",
    name: "Luan",
    type: "personagem",
    role: "O Âncora",
    age: 16,
    territory: "Território A",
    image: "/luan.png",
    description: "O mais jovem do grupo, porém carrega a mente mais fria, calculista e sensata de todos. Um 'adulto prematuro' devido às responsabilidades que precisou assumir cedo.",
    motivations: "Manter o grupo focado e evitar que decisões impulsivas coloquem todos em risco.",
    connections: [
      { name: "Bia", relation: "Vizinha protetora" },
      { name: "Cronos", relation: "Cão e fiel escudeiro" },
      { name: "Thiago", relation: "Aliado no Território A" }
    ],
    curiosities: "Apesar da postura séria, ele tem um ponto fraco gigante: seu cachorro Cronos, que resgatou das ruas."
  },
  {
    id: "bia",
    name: "Beatriz 'Bia'",
    type: "personagem",
    role: "A Observadora",
    age: 18,
    territory: "Território A",
    image: "/bia.png",
    description: "Fotógrafa e designer freelancer, extremamente detalhista e atenta a padrões visuais que passam despercebidos. Usa seus recém-completados 18 anos como escudo de autoridade.",
    motivations: "Proteger Luan a todo custo e desvendar o mistério visual por trás da morte de Elias.",
    connections: [
      { name: "Luan", relation: "Vizinho (age como irmã mais velha)" },
      { name: "Thiago", relation: "Amigo no Território A" }
    ],
    curiosities: "Ela nunca sai de casa sem sua câmera e confia mais no que vê nas lentes do que nas palavras das pessoas."
  },
  {
    id: "thiago",
    name: "Thiago",
    type: "personagem",
    role: "O Técnico",
    age: 21,
    territory: "Território A",
    image: "/thiago.png",
    description: "Rapaz pragmático, calmo, lida com hardware e sistemas. É extremamente pacífico e evita conflitos diretos.",
    motivations: "Ajudar com a tecnologia na investigação, buscando justiça de forma silenciosa.",
    connections: [
      { name: "Luan", relation: "Amigo" },
      { name: "Camila", relation: "Alvo do ódio secreto dela (ele não sabe)" }
    ],
    curiosities: "Ele sofreu amnésia aos 13 anos em um grave acidente de carro que tirou a vida de sua irmã Lia. Ele não lembra do acidente."
  },
  {
    id: "camila",
    name: "Camila",
    type: "personagem",
    role: "A Condutora do Conflito",
    age: 23,
    territory: "Território B",
    image: "/camila.png",
    description: "A mais velha do grupo B, focada em ação e impulsiva. Entra na investigação com segundas intenções e guarda um rancor mortal.",
    motivations: "Vingança. Ela quer destruir Thiago, que ela culpa pela morte de seu irmão Júnior em um acidente de carro há 8 anos.",
    connections: [
      { name: "Tomás", relation: "Namorado" },
      { name: "Thiago", relation: "Alvo de sua fúria e ressentimento" }
    ],
    curiosities: "Ela canalizou todo o trauma do luto em raiva. O fato de Thiago não se lembrar do acidente a enfurece ainda mais."
  },
  {
    id: "tomas",
    name: "Tomás",
    type: "personagem",
    role: "A Mente Musical",
    age: 22,
    territory: "Território B",
    image: "/tomas.png",
    description: "Músico introspectivo e analítico. Toca baixo e teclado. Consegue perceber 'padrões' nos movimentos da cidade como se fossem ritmos.",
    motivations: "Encontrar a verdade através da intuição e dos padrões que ninguém mais vê.",
    connections: [
      { name: "Camila", relation: "Namorada" }
    ],
    curiosities: "Ele toca no Local Neutro e não faz a menor ideia do segredo sombrio de vingança que Camila esconde."
  },
  {
    id: "elias",
    name: "Senhor Elias",
    type: "personagem",
    role: "O Jardineiro (Falecido)",
    age: 72,
    territory: "Todos",
    image: "/elias.png",
    description: "O idoso mais querido da cidade. Cuidava dos jardins e praças. Sua morte repentina forçou uma trégua inédita entre as três maiores gangues.",
    motivations: "Desconhecidas. Seu passado é um quebra-cabeça que uniu os jovens de territórios rivais.",
    connections: [
      { name: "Líderes das Gangues", relation: "Respeito misterioso absoluto" }
    ],
    curiosities: "A morte dele foi o único dia em toda a história recente da cidade em que as gangues pararam de atirar."
  }
];

export const locations = [
  {
    id: "local_neutro",
    name: "O Bistrô Neutro",
    type: "local",
    territory: "Zona Desmilitarizada",
    image: "/local_neutro.png",
    description: "Um estabelecimento muito charmoso, como uma enoteca, onde nenhuma gangue opera criminalmente. É um território pacífico gerenciado secretamente pelas três gangues em conjunto.",
    motivations: "Servir de refúgio e ponto de encontro. O terreno é do Leste, a logística do Norte, e a operação do Sul.",
    connections: [
      { name: "Tomás", relation: "Toca jazz no local" },
      { name: "Os Grupos", relation: "Local do primeiro encontro" }
    ],
    curiosities: "É o lugar com as melhores bebidas da cidade e onde as tensões desaparecem magicamente pela porta."
  }
];
