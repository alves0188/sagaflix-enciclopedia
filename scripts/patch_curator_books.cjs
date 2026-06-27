const fs = require('fs');
let content = fs.readFileSync('src/components/CuratorDashboard.jsx', 'utf8');

const target = `const authorBooks = db.books.filter(b => b.authorId === selectedAuthor.id || b.coAuthorId === selectedAuthor.id || (b.coAuthorIds && b.coAuthorIds.includes(selectedAuthor.id)));`;
const replacement = `const authorBooks = (db.books || []).filter(b => 
      b.authorId === selectedAuthor.id || 
      b.author_id === selectedAuthor.id || 
      b.coAuthorId === selectedAuthor.id || 
      (b.coAuthorIds && b.coAuthorIds.includes(selectedAuthor.id)) ||
      (b.co_authors && b.co_authors.includes(selectedAuthor.id))
    );`;

if(content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/CuratorDashboard.jsx', content, 'utf8');
  console.log('CuratorDashboard authorBooks patched successfully!');
} else {
  console.log('Target not found in CuratorDashboard.jsx');
}
