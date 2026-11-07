// Life Maxxing – Hautbild: im Tagebuch unter „Dein Tag“ die Haut von 1 bis 10 bewerten, nach 7 Einträgen zeigt der Verlauf die Hautanalyse.
// Verglichen wird nur mit eigenen Einträgen: Zucker, Fast Food, Milchprodukte, Wasser und Tages-Score vom Vortag, Schlaf der letzten Nacht.
// Wichtig: Es sind Auffälligkeiten in den eigenen Daten, keine Ursachen und keine Diagnose.

const SK_MIN=7;            // ab so vielen Einträgen gibt es die Analyse
const SK_CAT=new Map();    // Lebensmittel-Art pro Produkt merken (schneller)

function skinVal(s){ const v=(state.days[s]||{}).skin; return Number.isFinite(v)&&v>=1&&v<=10?v:null; }
function skinCat(p){ if(!SK_CAT.has(p.id)){ let c=null; try{ c=typeof foodCat==="function"?foodCat(p):null; }catch(e){} SK_CAT.set(p.id,c); } return SK_CAT.get(p.id); }
function skinItems(s){
  const d=state.days[s]; if(!d||!Array.isArray(d.meals)||!d.meals.length) return null;
  const out=[]; d.meals.forEach(m=>{ if(!m||!(m.portion>0)) return; const p=foods().find(x=>x.id===m.id); if(p&&!p.hidden&&p.type!=="sup"&&p.type!=="care") out.push({p,g:m.portion}); });
  return out.length?out:null;
}
function skinDays(){ return Object.keys(state.days).filter(s=>skinVal(s)!=null).sort(); }
function skinAvg(list){ return list.length?list.reduce((a,b)=>a+b,0)/list.length:null; }

// ---------- Hautanalyse ----------
// Grundidee: Für jeden bewerteten Tag schauen wir auf den Vortag (Essen, Wasser) und die letzte Nacht (Schlaf).
// Statt einfach Durchschnitte zu vergleichen, rechnen wir eine kleine lineare Regression mit schrittweiser Auswahl:
// So wird z. B. ein Milchprodukt nicht „schuldig“, nur weil es oft an Zucker-Tagen gegessen wurde.
// Regeln, damit kein Unsinn herauskommt:
//  • Schlechte Gewohnheiten (Zucker, Fast Food, Milch, wenig Schlaf/Wasser, schwache Ernährung) dürfen nur als MINUS erscheinen,
//    gute Gewohnheiten (sehr gute Ernährung, guter Tag rundum) nur als PLUS. Alles andere wird nie angezeigt.
//  • Nur Tage mit ausreichend eingetragenem Essen zählen für Essens-Fragen (sonst sähe „nichts eingetragen“ aus wie „kein Zucker“).
//  • Jede Gruppe braucht mind. 3 Tage, der Effekt mind. 0,8 Punkte und eine klare statistische Sicherheit (t ≥ SK_T).
//  • Höchstens 3 Auffälligkeiten.
const SK_T=2.2, SK_EFF=0.8, SK_GRP=3, SK_MAXF=3;
const SK_NATURAL=new Set(["fruit","berries","banana","vitc","veg","skinveg","sweetpotato","avocado","legume","potato"]);
const SK_MILKY=new Set(["dairy","kefir","protdairy"]);
const SK_MILK=100;          // ab so viel Milchprodukt (g, Käse ×3) zählt ein Tag als „Milchprodukte“
const SK_BLOCK=3;           // Zufallsvergleich in 3-Tages-Blöcken (Haut und Gewohnheiten ändern sich nicht täglich neu)
function skinDayInfo(s){
  const d=state.days[s]; if(!d||!Array.isArray(d.meals)) return null;
  let kcal=0, unk=0, sugar=0, n=0, fast=false, milk=0;
  d.meals.forEach(m=>{ if(!m||!(m.portion>0)) return; const p=foods().find(x=>x.id===m.id); if(!p||p.type==="sup"||p.type==="care") return;
    const k=Math.max(0,(p.kcal||0)*m.portion/100); kcal+=k; n++;
    const c=(!p.hidden&&skinCat(p))||{};
    if(c.id==="fastfood") fast=true;
    // Milchprodukte: erst ab nennenswerter Menge (Schuss Milch im Kaffee zählt nicht). Käse ist konzentrierte Milch (×3), Butter fast nur Fett.
    if(c.d===1&&c.id!=="butter") milk+=m.portion*(c.id==="cheese"?3:1);
    // Zucker = freier/zugesetzter Zucker: Zucker in ganzem Obst & Gemüse zählt nicht, bei Milchprodukten nur, was über den Milchzucker (~5 g) hinausgeht
    if(Number.isFinite(p.sugar)){ const su=SK_NATURAL.has(c.id)?0:SK_MILKY.has(c.id)?Math.max(0,p.sugar-5):p.sugar; sugar+=su*m.portion/100; }
    else if(!SK_NATURAL.has(c.id)) unk+=k; });
  const dairy=milk>=SK_MILK;
  let goal=1800; try{ goal=targets().kcal||goal; }catch(e){}
  const logged=n>=2&&kcal>=goal*0.4;          // genug eingetragen, um den Tag zu beurteilen
  let ds=null; try{ const x=typeof dayScore==="function"?dayScore(s):null; ds=x?x.score:null; }catch(e){}
  return { logged, kcal, sugar:logged&&unk<=kcal*0.3?sugar:null, fast:logged?fast:null, dairy:logged?dairy:null, score:logged?ds:null,
    water:d.water>0?d.water:null };
}
// Merkmale: 1 = trifft zu, 0 = trifft nicht zu, null = keine Daten. dir: -1 darf nur schlechter machen, +1 nur besser.
function skinFeatures(rows){
  const wt=state.profile.waterTarget||8, pick=(vals,opts)=>{ for(const o of opts){ const a=vals.filter(v=>v!=null&&o.f(v)).length, b=vals.filter(v=>v!=null&&!o.f(v)).length; if(a>=SK_GRP&&b>=SK_GRP) return o; } return opts[0]; };
  const sug=pick(rows.map(r=>r.prev&&r.prev.sugar),[{f:v=>v>=50,t:"über 50 g zugesetzt"},{f:v=>v>=35,t:"über 35 g zugesetzt"},{f:v=>v>=75,t:"über 75 g zugesetzt"},{f:v=>v>=25,t:"über 25 g zugesetzt"}]);
  const slp=pick(rows.map(r=>r.sleep),[{f:v=>v<7,t:"unter 7 h",h:7},{f:v=>v<6.5,t:"unter 6,5 h",h:6.5},{f:v=>v<6,t:"unter 6 h",h:6},{f:v=>v<7.5,t:"unter 7,5 h",h:7.5}]);
  const hi=pick(rows.map(r=>r.prev&&r.prev.score),[{f:v=>v>=85,t:"Tages-Score ab 85"},{f:v=>v>=80,t:"Tages-Score ab 80"},{f:v=>v>=75,t:"Tages-Score ab 75"}]);
  const wat=pick(rows.map(r=>r.prev&&r.prev.water),[{f:v=>v<wt,t:`unter ${wt} Gläsern`},{f:v=>v<Math.round(wt*0.75),t:`unter ${Math.round(wt*0.75)} Gläsern`}]);
  const v=(r,k)=>r.prev?r.prev[k]:null, b=x=>x==null?null:x?1:0;
  const F=[
    {id:"sugar", k:"viel Zucker", dir:-1, emo:"🍬", t:"Viel Zucker am Vortag", sub:sug.t, x:r=>{ const q=v(r,"sugar"); return q==null?null:b(sug.f(q)); }},
    {id:"fast", k:"Fast Food",  dir:-1, emo:"🍔", t:"Fast Food am Vortag", sub:"", x:r=>b(v(r,"fast"))},
    {id:"dairy", k:"Milchprodukte", dir:-1, emo:"🥛", t:"Milchprodukte am Vortag", sub:"ab "+SK_MILK+" g", x:r=>b(v(r,"dairy"))},
    {id:"sleep", k:"wenig Schlaf", dir:-1, emo:"😴", t:"Wenig Schlaf", sub:slp.t, x:r=>r.sleep==null?null:b(slp.f(r.sleep))},
    {id:"water", k:"wenig Wasser", dir:-1, emo:"💧", t:"Wenig Wasser am Vortag", sub:wat.t, x:r=>{ const q=v(r,"water"); return q==null?null:b(wat.f(q)); }},
    {id:"high",  dir:1,  emo:"🥩", t:"Sehr gute Ernährung am Vortag", sub:hi.t, x:r=>{ const q=v(r,"score"); return q==null?null:b(hi.f(q)); }}
  ];
  // Kombinationen: schlechte Ernährung UND wenig Schlaf (z. B. viel Zucker am Vorabend + kurze Nacht)
  const B0=F.find(f=>f.id==="sleep");
  for(const A of F.filter(f=>f.id==="sugar"||f.id==="fast")){ const B=B0;
    const nm=(A.k+" + "+B.k); F.push({id:A.id+"+"+B.id, dir:-1, combo:[A.id,B.id], emo:A.emo+B.emo, t:nm.charAt(0).toUpperCase()+nm.slice(1)+(A.id!=="sleep"&&B.id!=="sleep"?" am Vortag":""), sub:[A.sub,B.sub].filter(Boolean).join(" · "),
      x:r=>{ const a=A.x(r), c=B.x(r); return a==null||c==null?null:a&&c?1:0; }}); }
  return F;
}
// Kleinste-Quadrate-Lösung mit Standardfehlern (Gauß-Jordan, max. 5×5)
function skinOLS(X,y){
  const n=y.length, p=X[0].length, A=Array.from({length:p},(_,i)=>Array.from({length:2*p},(_,j)=>j<p?X.reduce((s,r)=>s+r[i]*r[j],0):(j-p===i?1:0)));
  for(let c=0;c<p;c++){ let m=c; for(let r=c+1;r<p;r++) if(Math.abs(A[r][c])>Math.abs(A[m][c])) m=r; if(Math.abs(A[m][c])<1e-9) return null;
    [A[c],A[m]]=[A[m],A[c]]; const pv=A[c][c]; for(let j=0;j<2*p;j++) A[c][j]/=pv;
    for(let r=0;r<p;r++) if(r!==c){ const f=A[r][c]; if(f) for(let j=0;j<2*p;j++) A[r][j]-=f*A[c][j]; } }
  const inv=A.map(r=>r.slice(p)), Xy=Array.from({length:p},(_,i)=>X.reduce((s,r,k)=>s+r[i]*y[k],0));
  const beta=inv.map(r=>r.reduce((s,v,j)=>s+v*Xy[j],0));
  const rss=X.reduce((s,r,k)=>{ const e=y[k]-r.reduce((a,v,j)=>a+v*beta[j],0); return s+e*e; },0);
  const df=n-p; if(df<3) return null;
  const sig2=Math.max(rss/df,0.25);           // Untergrenze: Bewertungen sind grob (ganze Punkte)
  return { beta, se:inv.map((r,i)=>Math.sqrt(Math.max(0,r[i])*sig2)), rss };
}
// Fester Zufallsgenerator (gleiche Daten → gleiches Ergebnis, nichts springt beim Neuladen)
function skinRng(seed){ let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
const SK_MEMO={key:null,fp:null,val:null};
function skinInsights(){
  const all=skinDays(); if(all.length<SK_MIN) return [];
  // Schneller Fingerabdruck der Daten: nur neu rechnen, wenn sich etwas geändert hat (sonst ruckelt jeder Tipp)
  const fp=state.profile.goal+"|"+state.profile.waterTarget+"|"+state.customs.length+"|"+all.map(s=>{ const d=state.days[s], y=state.days[addDays(s,-1)]||{};
    return s+":"+d.skin+":"+(d.sleep??"")+":"+(y.water||0)+":"+(y.meals||[]).map(m=>m&&m.id+"*"+m.portion).join(","); }).join(";");
  if(SK_MEMO.fp===fp) return SK_MEMO.val;
  const rows=all.map(s=>({s, y:skinVal(s), prev:skinDayInfo(addDays(s,-1)), sleep:(()=>{ const v=(state.days[s]||{}).sleep; return v==null?null:+v; })()}));
  const ys=rows.map(r=>r.y); if(Math.max(...ys)-Math.min(...ys)<2){ SK_MEMO.fp=fp; SK_MEMO.val=[]; return []; }   // Haut immer (fast) gleich bewertet → nichts zu erkennen
  const F=skinFeatures(rows), X=F.map(f=>rows.map(r=>f.x(r)));
  const key=JSON.stringify([ys,X,F.map(f=>f.sub)]); if(SK_MEMO.key===key){ SK_MEMO.fp=fp; return SK_MEMO.val; }
  const idx=f=>F.indexOf(f);
  // Modell mit den Merkmalen „set“ für die Hautwerte „y“
  const fit=(set,y)=>{
    const R=[]; for(let k=0;k<rows.length;k++) if(set.every(f=>X[idx(f)][k]!=null)) R.push(k);
    if(R.length<Math.max(SK_MIN,set.length+5)) return null;
    for(const f of set){ const ones=R.filter(k=>X[idx(f)][k]===1).length; if(ones<SK_GRP||R.length-ones<SK_GRP) return null; }
    const o=skinOLS(R.map(k=>[1,...set.map(f=>X[idx(f)][k])]),R.map(k=>y[k])); return o&&{o,R};
  };
  const tOf=(m,k)=>m.o.beta[k]/(m.o.se[k]||1e9);
  // Stärkstes einzelnes Muster (in der erlaubten Richtung) – für den Zufallsvergleich
  const maxStat=y=>{ let mx=0; for(const f of F){ const m=fit([f],y); if(m){ const t=tOf(m,1)*f.dir; if(t>mx) mx=t; } } return mx; };
  // Permutationstest: Hautwerte 200× mischen. Nur was stärker ist als 95 % der gemischten Fälle, zählt.
  const rnd=skinRng(key.length*7919+ys.reduce((a,v,i)=>a+v*(i+1)*31,0)), null_=[];
  // In Blöcken mischen: Hautbild und Gewohnheiten halten oft mehrere Tage an. Einzeln gemischt sähe Zufall zu „sicher“ aus.
  const blocks=[]; for(let i=0;i<ys.length;i+=SK_BLOCK) blocks.push(ys.slice(i,i+SK_BLOCK));
  for(let p=0;p<200;p++){ const B=blocks.slice(), off=Math.floor(rnd()*SK_BLOCK);
    for(let i=B.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [B[i],B[j]]=[B[j],B[i]]; }
    const flat=[].concat(...B), y=flat.slice(off).concat(flat.slice(0,off)); null_.push(maxStat(y)); }
  null_.sort((a,b)=>a-b); const T=Math.max(SK_T, null_[Math.floor(null_.length*0.95)]);
  const chosen=[];
  while(chosen.length<SK_MAXF){
    let best=null; const cand=[];
    for(const f of F){
      if(chosen.includes(f)) continue;
      if(f.combo&&chosen.some(c=>f.combo.includes(c.id)||c.combo)) continue;   // keine doppelte Aussage
      if(!f.combo&&chosen.some(c=>c.combo&&c.combo.includes(f.id))) continue;
      const m=fit([...chosen,f],ys); if(!m) continue;
      const k=chosen.length+1, b=m.o.beta[k], t=tOf(m,k);
      if(Math.sign(b)!==f.dir||Math.abs(b)<SK_EFF||Math.abs(t)<T*(chosen.length?1.15:1)) continue;   // weitere Auffälligkeiten brauchen etwas mehr Sicherheit
      // Kombination nur, wenn sie deutlich mehr erklärt als jede Gewohnheit allein
      if(f.combo){ const single=f.combo.map(id=>fit([...chosen,F.find(x=>x.id===id)],ys)).map(q=>q?q.o.beta[k]:0);
        if(single.some(v=>!(b<=v-0.5))) continue; }
      cand.push({f,b,t});
    }
    // Gegencheck: Die Auffälligkeit muss bestehen bleiben, wenn man jede andere Gewohnheit herausrechnet.
    // (Sonst bekäme z. B. Milch die Schuld, nur weil sie oft zusammen mit Zucker gegessen wird.)
    cand.sort((a,c)=>Math.abs(c.t)-Math.abs(a.t));
    const k=chosen.length+1;
    best=cand.find(c=>F.every(g=>{
      if(g===c.f||chosen.includes(g)||(c.f.combo&&c.f.combo.includes(g.id))||(g.combo&&(g.combo.includes(c.f.id)||c.f.combo))) return true;
      const m2=fit([...chosen,c.f,g],ys); if(!m2) return true;
      const b2=m2.o.beta[k], t2=tOf(m2,k);
      return Math.sign(b2)===c.f.dir&&Math.abs(b2)>=SK_EFF*0.7&&Math.abs(t2)>=1.8;
    }));
    if(!best) break;
    chosen.push(best.f);
  }
  let res=[];
  if(chosen.length){
    const m=fit(chosen,ys);   // endgültige Werte aus dem gemeinsamen Modell; jede Auffälligkeit muss dort weiter bestehen
    if(m) res=chosen.map((f,i)=>({f, diff:Math.round(m.o.beta[i+1]*10)/10, n:m.R.filter(k=>X[idx(f)][k]===1).length, t:tOf(m,i+1)}))
      .filter(x=>Math.sign(x.diff)===x.f.dir&&Math.abs(x.diff)>=SK_EFF&&Math.abs(x.t)>=SK_T)
      .sort((a,b)=>(a.diff<0?0:1)-(b.diff<0?0:1)||Math.abs(b.diff)-Math.abs(a.diff));
  }
  SK_MEMO.key=key; SK_MEMO.fp=fp; SK_MEMO.val=res; return res;
}
function skinTone(v){ return v<=4?"bad":v<=6?"warn":"ok"; }
function skinScale(cur,act){
  return `<div class="skscale">${Array.from({length:10},(_,i)=>i+1).map(v=>`<button class="sk-${skinTone(v)} ${cur===v?"on":""}" data-act="${act||"skin-rate"}" data-v="${v}" aria-label="Haut ${v} von 10">${v}</button>`).join("")}</div>
    <div class="skends"><span>schlecht</span><span>sehr gut</span></div>`;
}
function skinProgress(n){
  const left=Math.max(0,SK_MIN-n);
  return `<div class="skprog"><div class="skdots">${Array.from({length:SK_MIN},(_,i)=>`<i class="${i<n?"on":""}"></i>`).join("")}</div>
    <span class="sub">${left?`Analyse in ${left} ${left===1?"Tag":"Tagen"}`:"Analyse ist bereit"}</span></div>`;
}

// Verlauf: Karte „Haut“ mit Verlauf, Durchschnitt und Auffälligkeiten
function skinCard(){
  const cur=skinVal(state.date), all=skinDays(), n=all.length;
  const pts=Array.from({length:30},(_,i)=>addDays(state.date,i-29)).map((s,i)=>({s,i,v:skinVal(s)}));
  const v30=pts.map(q=>q.v).filter(v=>v!=null), v7=pts.slice(23).map(q=>q.v).filter(v=>v!=null);
  const fmt=v=>v==null?"–":de(v,1);
  const W=300,H=96,P=6,step=(W-2*P)/30,bw=step-3, Y=v=>H-14-(v/10)*(H-22);
  const col={bad:tc("bad"),warn:tc("warn"),ok:tc("accent")};
  const bars=pts.map(q=>{ const x=(P+q.i*step).toFixed(1);
    return q.v==null?`<rect x="${x}" y="${H-17}" width="${bw.toFixed(1)}" height="3" rx="1.5" fill="${tc("track")}"/>`
      :`<rect x="${x}" y="${Y(q.v).toFixed(1)}" width="${bw.toFixed(1)}" height="${(H-14-Y(q.v)).toFixed(1)}" rx="3" fill="${col[skinTone(q.v)]}" ${q.s===state.date?`stroke="${tc("ink")}" stroke-width="1.2"`:""}/>`; }).join("");
  const svg=`<svg class="chart" viewBox="0 0 ${W} ${H}">${bars}
    <text x="${P}" y="${H-1}" font-size="12" fill="${tc("ink-2")}">${parseIso(pts[0].s).getDate()}.${parseIso(pts[0].s).getMonth()+1}.</text>
    <text x="${W-P}" y="${H-1}" text-anchor="end" font-size="12" fill="${tc("ink-2")}">${labelDate(state.date)}</text></svg>`;
  const ins=skinInsights();
  const edit=cur==null||ui.skinEdit;
  const analysis=n<SK_MIN?`<div class="skbox">${skinProgress(n)}<div class="sub mt-2">Danach siehst du hier, was deinem Hautbild schadet oder guttut: Zucker, Fast Food, Milchprodukte, Schlaf, Wasser und deine Ernährung.</div></div>`
    :ins.length?`<div class="skins">${ins.map(x=>`<div class="skin-row"><div class="bubble${x.f.combo?" duo":""}">${x.f.emo}</div><div class="grow"><b>${esc(x.f.t)}</b><div class="sub">${[x.f.sub,x.n+" "+(x.n===1?"Tag":"Tage")].filter(Boolean).join(" · ")}</div></div><span class="skdelta ${x.diff<0?"down":"up"}">${x.diff>0?"+":"−"}${de(Math.abs(x.diff),1)}</span></div>`).join("")}</div>
      <div class="sub mt-2">Hautbild am Tag danach, verglichen mit deinen anderen Tagen (Punkte). Zeigt Auffälligkeiten in deinen Einträgen, keine Ursachen.</div>`
    :all.filter(s=>{ const i=skinDayInfo(addDays(s,-1)); return i&&i.logged; }).length<SK_MIN
      ?`<div class="skbox sub">Für die Analyse fehlen noch Tage mit vollständig eingetragenem Essen. Trag am Vortag möglichst alles ein, was du isst.</div>`
      :`<div class="skbox sub">Noch keine klaren Muster. Trag weiter Essen, Schlaf und Hautbild ein, dann wird es genauer.</div>`;
  return `<div class="section"><h2>Hautanalyse</h2><span class="sub">Ø ${fmt(skinAvg(v30))} · 30 Tage</span></div>
  <div class="card">
    <div class="row space"><div><b>${labelDate(state.date)}</b><div class="sub">Wie ist deine Haut?</div></div>
      ${edit?"":`<button class="row gap-2" data-act="skin-edit"><span class="skbig sk-${skinTone(cur)}">${cur}</span><span class="sub">/ 10 ›</span></button>`}</div>
    ${edit?`<div class="mt-3">${skinScale(cur)}</div>`:""}
    <div class="mt-3">${v30.length?svg:`<div class="sub li">Bewerte deine Haut, dann erscheint hier der Verlauf.</div>`}</div>
    <div class="kpi"><div><span>Ø 7 Tage</span><b>${fmt(skinAvg(v7))}</b></div><div><span>Ø 30 Tage</span><b>${fmt(skinAvg(v30))}</b></div><div><span>Einträge</span><b>${n}</b></div></div>
    <div class="skhead">Auffälligkeiten</div>
    ${analysis}
  </div>`;
}
