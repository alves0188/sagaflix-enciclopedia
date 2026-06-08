const fs = require('fs');
const readline = require('readline');

const transcriptPath = 'C:\\Users\\Wagner\\.gemini\\antigravity\\brain\\bcd24532-33aa-4693-b5f1-071844666dd6\\.system_generated\\logs\\transcript.jsonl';
let userInputs = [];

const rl = readline.createInterface({
  input: fs.createReadStream(transcriptPath),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const data = JSON.parse(line);
    if (data.type === 'USER_INPUT') {
      userInputs.push(data.content);
    }
  } catch (e) {}
});

rl.on('close', () => {
  fs.writeFileSync('C:\\Users\\Wagner\\Desktop\\Livro - Jardim das Flores\\site-enciclopedia\\user_inputs.txt', userInputs.join('\n\n---\n\n'));
  console.log('Done');
});
