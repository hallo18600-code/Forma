// Berechnet die Tabelle R_MED in bewertung.js neu (typische Nährwert-Bewertung je Lebensmittel-Art).
// Nötig, wenn die Formeln in rNutri() oder die Erkennung geändert werden.  Aufruf:  node tools/bewertung-median.js
const fs=require("fs"), vm=require("vm"), path=require("path");
const dir=path.join(__dirname,".."), rd=f=>fs.readFileSync(path.join(dir,f),"utf8");
const ctx={window:{},console}; vm.createContext(ctx);
const app=rd("app.js"), cut=(a,b)=>app.slice(app.indexOf(a),app.indexOf(b));
vm.runInContext(rd("data.js")+"\n"+rd("bewertung.js")+"\n"+cut("const FOOD_KW","// scoreFood steht")+"\nthis.CL=rClassify; this.NU=rNutri;",ctx);
const rows=JSON.parse(rd("foods.json")).rows, groups={};
for(const x of rows){
  const it={name:x[1],kcal:x[3],protein:x[4]||0,carbs:x[5]||0,fat:x[6]||0,sugar:x[7],fiber:x[8],salt:x[9],nova:x[11],processed:x[11]>=4};
  const C=ctx.CL(it), id=C.cat?C.cat.id:"", N=ctx.NU(C.nut,id); if(!N) continue;
  const k=id||("_"+(C.nova||0)); (groups[k]=groups[k]||[[],[],[],[]]).forEach((a,i)=>a.push(N[i]));
}
const med=a=>{ a.sort((x,y)=>x-y); return Math.round(a[Math.floor(a.length/2)]); }, out={};
Object.keys(groups).sort().forEach(k=>out[k]=groups[k].map(med));
const p=path.join(dir,"bewertung.js");
fs.writeFileSync(p,fs.readFileSync(p,"utf8").replace(/const R_MED=\{.*\};/,"const R_MED="+JSON.stringify(out).replace(/"(\w+)":/g,"$1:")+";"));
console.log(Object.keys(out).length+" Arten aktualisiert.");
