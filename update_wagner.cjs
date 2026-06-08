const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data.json');

try {
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

  // Atualiza Wagner
  const wagner = data.users.find(u => u.id === 'wagner');
  if (wagner) {
    wagner.age = 39;
    wagner.tastes = ["Aventura", "Romance", "Ficção Científica"];
    wagner.about = "Escritor apaixonado por construir mundos épicos. Especialista em misturar o realismo com a ficção científica, criando tramas de suspense e romance que prendem o leitor do início ao fim.";
    wagner.avatar = "/wagner.jpg"; // Suposta imagem que vamos colocar no public
  }

  // Atualiza a capa do livro Jardim das Flores
  const livro = data.books.find(b => b.id === 'livro_jardim');
  if (livro) {
    livro.cover = "/book_cover.png";
  }

  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  console.log("Perfil do Wagner e capa do livro atualizados com sucesso!");
} catch (err) {
  console.error(err);
}
