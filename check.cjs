const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const data=fs.readFileSync('dist/data.js','utf8'),app=fs.readFileSync('dist/app.js','utf8');
const testStorage=new Map();
const context={document:{querySelector:()=>null},localStorage:{getItem:k=>testStorage.get(k)??null,setItem:(k,v)=>testStorage.set(k,v)},console};vm.createContext(context);
vm.runInContext(data+'\n'+fs.readFileSync('dist/memory-data.js','utf8')+'\n'+fs.readFileSync('dist/memory.js','utf8')+'\n'+app.split("document.title=")[0],context);
assert.equal(vm.runInContext('BANK.length',context),538);
assert.equal(vm.runInContext('BANK.filter(q=>q.warning).length',context),30);
assert.equal(vm.runInContext('BANK.filter(q=>q.correct.length>1).length',context),33);
assert(vm.runInContext('BANK.every(q=>q.options.length>=2 && q.correct.every(k=>q.options.some(o=>o.id===k)))',context));
assert(vm.runInContext('equal(["A","C"],["C","A"]) && !equal(["A"],["A","C"]) && !equal(["A","B","C"],["A","C"]) && !equal([], ["A"])',context));
assert(vm.runInContext('shuffle(BANK).length===538 && new Set(shuffle(BANK).map(q=>q.id)).size===538',context));
assert(vm.runInContext('!BANK.some(q=>/nhung\\s+hoàng/i.test(JSON.stringify(q)))',context));
console.log('PASS: 538 questions, option mapping, 33 multi-answer questions, exact grading, shuffle integrity, names removed.');

assert(vm.runInContext('BANK.every(q=>memoryTip(q).length>30)',context));
assert(vm.runInContext('highlight("<script>giá trị sử dụng</script>").includes("&lt;script&gt;") && highlight("giá trị sử dụng").includes("<strong")',context));
assert(vm.runInContext('memoryTip(byId.get(3)).includes("Câu chọn SAI") && memoryBox(byId.get(257)).includes("Câu nguồn cần đối chiếu")',context));
console.log("PASS: memory cues, negative-question guard, uncertain-source guard, escaped keyword highlighting.");

assert(vm.runInContext('!highlight("đất đai sai").includes("đ<strong") && !highlight("đất đai").includes("<strong")',context));

vm.runInContext('session={answers:{1:["A"],2:["C"]}};wrongIds=[2,3];recordAnswers([1,2]);recordAnswers([1]);',context);
assert.deepEqual(JSON.parse(testStorage.get('mln122-study-v1-wrong')).sort((a,b)=>a-b),[1,3]);
assert(vm.runInContext('feedback(byId.get(1)).includes("Đã lưu vào danh sách câu sai")',context));
vm.runInContext('wrongIds=read(key+"-wrong",[]);session.answers[1]=["D"];recordAnswers([1]);',context);
assert.deepEqual(JSON.parse(testStorage.get('mln122-study-v1-wrong')),[3]);
vm.runInContext('session.answers[40]=["A","B"];recordAnswers([40]);',context);
assert(JSON.parse(testStorage.get('mln122-study-v1-wrong')).includes(40));
vm.runInContext('session.answers[40]=["A","B","C"];recordAnswers([40]);',context);
assert(!JSON.parse(testStorage.get('mln122-study-v1-wrong')).includes(40));
console.log('PASS: immediate wrong-answer persistence, deduplication, reload, corrected-answer removal, unrelated errors retained, multi-answer grading.');
let plays=0;
context.Audio=class{constructor(src){assert.equal(src,'assets/correct.mp3')}play(){plays++;return Promise.resolve()}};
vm.runInContext('soundOn=false;playCorrectSound();',context);assert.equal(plays,0);
vm.runInContext('soundOn=true;playCorrectSound();playCorrectSound();',context);assert.equal(plays,2);
assert(fs.statSync('dist/assets/correct.mp3').size>1000);
assert(app.includes('if(qCorrect(q)&&!q.warning)playCorrectSound()'));
console.log('PASS: requested audio asset, mute, replay, correct-only trigger.');

assert(vm.runInContext('Object.keys(STUDY_NOTES).length===538 && BANK.every(q=>STUDY_NOTES[q.id].idea.length>=40 && STUDY_NOTES[q.id].example.length>=40)',context));
assert(vm.runInContext('new Set(Object.values(STUDY_NOTES).map(n=>n.idea)).size>500',context));
assert(vm.runInContext('BANK.every(q=>!/<strong/.test(options(q,false)+options(q,true)))',context));
assert(vm.runInContext('BANK.every(q=>!/<strong/.test(feedback(q).split("<p")[1]))',context));
assert(vm.runInContext('options(byId.get(286),true).includes("source-key") && !options(byId.get(286),true).includes("option good") && feedback(byId.get(286)).includes("chưa xác minh")',context));
assert(vm.runInContext('BANK.every(q=>memoryBox(q).includes("Liên hệ thực tế") && memoryBox(q).includes("Hiểu & nhớ"))',context));
console.log('PASS: 538 specific explanations and examples, >500 distinct cues, plain answer text before/after grading, unverified source keys shown neutrally.');
// Exercise the actual check handler: correct/incorrect, muted/unmuted, uncertain source.
const elements=new Map();context.document.querySelector=selector=>{if(!elements.has(selector))elements.set(selector,{innerHTML:'',focus(){},showModal(){},close(){}});return elements.get(selector)};
context.document.querySelectorAll=()=>[];
context.window={scrollTo(){}};
function checkAnswer(id,answer,enabled){vm.runInContext(`session={ids:[${id}],mode:'practice',index:0,answers:{${id}:${JSON.stringify(answer)}},checked:[],marked:[]};soundOn=${enabled};renderQuestion();`,context);elements.get('#check').onclick()}
let before=plays;checkAnswer(2,['C'],true);assert.equal(plays,before+1);
before=plays;checkAnswer(2,['A'],true);assert.equal(plays,before);
checkAnswer(2,['C'],false);assert.equal(plays,before);
checkAnswer(286,['B'],true);assert.equal(plays,before);
checkAnswer(40,['A','B'],true);assert.equal(plays,before);
checkAnswer(40,['A','B','C'],true);assert.equal(plays,before+1);
console.log('PASS: actual answer-check handler only plays on verified correct selections; wrong, partial, muted and ambiguous answers stay silent.');

// Both decks share the UI but never share progress or question-number lookups.
const deckStorage=new Map([['mln122-study-v1-wrong','[2,6]'],['mln122-study-v1-history','[{"correct":8,"total":10,"date":123}]']]);
const source111=fs.readFileSync('dist/data-mln111.js','utf8');
function deckContext(search){
 const els=new Map();const ctx={URLSearchParams,location:{search},console,window:{scrollTo(){}},document:{querySelector(s){if(!els.has(s))els.set(s,{innerHTML:'',focus(){}});return els.get(s)},querySelectorAll(){return []}},localStorage:{getItem:k=>deckStorage.get(k)??null,setItem:(k,v)=>deckStorage.set(k,v)}};
 vm.createContext(ctx);vm.runInContext(data+'\n'+source111+'\n'+fs.readFileSync('dist/memory-data.js','utf8')+'\n'+fs.readFileSync('dist/memory.js','utf8')+'\n'+app.split('document.title=')[0],ctx);return ctx;
}
const second=deckContext('?de=2');
assert(vm.runInContext('activeBank.length===598 && deckTitle==="MLN111" && key==="mln111-study-v1"',second));
assert(vm.runInContext('activeBank.filter(q=>q.correct.length>1).length===14 && activeBank.every((q,i)=>q.id===i+1 && q.options.length>=2 && new Set(q.options.map(o=>o.id)).size===q.options.length && q.correct.every(k=>q.options.some(o=>o.id===k)))',second));
assert(vm.runInContext('activeBank.every(q=>!memoryBox(q)) && !/nhung\\s+hoàng/i.test(JSON.stringify(activeBank))',second));
vm.runInContext('start([1,598],"practice");session.answers[1]=["B"];recordAnswers([1]);save()',second);
assert.equal(deckStorage.get('mln111-study-v1-wrong'),'[1]');
assert.equal(deckStorage.get('mln122-study-v1-wrong'),'[2,6]');
assert.equal(deckStorage.get('mln122-study-v1-history'),'[{"correct":8,"total":10,"date":123}]');
const first=deckContext('');assert(vm.runInContext('activeBank.length===538 && key==="mln122-study-v1" && wrongIds.length===2 && history.length===1',first));
const secondReload=deckContext('?de=2');assert(vm.runInContext('session.ids[1]===598 && session.answers[1][0]==="B" && wrongIds[0]===1',secondReload));
vm.runInContext('session.answers[598]=["A"];',secondReload);assert(!vm.runInContext('qCorrect(byId.get(598))',secondReload));
vm.runInContext('session.answers[598]=["A","B"];',secondReload);assert(vm.runInContext('qCorrect(byId.get(598))',secondReload));
const raw111=JSON.parse(fs.readFileSync('notes/mln111-raw.json','utf8'));
const parsed111=vm.runInContext('JSON.stringify(activeBank)',second);
JSON.parse(parsed111).forEach((q,i)=>{assert.equal(q.page,raw111[i].page);if(q.id!==172)assert.equal(q.correct.join(''),raw111[i].a.trim().match(/^[A-Fa-f]+\b/)[0].toUpperCase())});
assert(vm.runInContext('byId.get(172).note.includes("được bổ sung") && byId.get(555).options.length===4',second));
console.log('PASS: all 598 cards and 14 multi-answer cards imported, source keys/pages matched, generated distractors disclosed, deck switching and reload isolate progress, MLN122 notes never leak into MLN111.');
