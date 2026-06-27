const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.jsx', 'utf8');
content = content.replace('events={data.events || []}', 'events={getList(\'events\')}');
fs.writeFileSync('src/components/AdminPanel.jsx', content, 'utf8');
