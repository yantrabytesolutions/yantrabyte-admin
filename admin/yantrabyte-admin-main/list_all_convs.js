import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\sys1\\.gemini\\antigravity\\brain';

try {
  const dirs = fs.readdirSync(brainDir).filter(f => {
    try {
      return fs.statSync(path.join(brainDir, f)).isDirectory();
    } catch {
      return false;
    }
  });

  console.log(`Found ${dirs.length} conversation folders:`);
  
  const foldersWithTime = dirs.map(dir => {
    const dirPath = path.join(brainDir, dir);
    let mtime = new Date(0);
    try {
      mtime = fs.statSync(dirPath).mtime;
    } catch (e) {}
    
    // Check if transcript.jsonl exists
    const transPath = path.join(dirPath, '.system_generated', 'logs', 'transcript.jsonl');
    let hasTranscript = false;
    let transcriptLength = 0;
    let lastLine = '';
    
    try {
      if (fs.existsSync(transPath)) {
        hasTranscript = true;
        const stat = fs.statSync(transPath);
        if (stat.mtime > mtime) mtime = stat.mtime;
        const content = fs.readFileSync(transPath, 'utf-8').trim();
        if (content) {
          const lines = content.split('\n');
          transcriptLength = lines.length;
          lastLine = lines[lines.length - 1];
        }
      }
    } catch (e) {}

    return { dir, mtime, hasTranscript, transcriptLength, lastLine };
  });

  // Sort by modification time descending
  foldersWithTime.sort((a, b) => b.mtime - a.mtime);

  foldersWithTime.forEach((f, idx) => {
    console.log(`${idx + 1}. Folder: ${f.dir} (Last Modified: ${f.mtime.toISOString()})`);
    console.log(`   Has Transcript: ${f.hasTranscript}, Lines: ${f.transcriptLength}`);
    if (f.lastLine) {
      try {
        const obj = JSON.parse(f.lastLine);
        console.log(`   Last Step [${obj.source}] [${obj.type}]: ${obj.content || ''}`);
        if (obj.tool_calls) {
          console.log(`   Tool Calls:`, JSON.stringify(obj.tool_calls));
        }
      } catch (e) {
        console.log(`   Last Line (Raw): ${f.lastLine.substring(0, 150)}`);
      }
    }
    console.log('----------------------------------------------------');
  });
} catch (e) {
  console.error(e);
}
