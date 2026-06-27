const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.jsx', 'utf8');

const targetRegex = /\} else \{\s+const listKey = getListKey\(trashItem\.itemType\);\s+const updatedList = \[\.\.\.\(data\[listKey\] \|\| \[\]\), trashItem\.itemData\];\s+onUpdate\(\{ \.\.\.data, \[listKey\]: updatedList \}\);\s+\}/;

const repStr = `} else {
        const listKey = getListKey(trashItem.itemType);
        const updatedList = [...getList(listKey), trashItem.itemData];
        if (['chapters', 'notes'].includes(listKey)) {
          onUpdate({ ...data, [listKey]: updatedList });
        } else {
          try {
            const typeMapping = { 'characters': 'personagem', 'locations': 'local', 'organizations': 'organizacao', 'items': 'item', 'clues': 'pista', 'events': 'evento', 'posts': 'post' };
            const dItem = trashItem.itemData;
            const uItem = { id: dItem.id, book_id: bookId, type: typeMapping[listKey] || 'personagem', name: dItem.name || dItem.title || 'Sem Nome', role: dItem.role || '', age: dItem.age || null, territory: dItem.territory || '', image: dItem.image || '', description: dItem.description || dItem.content || '', motivations: dItem.motivations || '', curiosities: dItem.curiosities || '', status: dItem.status || 'draft', gallery: dItem.gallery || [], custom_fields: dItem.customFields || [], private_notes: dItem.privateNotes || '' };
            api.saveUniverseItem(uItem).then(() => { setUniverseItems(prev => ({ ...prev, [listKey]: updatedList })); });
          } catch (err) { console.error(err); }
        }
      }`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, repStr);
  content = content.replace('const handleRestoreFromTrash = (trashItem) => {', 'const handleRestoreFromTrash = async (trashItem) => {');
  fs.writeFileSync('src/components/AdminPanel.jsx', content, 'utf8');
  console.log('Success!');
} else {
  console.log('Regex not matched');
}
