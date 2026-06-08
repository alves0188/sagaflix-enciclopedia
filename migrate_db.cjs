const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data.json');

try {
  const rawData = fs.readFileSync(dataFile, 'utf8');
  let oldData = JSON.parse(rawData);

  // Se já tiver "users", significa que já foi migrado
  if (oldData.users) {
    console.log("Banco de dados já foi migrado.");
    process.exit(0);
  }

  // A estrutura antiga tinha: characters, locations, posts, book
  const newData = {
    users: [
      {
        id: "admin",
        role: "curator",
        name: "Curadoria Sagaflix",
        email: "admin",
        password: "admin"
      },
      {
        id: "wagner",
        role: "author",
        name: "Wagner (Autor)",
        email: "autor",
        password: "autor",
        status: "approved"
      },
      {
        id: "leitor",
        role: "reader",
        name: "Leitor Fiel",
        email: "leitor",
        password: "leitor"
      }
    ],
    authorRequests: [],
    books: [
      {
        id: "livro_jardim",
        authorId: "wagner",
        status: "draft", // draft, pending, published
        title: "Jardim das Flores",
        synopsis: "Um mistério profundo envolvendo a morte de Elias...",
        ageRating: "16",
        cover: "",
        universe: {
          characters: oldData.characters || [],
          locations: oldData.locations || [],
          posts: oldData.posts || [],
          book: oldData.book || []
        }
      }
    ],
    notifications: []
  };

  fs.writeFileSync(dataFile, JSON.stringify(newData, null, 2));
  console.log("Migração concluída com sucesso! Banco preparado para múltiplos usuários e livros.");

} catch (err) {
  console.error("Erro na migração:", err);
}
