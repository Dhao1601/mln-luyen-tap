const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const data=fs.readFileSync('dist/data.js','utf8'),app=fs.readFileSync('dist/app.js','utf8');
const testStorage=new Map();
const context={document:{querySelector:()=>null},localStorage:{getItem:k=>testStorage.get(k)??null,setItem:(k,v)=>testStorage.set(k,v)},console};vm.createContext(context);
vm.runInContext(data+'\n'+fs.readFileSync('dist/memory.js','utf8')+'\n'+app.split("$('#brand').onclick")[0],context);
assert.equal(vm.runInContext('BANK.length',context),538);
assert.equal(vm.runInContext('BANK.filter(q=>q.warning).length',context),5);
assert.equal(vm.runInContext('BANK.filter(q=>q.correct.length>1).length',context),33);
assert(vm.runInContext('BANK.every(q=>q.options.length>=2 && q.correct.every(k=>q.options.some(o=>o.id===k)))',context));
assert(vm.runInContext('equal(["A","C"],["C","A"]) && !equal(["A"],["A","C"]) && !equal(["A","B","C"],["A","C"]) && !equal([], ["A"])',context));
assert(vm.runInContext('shuffle(BANK).length===538 && new Set(shuffle(BANK).map(q=>q.id)).size===538',context));
assert(vm.runInContext('!BANK.some(q=>/nhung\\s+hoàng/i.test(JSON.stringify(q)))',context));
console.log('PASS: 538 questions, option mapping, 33 multi-answer questions, exact grading, shuffle integrity, names removed.');

assert(vm.runInContext('BANK.every(q=>memoryTip(q).length>30)',context));
assert(vm.runInContext('highlight("<script>giá trị sử dụng</script>").includes("&lt;script&gt;") && highlight("giá trị sử dụng").includes("<strong")',context));
assert(vm.runInContext('memoryTip(byId.get(3)).includes("KHÔNG / SAI") && memoryTip(byId.get(257)).includes("đối chiếu")',context));
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
let tones=0;
context.window={AudioContext:class{currentTime=0;destination={};resume(){return Promise.resolve()}createOscillator(){return {frequency:{value:0},connect(){},disconnect(){},start(){tones++},stop(){}}}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}}};
vm.runInContext('soundOn=false;playCorrectSound();',context);assert.equal(tones,0);
vm.runInContext('soundOn=true;playCorrectSound();',context);
setImmediate(()=>{assert.equal(tones,2);console.log('PASS: sound toggle and two-note correct-answer chime.');});
