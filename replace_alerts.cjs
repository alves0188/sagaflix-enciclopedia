const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('alert(')) {
    if (!content.includes('import { toast }')) {
      content = content.replace(/import /, "import { toast } from 'react-hot-toast';\nimport ");
    }
    
    // Replace alert( with toast( for generic, but maybe try to be smart about errors
    content = content.replace(/alert\((.*?[eE]rro.*?)\)/g, 'toast.error($1)');
    content = content.replace(/alert\((.*?)\)/g, 'toast($1)');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
