const fs = require('fs');
const transcriptPath = 'C:\\Users\\Wagner\\.gemini\\antigravity\\brain\\bcd24532-33aa-4693-b5f1-071844666dd6\\.system_generated\\logs\\transcript.jsonl';
const text = fs.readFileSync(transcriptPath, 'utf8');
const lines = text.split('\n');
const results = [];
for (let i = 0; i < lines.length; i++) {
  try {
    const data = JSON.parse(lines[i]);
    if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
      data.tool_calls.forEach(tc => {
        if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
          let target = tc.args.TargetFile || tc.args.AbsolutePath;
          if (target && target.includes('Reader.jsx')) {
            let content = tc.args.CodeContent || tc.args.ReplacementContent || JSON.stringify(tc.args.ReplacementChunks);
            results.push(`Step ${data.step_index} - Reader.jsx:\n${content}`);
          }
        }
      });
    }
  } catch(e) {}
}
fs.writeFileSync('C:\\Users\\Wagner\\Desktop\\Livro - Jardim das Flores\\site-enciclopedia\\extracted_reader_history.txt', results.join('\n\n========================\n\n'));
