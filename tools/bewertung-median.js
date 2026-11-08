// Berechnet R_MED in bewertung.js neu: typische Nährwert-Bewertung je Lebensmittel-Art (Median aus allen Produkten).
// Nur Produkte mit Zucker- und Salzangabe (ohne diese gibt es in der App keinen Score). Es wird nichts geschätzt.
// Nötig, wenn die Formeln in rNutri(), die Erkennung oder foods.json geändert werden.  Aufruf:  node tools/bewertung-median.js
const fs=require("fs"), vm=require("vm"), path=require("path");
const dir=path.join(__dirname,".."), rd=f=>fs.readFileSync(path.join(dir,f),"utf8");
const app=rd("app.js"), cut=(a,b)=>app.slice(app.indexOf(a),app.indexOf(b));
const p=path.join(dir,"bewertung.js");
const ctx={window:{},console}; vm.createContext(ctx);
vm.runInContext(rd("data.js")+"\n"+fs.readFileSync(p,"utf8")+"\n"+cut("const FOOD_KW","// scoreFood steht")+"\nthis.CL=rClassify; this.NU=rNutri;",ctx);
const rows=JSON.parse(rd("foods.json")).rows, groups={};
const med=a=>{ a=a.slice().sort((x,y)=>x-y); return a[Math.floor(a.length/2)]; };
for(const x of rows){
  if(x[9]==null||(x[7]==null&&x[5]>0.5)) continue;
  const it={src:"off",name:x[1],brand:x[2]||"",kcal:x[3],protein:x[4]||0,carbs:x[5]||0,fat:x[6]||0,sugar:x[7]??(x[5]||0),fiber:x[8]??undefined,salt:x[9],nova:x[11]>0?x[11]:undefined,processed:x[11]>=4};
  const C=ctx.CL(it), id=C.cat?C.cat.id:"", N=ctx.NU(C.nut,id); if(!N) continue;
  const k=id||("_"+(C.nova||0)); (groups[k]=groups[k]||[[],[],[],[]]).forEach((a,i)=>a.push(N[i]));
}
const out={}; Object.keys(groups).sort().forEach(k=>out[k]=groups[k].map(a=>Math.round(med(a))));
fs.writeFileSync(p,fs.readFileSync(p,"utf8").replace(/const R_MED=\{.*\};/,"const R_MED="+JSON.stringify(out).replace(/"(\w+)":/g,"$1:")+";"));
console.log(Object.keys(out).length+" Arten aktualisiert.");
