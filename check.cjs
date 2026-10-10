const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const data=fs.readFileSync('dist/data.js','utf8'),app=fs.readFileSync('dist/app.js','utf8');
const context={document:{querySelector:()=>null},localStorage:{getItem:()=>null},console};vm.createContext(context);
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
