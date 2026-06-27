const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.jsx', 'utf8');

const targetStr = `      autoSaveTimeoutRef.current = setTimeout(() => {
        const listKey = getListKey(formData.type);
        
        const currentItem = (data[listKey] || []).find(i => i.id === formData.id);
        if (JSON.stringify(currentItem) === JSON.stringify(formData)) return;
  
        const updatedList = (data[listKey] || []).map(item => item.id === formData.id ? formData : item);
        onUpdate({ ...data, [listKey]: updatedList });
      }, 2000);`;

const repStr = `      autoSaveTimeoutRef.current = setTimeout(async () => {
        const listKey = getListKey(formData.type);
        
        const currentItem = getList(listKey).find(i => i.id === formData.id);
        if (JSON.stringify(currentItem) === JSON.stringify(formData)) return;
  
        const updatedList = getList(listKey).map(item => item.id === formData.id ? formData : item);
        
        if (['chapters', 'notes'].includes(listKey)) {
          onUpdate({ ...data, [listKey]: updatedList });
        } else {
          try {
            const typeMapping = { 'characters': 'personagem', 'locations': 'local', 'organizations': 'organizacao', 'items': 'item', 'clues': 'pista', 'events': 'evento', 'posts': 'post' };
            const uItem = { id: formData.id, book_id: bookId, type: typeMapping[listKey] || 'personagem', name: formData.name || formData.title || 'Sem Nome', role: formData.role || '', age: formData.age || null, territory: formData.territory || '', image: formData.image || '', description: formData.description || formData.content || '', motivations: formData.motivations || '', curiosities: formData.curiosities || '', status: formData.status || 'draft', gallery: formData.gallery || [], custom_fields: formData.customFields || [], private_notes: formData.privateNotes || '' };
            await api.saveUniverseItem(uItem);
            setUniverseItems(prev => ({ ...prev, [listKey]: updatedList }));
          } catch (err) {
            console.error('Autosave error:', err);
          }
        }
      }, 2000);`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, repStr);
  
  // also fix handleChapterDrop
  const hdTarget = `    const handleChapterDrop = (targetIdx) => {
      if (draggedChapterIdx === null || draggedChapterIdx === targetIdx) return;
      const listKey = 'chapters';
      const items = [...(data[listKey] || [])];`;
      
  const hdRep = `    const handleChapterDrop = (targetIdx) => {
      if (draggedChapterIdx === null || draggedChapterIdx === targetIdx) return;
      const listKey = 'chapters';
      const items = [...getList(listKey)];`;
      
  content = content.replace(hdTarget, hdRep);
  
  fs.writeFileSync('src/components/AdminPanel.jsx', content, 'utf8');
  console.log("Success Autosave patch!");
} else {
  console.log("Not found autosave.");
}
