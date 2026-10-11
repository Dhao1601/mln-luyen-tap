const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync('dist/data.js','utf8')+';this.bank=BANK',context);
const notes={};
for(const file of fs.readdirSync('notes').filter(f=>/^\d.*\.txt$/.test(f)).sort()){
 for(const [i,line] of fs.readFileSync('notes/'+file,'utf8').trim().split('\n').entries()){
  const fields=line.split('|');assert.equal(fields.length,3,`${file}:${i+1}: expected ids, idea, example`);
  const [ids,idea,example]=fields;assert(idea.length>=40&&example.length>=40,`${file}:${i+1}: incomplete note`);
  for(const id of ids.split(',').map(Number)){assert(!notes[id],`duplicate ${id}`);assert(context.bank.some(q=>q.id===id),`unknown ${id}`);notes[id]={idea,example};}
 }
}
assert.equal(Object.keys(notes).length,538);assert(context.bank.every(q=>notes[q.id]),'missing notes');
const sources=JSON.parse(fs.readFileSync('notes/sources.json','utf8'));
for(const [id,source] of Object.entries(sources)){assert(notes[id]);assert(source.url.startsWith('https://'));notes[id].source=source;}
const reviews=JSON.parse(fs.readFileSync('notes/review.json','utf8'));
for(const q of context.bank)if(reviews[q.id])q.warning=reviews[q.id];
fs.writeFileSync('dist/data.js','const BANK='+JSON.stringify(context.bank)+';\n');
fs.writeFileSync('dist/memory-data.js','// Handwritten question-specific study notes; build with node build-notes.cjs.\nconst STUDY_NOTES='+JSON.stringify(notes)+';\n');
console.log(`Built ${Object.keys(notes).length} notes; ${context.bank.filter(q=>q.warning).length} source-review flags.`);
