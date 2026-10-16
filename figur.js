// Health Maxxing – Übungs-Männchen: eigene, einfache SVG-Figur mit Bewegungs-Animation.
// Jede Übung nutzt ein Bewegungsmuster (Start-Pose A, End-Pose B). Die Figur pendelt weich zwischen A und B.
// Seitenansicht ("side") oder Frontansicht ("front"). Muskeln werden farbig hervorgehoben.

const FIG = (() => {
  const L = { torso:30, neck:3.5, head:6.5, ua:17, fa:16, th:23, sh:22, ft:7 };
  const R = Math.PI/180;
  const C = { body:"#c3cbd4", far:"#e0e5ea", prim:"#f26b3a", sec:"#f8b89c", prop:"#b9c1c9", dark:"#3f454c", ground:"#e3e7eb" };
  // Winkel: 0 = nach unten, 90 = nach vorne (rechts), 180 = nach oben, -90 = nach hinten (links)
  const dir = a => [Math.sin(a*R), Math.cos(a*R)];
  const add = (p,a,l) => { const d=dir(a); return [p[0]+d[0]*l, p[1]+d[1]*l]; };
  const ang = (p,q) => Math.atan2(q[0]-p[0], q[1]-p[1])/R;
  const f1 = n => Math.round(n*10)/10;

  // Zwei-Glieder-Rechnung (z. B. Schulter → Ellbogen → Hand), bend = Seite, in die das Gelenk knickt
  function ik(P, Q, l1, l2, bend){
    let d=Math.hypot(Q[0]-P[0], Q[1]-P[1]);
    d=Math.max(Math.abs(l1-l2)+.01, Math.min(l1+l2-.01, d));
    const A=Math.acos(Math.max(-1, Math.min(1, (l1*l1+d*d-l2*l2)/(2*l1*d))))/R;
    const J=add(P, ang(P,Q)+bend*A, l1);
    return [J, add(J, ang(J,Q), l2)];
  }

  // ---------- Posen berechnen ----------
  function sideLimbs(p){
    const hip=p.hip;
    const T=p.st ? ang(hip,p.st) : (p.T==null?180:p.T);
    const sh=add(hip,T,L.torso);
    const head=add(sh,T+(p.hd||0),L.neck+L.head);
    const rel=p.rel ? T-180 : 0;
    const arm=(U,F,ht,htr,eb,us,fs)=>{
      if(htr) ht=[hip[0]+htr[0], hip[1]+htr[1]];
      if(ht) return ik(sh, ht, L.ua, L.fa, eb==null?-1:eb);
      const e=add(sh,U+rel,L.ua*us); return [e, add(e,F+rel,L.fa*fs)];
    };
    const as=p.as==null?1:p.as, us=(p.us==null?1:p.us)*as, fs=(p.fs==null?1:p.fs)*as;
    const [el,ha]=arm(p.U||0, p.F||0, p.ht, p.htr, p.eb, us, fs);
    const [el2,ha2]=(p.U2!=null||p.ht2) ? arm(p.U2, p.F2, p.ht2, null, p.eb2, us, fs) : [el,ha];
    const leg=(Th,S,at,kb,Ft)=>{
      let k,a;
      if(at) [k,a]=ik(hip, at, L.th, L.sh, kb==null?1:kb);
      else { k=add(hip,Th||0,L.th); a=add(k,S||0,L.sh); }
      return [k, a, add(a, Ft!=null?Ft:ang(k,a)+90, L.ft)];
    };
    const [kn,an,to]=leg(p.Th, p.S, p.at, p.kb, p.Ft);
    const [kn2,an2,to2]=(p.Th2!=null||p.at2) ? leg(p.Th2, p.S2, p.at2, p.kb2, p.Ft2) : [kn,an,to];
    return { view:"side", T, hip, sh, head, el, ha, el2, ha2, kn, an, to, kn2, an2, to2 };
  }
  function frontLimbs(p){
    const hip=p.hip, tl=L.torso*(p.tl||1);
    const sy=hip[1]-tl-(p.sh||0);
    const shR=[hip[0]+11, sy];
    const head=[hip[0], hip[1]-tl-(L.neck+L.head)*(p.hs||1)];
    const as=p.as==null?1:p.as, us=(p.us==null?1:p.us)*as;
    let el,ha;
    if(p.ht) [el,ha]=ik(shR, p.ht, L.ua, L.fa, p.eb==null?-1:p.eb);
    else { el=add(shR,p.U||0,L.ua*us); ha=add(el,p.F||0,L.fa*as); }
    const hR=[hip[0]+6, hip[1]];
    let kn=add(hR,p.Th||0,L.th*(p.ts||1)), an=add(kn,p.S||0,L.sh*(p.ss||1));
    const to=[an[0]+5, an[1]+1.5];
    return { view:"front", hip, tl, sy, shR, head, el, ha, hc:[hip[0],ha[1]], hR, kn, an, to };
  }

  // Zwischen Pose A und B mischen (k = 0…1)
  function mix(A,B,k){
    const o={};
    for(const key in A){
      const a=A[key], b=B[key];
      if(b==null||typeof a==="boolean"||key==="kb"||key==="eb"||key==="kb2"||key==="eb2"||key==="rel") o[key]=a;
      else if(Array.isArray(a)) o[key]=[a[0]+(b[0]-a[0])*k, a[1]+(b[1]-a[1])*k];
      else o[key]=a+(b-a)*k;
    }
    return o;
  }

  // ---------- Zeichnen ----------
  const line=(a,b,w,c)=>`<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const circ=(p,r,c,extra)=>`<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${r}" fill="${c}"${extra||""}/>`;
  // Muskel als Ellipse entlang eines Körperteils. side: +1 vorne, -1 hinten, 0 Mitte
  function blob(P,Q,at,len,off,side,ry,col,torso){
    const dx=Q[0]-P[0], dy=Q[1]-P[1], l=Math.hypot(dx,dy)||1, ux=dx/l, uy=dy/l;
    const nx=torso?-uy:uy, ny=torso?ux:-ux;
    const cx=P[0]+dx*at+nx*off*side, cy=P[1]+dy*at+ny*off*side;
    const rx=Math.max(1.6, l*len/2);
    return { cx, cy, rx, ry, rot:Math.atan2(dy,dx)/R, col };
  }
  const ell=b=>`<ellipse cx="${f1(b.cx)}" cy="${f1(b.cy)}" rx="${f1(b.rx)}" ry="${f1(b.ry)}" transform="rotate(${f1(b.rot)} ${f1(b.cx)} ${f1(b.cy)})" fill="${b.col}"/>`;

  function musclesSide(J, mus){
    const torso=[], leg=[], arm=[];
    const put=(arr,m,fn)=>{ if(mus[m]) arr.push(fn(mus[m])); };
    const T=[J.hip,J.sh];
    put(torso,"brust",c=>blob(...T,.8,.3,4.2,1,3,c,1));
    put(torso,"bauch",c=>blob(...T,.4,.42,4.4,1,2.4,c,1));
    put(torso,"lat",c=>blob(...T,.6,.38,4.2,-1,3,c,1));
    put(torso,"ruecken",c=>blob(...T,.88,.22,4.2,-1,3.2,c,1));
    put(torso,"unterer",c=>blob(...T,.2,.28,4.4,-1,2.6,c,1));
    put(torso,"nacken",c=>blob(J.sh,J.head,.25,.5,1.5,-1,2.4,c,1));
    put(leg,"gesaess",c=>blob(J.hip,J.kn,.1,.42,4,-1,4.2,c));
    put(leg,"quads",c=>blob(J.hip,J.kn,.52,.72,2.2,1,3.3,c));
    put(leg,"beinbeuger",c=>blob(J.hip,J.kn,.52,.66,2.2,-1,3,c));
    put(leg,"adduktoren",c=>blob(J.hip,J.kn,.4,.5,.4,1,2.2,c));
    put(leg,"abduktoren",c=>blob(J.hip,J.kn,.2,.36,1.5,-1,2.6,c));
    put(leg,"waden",c=>blob(J.kn,J.an,.32,.48,1.6,-1,2.8,c));
    put(arm,"schultern",c=>blob(J.sh,J.el,.12,.34,0,0,4.3,c));
    put(arm,"bizeps",c=>blob(J.sh,J.el,.58,.56,1.3,1,2.5,c));
    put(arm,"trizeps",c=>blob(J.sh,J.el,.58,.56,1.3,-1,2.5,c));
    put(arm,"unterarme",c=>blob(J.el,J.ha,.35,.56,0,0,2.6,c));
    return { torso, leg, arm };
  }
  function musclesFront(J, mus){
    const out=[]; const hx=J.hip[0], sy=J.sy, tl=J.tl;
    const both=(b)=>{ out.push(b); out.push({...b, cx:2*hx-b.cx, rot:180-b.rot}); };
    const at=(m,fn)=>{ if(mus[m]) fn(mus[m]); };
    at("brust",c=>both({cx:hx+5.2, cy:sy+tl*.2, rx:4.8, ry:3.4, rot:0, col:c}));
    at("bauch",c=>out.push({cx:hx, cy:sy+tl*.6, rx:3.6, ry:tl*.22, rot:0, col:c}));
    at("lat",c=>both({cx:hx+8.6, cy:sy+tl*.45, rx:tl*.2, ry:2.2, rot:84, col:c}));
    at("ruecken",c=>both({cx:hx+6.5, cy:sy+1.4, rx:4.6, ry:2.2, rot:-8, col:c}));
    at("nacken",c=>both({cx:hx+4.4, cy:sy-1.6, rx:3.6, ry:1.8, rot:-24, col:c}));
    at("schultern",c=>both({cx:J.shR[0], cy:J.shR[1]+1, rx:4, ry:4, rot:0, col:c}));
    at("bizeps",c=>both(blob(J.shR,J.el,.58,.56,0,0,2.5,c)));
    at("trizeps",c=>both(blob(J.shR,J.el,.58,.5,1.4,1,2,c)));
    at("unterarme",c=>both(blob(J.el,J.ha,.35,.56,0,0,2.5,c)));
    at("quads",c=>both(blob(J.hR,J.kn,.55,.7,0,0,3.4,c)));
    at("adduktoren",c=>both(blob(J.hR,J.kn,.4,.5,2.4,-1,2,c)));
    at("abduktoren",c=>both(blob(J.hR,J.kn,.25,.44,2.8,1,2.2,c)));
    at("gesaess",c=>both({cx:hx+8.5, cy:J.hip[1]-1, rx:3, ry:3.4, rot:0, col:c}));
    at("beinbeuger",c=>both(blob(J.hR,J.kn,.55,.6,2.6,1,1.8,c)));
    at("waden",c=>both(blob(J.kn,J.an,.32,.48,1.8,1,2.4,c)));
    at("unterer",c=>out.push({cx:hx, cy:J.hip[1]-3, rx:6, ry:1.8, rot:0, col:c}));
    return out;
  }

  // Gewichte / Geräte an der Hand
  function gearSide(J, eq, pat){
    const h=J.ha, s=[];
    if(eq==="Langhantel"||eq==="SZ-Stange"||eq==="Smith-Maschine"){ s.push(circ(h,7.6,C.dark), circ(h,2.4,"#8b949d")); }
    else if(eq==="Kurzhantel"){ s.push(circ(h,4.6,C.dark), circ(h,1.6,"#8b949d")); }
    else if(eq==="Kettlebell"){ const k=[h[0],h[1]+5]; s.push(`<path d="M${f1(h[0]-3)} ${f1(h[1]+2)}Q${f1(h[0])} ${f1(h[1]-4)} ${f1(h[0]+3)} ${f1(h[1]+2)}" stroke="${C.dark}" stroke-width="1.6" fill="none"/>`, circ(k,5.4,C.dark)); }
    else if(eq==="Kabel"||eq==="Maschine"){ s.push(circ(h,2.4,C.dark)); }
    return s.join("");
  }
  function gearFront(J, eq, pat){
    const h=J.ha, h2=[2*J.hip[0]-h[0], h[1]], s=[];
    const bar=eq==="Langhantel"||eq==="SZ-Stange"||eq==="Smith-Maschine"||pat.bar;
    if(bar){
      const ext=eq==="Langhantel"||eq==="Smith-Maschine"?16:8;
      s.push(line([h2[0]-ext,h[1]],[h[0]+ext,h[1]],2.2,C.dark));
      if(eq==="Langhantel"||eq==="Smith-Maschine") s.push(`<rect x="${f1(h[0]+ext-4)}" y="${f1(h[1]-9)}" width="5" height="18" rx="1.5" fill="${C.dark}"/><rect x="${f1(h2[0]-ext-1)}" y="${f1(h[1]-9)}" width="5" height="18" rx="1.5" fill="${C.dark}"/>`);
    }
    else if(eq==="Kurzhantel") [h,h2].forEach(p=>s.push(`<rect x="${f1(p[0]-6)}" y="${f1(p[1]-2.2)}" width="12" height="4.4" rx="2.2" fill="${C.dark}"/>`));
    else if(eq==="Kettlebell") s.push(circ([J.hip[0],h[1]+5],5.4,C.dark));
    else if(eq==="Kabel"||eq==="Maschine") [h,h2].forEach(p=>s.push(circ(p,2.2,C.dark)));
    return s.join("");
  }
  // Statische und mitbewegte Requisiten (Bank, Stange, Kabel …)
  function props(list, J, front){
    return (list||[]).map(q=>{
      if(q.t==="rect") return `<rect x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}" rx="${q.r==null?2:q.r}" fill="${q.c||C.prop}"/>`;
      if(q.t==="line") return line([q.x1,q.y1],[q.x2,q.y2],q.w||3,q.c||C.prop);
      if(q.t==="dot") return circ([q.x,q.y],q.r||2.5,q.c||C.dark);
      const P=J[q.at]; if(!P) return "";
      if(q.t==="cable"){ const out=[line(P,q.to,1.1,"#9aa3ac")]; if(front) out.push(line([2*J.hip[0]-P[0],P[1]],[2*J.hip[0]-q.to[0],q.to[1]],1.1,"#9aa3ac")); return out.join(""); }
      if(q.t==="pad"){ const p=[P[0]+(q.dx||0),P[1]+(q.dy||0)]; const one=circ(p,q.r||3.6,C.dark); return front?one+circ([2*J.hip[0]-p[0],p[1]],q.r||3.6,C.dark):one; }
      if(q.t==="plate"){ const a=q.a, d=dir(a), o=[P[0]+d[0]*(q.off||3), P[1]+d[1]*(q.off||3)], n=dir(a+90), l=(q.len||28)/2;
        return line([o[0]-n[0]*l,o[1]-n[1]*l],[o[0]+n[0]*l,o[1]+n[1]*l],4,C.dark); }
      return "";
    }).join("");
  }

  function drawSide(J, mus, eq, pat){
    const M=musclesSide(J, mus), w=pat.w||{};
    const lim=(a,b,c,wd)=>line(a,b,wd,c);
    let s="";
    s+=props(pat.back, J);
    // hintere Gliedmaßen hell
    s+=lim(J.hip,J.kn2,C.far,9)+lim(J.kn2,J.an2,C.far,7)+lim(J.an2,J.to2,C.far,4);
    s+=lim(J.sh,J.el2,C.far,6.6)+lim(J.el2,J.ha2,C.far,5.4);
    s+=props(pat.mid, J);
    // Rumpf, Kopf
    s+=lim(J.hip,J.sh,C.body,13);
    s+=lim(J.sh,add(J.sh,ang(J.sh,J.head),L.neck+1),C.body,5);
    s+=circ(J.head,L.head,C.body);
    s+=M.torso.map(ell).join("");
    // vorderes Bein
    s+=lim(J.hip,J.kn,C.body,9.5)+lim(J.kn,J.an,C.body,7.2)+lim(J.an,J.to,C.body,4.2);
    s+=M.leg.map(ell).join("");
    // vorderer Arm
    s+=lim(J.sh,J.el,C.body,7)+lim(J.el,J.ha,C.body,5.6);
    s+=M.arm.map(ell).join("");
    s+=gearSide(J, eq, pat);
    s+=props(pat.front, J);
    return s;
  }
  function drawFront(J, mus, eq, pat){
    const hx=J.hip[0], m=p=>[2*hx-p[0],p[1]], sy=J.sy;
    const lim=(a,b,w)=>line(a,b,w,C.body)+line(m(a),m(b),w,C.body);
    let s=props(pat.back, J, true);
    s+=lim(J.hR,J.kn,8.6)+lim(J.kn,J.an,6.6)+lim(J.an,J.to,3.6);
    s+=`<path d="M${f1(hx-11)} ${f1(sy)}L${f1(hx+11)} ${f1(sy)}L${f1(hx+7)} ${f1(J.hip[1]+2)}L${f1(hx-7)} ${f1(J.hip[1]+2)}Z" fill="${C.body}" stroke="${C.body}" stroke-width="6" stroke-linejoin="round"/>`;
    s+=line([hx,sy],[hx,J.head[1]+3],5,C.body)+circ(J.head,L.head,C.body);
    s+=props(pat.mid, J, true);
    s+=lim(J.shR,J.el,6.8)+lim(J.el,J.ha,5.4);
    s+=musclesFront(J, mus).map(ell).join("");
    s+=gearFront(J, eq, pat);
    s+=props(pat.front, J, true);
    return s;
  }

  // Inhalt der Figur für Fortschritt k (0 = Start, 1 = Ende)
  function inner(ex, k){
    const pat=PAT[ex.pattern]; if(!pat) return "";
    const pose=mix(pat.A, pat.B||pat.A, k);
    const J=pat.view==="front" ? frontLimbs(pose) : sideLimbs(pose);
    const mus={};
    (ex.secondary||[]).forEach(m=>mus[m]=C.sec);
    (ex.primary||[]).forEach(m=>mus[m]=C.prim);
    const g=pat.ground==null?113:pat.ground;
    let s=g?`<line x1="4" y1="${g}" x2="116" y2="${g}" stroke="${C.ground}" stroke-width="1.6" stroke-linecap="round"/>`:"";
    s+=pat.view==="front" ? drawFront(J, mus, ex.eq, pat) : drawSide(J, mus, ex.eq, pat);
    return s;
  }
  // Fertiges SVG. anim = true → wird laufend bewegt (siehe figTick)
  function svg(ex, opt){
    opt=opt||{};
    const pat=PAT[ex&&ex.pattern];
    if(!pat) return `<svg class="fig ${opt.cls||""}" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="40" r="12" fill="${C.body}"/><rect x="42" y="56" width="36" height="44" rx="16" fill="${C.body}"/></svg>`;
    const k=opt.k==null?(pat.still==null?.55:pat.still):opt.k;
    return `<svg class="fig ${opt.cls||""}" viewBox="0 0 120 120" aria-hidden="true"${opt.anim?` data-fig="${ex.id}"`:""}>${inner(ex,k)}</svg>`;
  }
  return { svg, inner, C };
})();

// ---------- Bewegungsmuster ----------
// Koordinaten im Bild 120 × 120, Boden bei y = 113. hip = Hüfte, at = Fußgelenk-Ziel, ht = Hand-Ziel.
// T = Rumpfwinkel (180 = aufrecht), U/F = Ober-/Unterarm, Th/S = Ober-/Unterschenkel.
const STAND = { hip:[58,66], at:[60,110], T:180 };
const BENCH = [ {t:"rect",x:20,y:87,w:66,h:5,r:2.5,c:"#8d969f"}, {t:"line",x1:28,y1:92,x2:28,y2:112,w:3}, {t:"line",x1:78,y1:92,x2:78,y2:112,w:3} ];
const SEAT  = [ {t:"rect",x:34,y:91,w:30,h:5,r:2.5,c:"#8d969f"}, {t:"line",x1:49,y1:96,x2:49,y2:112,w:3} ];
const TOWER = x => ({t:"line",x1:x,y1:4,x2:x,y2:113,w:2.6,c:"#d3d9df"});
const LYING = { hip:[74,82], T:-90, at:[96,110] };
const PAT = {
  // --- Brust ---
  bench:   { view:"side", back:BENCH, A:{...LYING, ht:[53,71]}, B:{...LYING, ht:[47,50]} },
  incline: { view:"side", back:[{t:"line",x1:74,y1:95,x2:44,y2:66,w:5,c:"#8d969f"},{t:"line",x1:62,y1:95,x2:86,y2:95,w:5,c:"#8d969f"},{t:"line",x1:74,y1:95,x2:74,y2:112,w:3}],
             A:{hip:[72,89], T:-135, at:[96,110], ht:[58,62]}, B:{hip:[72,89], T:-135, at:[96,110], ht:[52,35]} },
  decline: { view:"side", back:[{t:"line",x1:80,y1:80,x2:30,y2:93,w:5,c:"#8d969f"},{t:"line",x1:56,y1:88,x2:56,y2:112,w:3}],
             A:{hip:[72,74], T:-76, at:[90,92], Ft:150, ht:[50,74]}, B:{hip:[72,74], T:-76, at:[90,92], Ft:150, ht:[44,52]} },
  chest_press:{ view:"side", back:[...SEAT,{t:"line",x1:41,y1:52,x2:41,y2:93,w:5,c:"#8d969f"}], A:{hip:[48,88], T:178, at:[72,110], ht:[64,60]}, B:{hip:[48,88], T:178, at:[72,110], ht:[81,59]} },
  fly_lying: { view:"side", back:BENCH, A:{...LYING, U:180, F:180, as:-.32}, B:{...LYING, U:180, F:180, as:1} },
  fly:     { view:"front", back:[TOWER(112),TOWER(8)], front:[{t:"cable",at:"ha",to:[112,12]}], A:{hip:[60,66], Th:6, S:2, U:105, F:105, as:1}, B:{hip:[60,66], Th:6, S:2, U:150, F:150, as:-.5} },
  fly_seat:{ view:"front", back:[{t:"rect",x:46,y:30,w:28,h:56,r:6,c:"#eceff2"}], A:{hip:[60,82], Th:12, S:2, ts:.35, U:93, F:96, as:1}, B:{hip:[60,82], Th:12, S:2, ts:.35, U:93, F:96, as:-.32} },
  rev_fly_seat:{ view:"front", back:[{t:"rect",x:46,y:30,w:28,h:56,r:6,c:"#eceff2"}], A:{hip:[60,82], Th:12, S:2, ts:.35, U:93, F:96, as:-.32}, B:{hip:[60,82], Th:12, S:2, ts:.35, U:93, F:96, as:1} },
  pushup:  { view:"side", A:{hip:[53.6,102], st:[80,98], at:[14,105], Ft:20, ht:[82,110]}, B:{hip:[54.8,89.4], st:[82,77], at:[14,105], Ft:20, ht:[82,110]} },
  dip:     { view:"side", back:[{t:"line",x1:44,y1:65,x2:84,y2:65,w:3.4,c:"#8d969f"},{t:"line",x1:80,y1:65,x2:80,y2:113,w:3}],
             A:{hip:[56,80], T:170, Th:16, S:-70, ht:[64,64]}, B:{hip:[56,62], T:176, Th:10, S:-55, ht:[64,64]} },
  bench_dip: { view:"side", back:[{t:"rect",x:16,y:80,w:32,h:5,c:"#8d969f"},{t:"line",x1:22,y1:85,x2:22,y2:112,w:3},{t:"line",x1:42,y1:85,x2:42,y2:112,w:3}],
             A:{hip:[56,96], T:178, at:[100,109], Ft:150, ht:[45,80]}, B:{hip:[56,80], T:178, at:[100,109], Ft:150, ht:[45,80]} },
  pullover:{ view:"side", back:BENCH, A:{...LYING, U:-80, F:-80}, B:{...LYING, U:-178, F:-178} },
  // --- Rücken ---
  row_bent:{ view:"side", A:{hip:[40,72], T:110, at:[56,110], ht:[68,94]}, B:{hip:[40,72], T:110, at:[56,110], ht:[58,76]} },
  row_seat:{ view:"side", back:[{t:"rect",x:28,y:91,w:30,h:5,r:2.5,c:"#8d969f"},{t:"line",x1:43,y1:96,x2:43,y2:112,w:3},{t:"line",x1:92,y1:88,x2:92,y2:112,w:4,c:"#8d969f"}], front:[{t:"cable",at:"ha",to:[108,72]}],
             A:{hip:[42,90], T:158, at:[88,100], Ft:180, ht:[88,70]}, B:{hip:[42,90], T:184, at:[88,100], Ft:180, ht:[62,74]} },
  pulldown:{ view:"front", bar:true, back:[{t:"rect",x:46,y:84,w:28,h:5,c:"#8d969f"},{t:"line",x1:44,y1:93,x2:76,y2:93,w:4,c:"#8d969f"}], front:[{t:"cable",at:"hc",to:[60,0]}],
             A:{hip:[60,82], Th:10, S:0, ts:.35, U:160, F:170}, B:{hip:[60,82], Th:10, S:0, ts:.35, U:58, F:172} },
  pullup:  { view:"front", ground:0, back:[{t:"line",x1:10,y1:12,x2:110,y2:12,w:3,c:"#8d969f"}], A:{hip:[60,71], Th:3, S:2, ht:[86,12]}, B:{hip:[60,48], Th:3, S:2, ht:[86,12]} },
  straight_pd:{ view:"side", back:[TOWER(108)], front:[{t:"cable",at:"ha",to:[104,10]}], A:{...STAND, T:170, U:150, F:150}, B:{...STAND, T:170, U:8, F:8} },
  face_pull:{ view:"side", back:[TOWER(112)], front:[{t:"cable",at:"ha",to:[110,36]}], A:{...STAND, U:92, F:92, us:1}, B:{...STAND, U:92, F:178, us:-.62} },
  deadlift:{ view:"side", still:.3, A:{hip:[38,86], T:130, at:[58,110], U:0, F:0}, B:{hip:[56,66], T:180, at:[58,110], U:0, F:0} },
  rdl:     { view:"side", still:.3, A:{hip:[40,72], T:100, at:[58,110], U:0, F:0}, B:{hip:[56,66], T:180, at:[58,110], U:0, F:0} },
  good_morning:{ view:"side", still:.3, A:{hip:[42,70], T:100, at:[58,110], U:-40, F:150, rel:true}, B:{hip:[56,66], T:180, at:[58,110], U:-40, F:150, rel:true} },
  back_ext:{ view:"side", back:[{t:"line",x1:62,y1:74,x2:32,y2:98,w:5,c:"#8d969f"},{t:"line",x1:46,y1:88,x2:46,y2:112,w:3}], front:[{t:"pad",at:"an",dx:2,dy:2}],
             A:{hip:[58,72], T:36, at:[24,100], Ft:40, U:18, F:170, rel:true}, B:{hip:[58,72], T:128, at:[24,100], Ft:40, U:18, F:170, rel:true} },
  shrug:   { view:"front", A:{hip:[60,66], Th:4, S:2, U:2, F:2, sh:0}, B:{hip:[60,66], Th:4, S:2, U:2, F:2, sh:5} },
  // --- Schultern ---
  ohp:     { view:"side", A:{...STAND, ht:[66,33]}, B:{...STAND, ht:[60,4]} },
  ohp_seat:{ view:"side", back:[...SEAT,{t:"line",x1:44,y1:52,x2:44,y2:93,w:5,c:"#8d969f"}], A:{hip:[52,88], T:178, at:[76,110], ht:[60,55]}, B:{hip:[52,88], T:178, at:[76,110], ht:[55,26]} },
  lat_raise:{ view:"front", A:{hip:[60,66], Th:4, S:2, U:8, F:8}, B:{hip:[60,66], Th:4, S:2, U:88, F:92} },
  front_raise:{ view:"side", A:{...STAND, U:5, F:5}, B:{...STAND, U:95, F:95} },
  rear_fly:{ view:"front", A:{hip:[60,66], Th:4, S:2, tl:.55, hs:.55, U:4, F:4}, B:{hip:[60,66], Th:4, S:2, tl:.55, hs:.55, U:84, F:88} },
  upright: { view:"front", A:{hip:[60,66], Th:4, S:2, U:-8, F:-6, us:1}, B:{hip:[60,66], Th:4, S:2, U:100, F:-80, us:.62} },
  // --- Arme ---
  curl:    { view:"side", A:{...STAND, U:2, F:2}, B:{...STAND, U:12, F:160} },
  curl_cable:{ view:"side", back:[TOWER(96)], front:[{t:"cable",at:"ha",to:[92,108]}], A:{...STAND, U:2, F:8}, B:{...STAND, U:12, F:160} },
  preacher:{ view:"side", back:[...SEAT,{t:"line",x1:64,y1:62,x2:78,y2:78,w:5,c:"#8d969f"},{t:"line",x1:74,y1:76,x2:74,y2:112,w:3}], A:{hip:[52,88], T:166, at:[76,110], U:42, F:48}, B:{hip:[52,88], T:166, at:[76,110], U:42, F:168} },
  pushdown:{ view:"side", back:[TOWER(96)], front:[{t:"cable",at:"ha",to:[92,8]}], A:{...STAND, U:6, F:150}, B:{...STAND, U:4, F:6} },
  tri_oh:  { view:"side", A:{...STAND, U:176, F:-28}, B:{...STAND, U:176, F:178} },
  skull:   { view:"side", back:BENCH, A:{...LYING, U:-168, F:-78}, B:{...LYING, U:-168, F:-172} },
  kickback:{ view:"side", A:{hip:[40,72], T:115, at:[56,110], U:-72, F:4}, B:{hip:[40,72], T:115, at:[56,110], U:-72, F:-70} },
  // --- Beine ---
  squat:   { view:"side", still:.4, A:{hip:[41,88], T:140, at:[58,110], U:-40, F:150, rel:true}, B:{hip:[56,66], T:178, at:[58,110], U:-40, F:150, rel:true} },
  squat_front:{ view:"side", still:.4, A:{hip:[42,88], T:150, at:[58,110], U:100, F:-80, rel:true}, B:{hip:[56,66], T:179, at:[58,110], U:100, F:-80, rel:true} },
  squat_goblet:{ view:"side", still:.4, A:{hip:[42,88], T:148, at:[58,110], U:10, F:160, rel:true}, B:{hip:[56,66], T:179, at:[58,110], U:10, F:160, rel:true} },
  squat_bw:{ view:"side", still:.4, A:{hip:[41,88], T:140, at:[58,110], U:88, F:90}, B:{hip:[56,66], T:178, at:[58,110], U:86, F:88} },
  legpress:{ view:"side", back:[{t:"line",x1:50,y1:93,x2:18,y2:64,w:5,c:"#8d969f"},{t:"line",x1:44,y1:94,x2:44,y2:112,w:3},{t:"line",x1:66,y1:104,x2:112,y2:44,w:2.4,c:"#d3d9df"}], front:[{t:"plate",at:"an",a:126,off:4,len:30}],
             A:{hip:[46,86], T:-130, at:[70,70], kb:1, Ft:-150, ht:[50,92]}, B:{hip:[46,86], T:-130, at:[80,57], kb:1, Ft:-150, ht:[50,92]} },
  lunge:   { view:"side", still:.4, A:{hip:[54,86], T:180, at:[72,110], at2:[38,108], Ft2:30, U:0, F:0}, B:{hip:[55,67], T:180, at:[72,110], at2:[38,108], Ft2:30, U:0, F:0} },
  lunge_bb:{ view:"side", still:.4, A:{hip:[54,86], T:180, at:[72,110], at2:[38,108], Ft2:30, U:-40, F:150, rel:true}, B:{hip:[55,67], T:180, at:[72,110], at2:[38,108], Ft2:30, U:-40, F:150, rel:true} },
  split_squat:{ view:"side", still:.4, back:[{t:"rect",x:12,y:86,w:28,h:5,c:"#8d969f"},{t:"line",x1:26,y1:91,x2:26,y2:112,w:3}],
             A:{hip:[52,88], T:178, at:[72,110], at2:[27,83], Ft2:-120, U:0, F:0}, B:{hip:[56,70], T:180, at:[72,110], at2:[27,83], Ft2:-120, U:0, F:0} },
  stepup:  { view:"side", back:[{t:"rect",x:64,y:92,w:34,h:21,r:3,c:"#d3d9df"}], A:{hip:[56,70], T:178, at:[76,90], at2:[52,110], U:0, F:0}, B:{hip:[74,46], T:180, at:[76,90], at2:[62,78], U:0, F:0} },
  leg_ext: { view:"side", back:[{t:"rect",x:30,y:84,w:42,h:5,c:"#8d969f"},{t:"line",x1:36,y1:50,x2:36,y2:89,w:5,c:"#8d969f"},{t:"line",x1:50,y1:89,x2:50,y2:112,w:3}], front:[{t:"pad",at:"an",dx:2,dy:1}],
             A:{hip:[46,80], T:176, Th:90, S:6, ht:[52,86]}, B:{hip:[46,80], T:176, Th:90, S:84, ht:[52,86]} },
  leg_curl_lying:{ view:"side", back:[{t:"rect",x:30,y:90,w:76,h:5,c:"#8d969f"},{t:"line",x1:40,y1:95,x2:40,y2:112,w:3},{t:"line",x1:96,y1:95,x2:96,y2:112,w:3}], front:[{t:"pad",at:"an",dx:0,dy:-4}],
             A:{hip:[58,86], T:90, Th:-90, S:-90, Ft:0, ht:[100,96]}, B:{hip:[58,86], T:90, Th:-90, S:-200, Ft:-110, ht:[100,96]} },
  leg_curl_seat:{ view:"side", back:[{t:"rect",x:30,y:84,w:42,h:5,c:"#8d969f"},{t:"line",x1:36,y1:50,x2:36,y2:89,w:5,c:"#8d969f"},{t:"line",x1:50,y1:89,x2:50,y2:112,w:3}], front:[{t:"pad",at:"an",dx:3,dy:0}],
             A:{hip:[46,80], T:176, Th:90, S:82, ht:[52,86]}, B:{hip:[46,80], T:176, Th:90, S:-12, ht:[52,86]} },
  calf:    { view:"side", A:{hip:[58,66], T:180, at:[60,110], Ft:90, U:0, F:0}, B:{hip:[58.6,61], T:180, at:[61.3,106], Ft:55, U:0, F:0} },
  calf_seat:{ view:"side", back:SEAT, front:[{t:"pad",at:"kn",dx:0,dy:-5}], A:{hip:[44,84], T:178, at:[67,106], Ft:90, ht:[60,82]}, B:{hip:[44,84], T:178, at:[68.3,102], Ft:55, ht:[60,82]} },
  adduct:  { view:"front", back:[{t:"rect",x:46,y:84,w:28,h:5,c:"#8d969f"}], front:[{t:"pad",at:"kn",dx:-3,dy:0}], A:{hip:[60,82], Th:42, S:0, ts:.45, U:20, F:10}, B:{hip:[60,82], Th:6, S:0, ts:.45, U:20, F:10} },
  abduct:  { view:"front", back:[{t:"rect",x:46,y:84,w:28,h:5,c:"#8d969f"}], front:[{t:"pad",at:"kn",dx:3,dy:0}], A:{hip:[60,82], Th:6, S:0, ts:.45, U:20, F:10}, B:{hip:[60,82], Th:42, S:0, ts:.45, U:20, F:10} },
  // --- Gesäß ---
  hip_thrust:{ view:"side", back:[{t:"rect",x:12,y:84,w:26,h:5,c:"#8d969f"},{t:"line",x1:24,y1:89,x2:24,y2:112,w:3}], A:{hip:[56,100], st:[34,86], at:[80,110], htr:[1,-6]}, B:{hip:[58,82], st:[34,86], at:[80,110], htr:[1,-6]} },
  bridge:  { view:"side", A:{hip:[54,107], st:[24,108], at:[80,110], htr:[1,-6]}, B:{hip:[56,90], st:[24,108], at:[80,110], htr:[1,-6]} },
  glute_kick:{ view:"side", back:[TOWER(100)], front:[{t:"cable",at:"an",to:[98,106]}], A:{hip:[56,66], T:168, at2:[58,110], Th:6, S:4, ht:[78,62]}, B:{hip:[56,66], T:164, at2:[58,110], Th:-48, S:-36, ht:[78,62]} },
  swing:   { view:"side", A:{hip:[40,74], T:110, at:[56,110], U:-18, F:-18}, B:{hip:[56,66], T:180, at:[58,110], U:90, F:90} },
  // --- Core ---
  crunch:  { view:"side", A:{hip:[66,105], T:-90, at:[92,110], U:18, F:170, rel:true}, B:{hip:[66,105], T:-122, at:[92,110], U:18, F:170, rel:true} },
  situp:   { view:"side", A:{hip:[66,105], T:-90, at:[92,110], U:18, F:170, rel:true}, B:{hip:[66,105], T:-165, at:[92,110], U:18, F:170, rel:true} },
  plank:   { view:"side", still:0, d:3600, A:{hip:[58.4,97.8], st:[88,93], at:[14,105], Ft:20, ht:[104,110]}, B:{hip:[58.4,96.6], st:[88,92.6], at:[14,105], Ft:20, ht:[104,110]} },
  leg_raise:{ view:"side", A:{hip:[60,105], T:-90, Th:92, S:92, U:90, F:90}, B:{hip:[60,105], T:-90, Th:176, S:176, U:90, F:90} },
  hang_raise:{ view:"side", ground:0, back:[{t:"dot",x:60,y:9,r:2.8,c:"#8d969f"}], A:{hip:[60,74], T:180, Th:4, S:4, ht:[60,10]}, B:{hip:[60,74], T:180, Th:92, S:92, ht:[60,10]} },
  cable_crunch:{ view:"side", back:[TOWER(80)], front:[{t:"cable",at:"ha",to:[76,4]}], A:{hip:[52,84], T:178, at:[32,108], Ft:-80, U:60, F:175, rel:true}, B:{hip:[48,86], T:78, at:[30,108], Ft:-80, U:60, F:175, rel:true} },
  ab_wheel:{ view:"side", front:[{t:"pad",at:"ha",dy:4,r:5}], A:{hip:[50,84], T:140, at:[30,108], Ft:-80, ht:[64,104]}, B:{hip:[62,92], T:100, at:[30,108], Ft:-80, ht:[100,104]} },
  mountain:{ view:"side", d:1500, A:{hip:[55,89], st:[82,77], at:[16,105], Ft:20, at2:[14,105], Ft2:20, ht:[82,110]}, B:{hip:[55,89], st:[82,77], at:[60,100], Ft:40, at2:[14,105], Ft2:20, ht:[82,110]} },
  jacks:   { view:"front", d:1400, A:{hip:[60,66], Th:3, S:2, U:8, F:8}, B:{hip:[60,63], Th:20, S:16, U:160, F:168} }
};
// Ausführungs-Tipps je Bewegungsmuster (kurz)
const CUES = {
  bench:["Schulterblätter zusammen, Füße fest am Boden","Stange kontrolliert zur unteren Brust","Nach oben drücken, ohne die Ellbogen zu sperren"],
  incline:["Bank auf 30–45° stellen","Gewicht zur oberen Brust senken","Gerade nach oben drücken"],
  decline:["Beine sicher einhaken","Zur unteren Brust senken","Kontrolliert hochdrücken"],
  chest_press:["Sitz so einstellen, dass Griffe auf Brusthöhe sind","Nach vorne drücken, Rücken bleibt am Polster","Langsam zurückführen"],
  fly_lying:["Ellbogen leicht gebeugt lassen","Arme im Bogen weit öffnen","Über der Brust zusammenführen"],
  fly:["Leicht nach vorne lehnen","Arme im Bogen nach vorne-unten ziehen","Brust anspannen, langsam öffnen"],
  fly_seat:["Rücken ans Polster","Arme vor der Brust zusammenführen","Langsam öffnen"],
  rev_fly_seat:["Brust ans Polster","Arme nach hinten-außen öffnen","Schulterblätter zusammen, langsam zurück"],
  pushup:["Körper bildet eine Linie","Brust kontrolliert Richtung Boden","Hände unter den Schultern"],
  dip:["Schultern weg von den Ohren","Senken, bis die Oberarme etwa waagerecht sind","Kraftvoll hochdrücken"],
  bench_dip:["Hände schulterbreit an der Bankkante","Hüfte nah an der Bank senken","Mit den Armen hochdrücken"],
  pullover:["Arme fast gestreckt","Gewicht im Bogen hinter den Kopf","Zurück über die Brust ziehen"],
  row_bent:["Rücken gerade, Oberkörper vorgebeugt","Gewicht zum Bauch ziehen","Schulterblätter zusammendrücken"],
  row_seat:["Aufrecht sitzen, Brust raus","Griff zum Bauch ziehen","Arme langsam wieder strecken"],
  pulldown:["Oberschenkel unter das Polster","Stange zur oberen Brust ziehen","Langsam nach oben führen"],
  pullup:["Aus dem Hang starten","Kinn über die Stange ziehen","Kontrolliert ablassen"],
  straight_pd:["Arme fast gestreckt","Stange im Bogen zu den Oberschenkeln","Lat anspannen, langsam zurück"],
  face_pull:["Seil auf Kopfhöhe","Zum Gesicht ziehen, Ellbogen hoch","Hände neben die Ohren"],
  deadlift:["Stange nah am Schienbein, Rücken gerade","Aus den Beinen hochdrücken","Oben Hüfte strecken, nicht überstrecken"],
  rdl:["Knie leicht gebeugt","Hüfte nach hinten schieben, Rücken gerade","Gewicht nah an den Beinen führen"],
  good_morning:["Stange auf dem oberen Rücken","Hüfte nach hinten, Rücken gerade","Wieder aufrichten"],
  back_ext:["Hüfte am Polster","Oberkörper kontrolliert senken","Bis zur geraden Linie hochkommen"],
  shrug:["Arme bleiben gestreckt","Schultern gerade nach oben ziehen","Kurz halten, langsam senken"],
  ohp:["Bauch und Po anspannen","Gewicht gerade über den Kopf drücken","Kontrolliert zurück auf Kinnhöhe"],
  ohp_seat:["Rücken ans Polster","Gewicht über den Kopf drücken","Langsam auf Ohrhöhe senken"],
  lat_raise:["Ellbogen leicht gebeugt","Arme seitlich bis Schulterhöhe heben","Langsam senken"],
  front_raise:["Arme fast gestreckt","Nach vorne bis Schulterhöhe heben","Ohne Schwung senken"],
  rear_fly:["Oberkörper vorgebeugt, Rücken gerade","Arme seitlich öffnen","Schulterblätter zusammen"],
  upright:["Enger Griff","Ellbogen führen nach oben","Bis etwa Brusthöhe ziehen"],
  curl_cable:["Ellbogen bleiben am Körper","Griff hochbeugen ohne Schwung","Langsam ablassen"],
  curl:["Ellbogen bleiben am Körper","Gewicht hochbeugen ohne Schwung","Langsam ablassen"],
  preacher:["Oberarme fest auf dem Polster","Gewicht hochbeugen","Fast ganz strecken"],
  pushdown:["Ellbogen am Körper fixieren","Nach unten drücken bis die Arme gestreckt sind","Langsam zurück"],
  tri_oh:["Ellbogen zeigen nach oben","Gewicht hinter den Kopf senken","Arme strecken"],
  skull:["Oberarme bleiben ruhig","Gewicht zur Stirn senken","Arme strecken"],
  kickback:["Oberkörper vorgebeugt","Oberarm parallel zum Körper","Unterarm nach hinten strecken"],
  squat:["Füße schulterbreit","Hüfte nach hinten-unten, Knie über die Zehen","Aus der Ferse hochdrücken"],
  squat_front:["Ellbogen hoch, Oberkörper aufrecht","Tief in die Hocke","Hochdrücken"],
  squat_goblet:["Gewicht vor der Brust","Aufrecht tief in die Hocke","Aus den Fersen hochdrücken"],
  squat_bw:["Arme nach vorne","Hüfte nach hinten-unten","Wieder aufrichten"],
  legpress:["Rücken flach am Polster","Füße schulterbreit auf der Platte","Drücken, Knie nicht ganz sperren"],
  lunge:["Großer Schritt nach vorne","Hinteres Knie Richtung Boden","Über die vordere Ferse hochdrücken"],
  lunge_bb:["Stange auf dem oberen Rücken","Hinteres Knie Richtung Boden","Über die vordere Ferse hochdrücken"],
  split_squat:["Hinterer Fuß auf der Bank","Gerade nach unten senken","Mit dem vorderen Bein hochdrücken"],
  stepup:["Ganzer Fuß auf der Box","Mit dem oberen Bein hochdrücken","Kontrolliert absteigen"],
  leg_ext:["Knie auf Höhe des Drehpunkts","Beine strecken","Langsam beugen"],
  leg_curl_lying:["Hüfte bleibt auf dem Polster","Fersen zum Po ziehen","Langsam strecken"],
  leg_curl_seat:["Polster über den Knöcheln","Fersen nach unten-hinten ziehen","Langsam zurück"],
  calf:["Fußballen auf dem Boden oder einer Kante","Auf die Zehenspitzen drücken","Langsam senken"],
  calf_seat:["Polster auf den Knien","Fersen hochdrücken","Langsam senken"],
  adduct:["Rücken ans Polster","Beine zusammendrücken","Langsam öffnen"],
  abduct:["Rücken ans Polster","Beine nach außen drücken","Langsam schließen"],
  hip_thrust:["Oberer Rücken auf der Bank","Hüfte hochdrücken, Po anspannen","Oben kurz halten"],
  bridge:["Füße nah am Po","Hüfte hochdrücken","Po oben anspannen"],
  glute_kick:["Oberkörper leicht vorgebeugt","Bein gestreckt nach hinten führen","Po anspannen, langsam zurück"],
  swing:["Schwung kommt aus der Hüfte","Hüfte kräftig nach vorne strecken","Arme bleiben locker"],
  crunch:["Füße am Boden","Schultern vom Boden heben","Unterer Rücken bleibt unten"],
  situp:["Füße am Boden","Oberkörper ganz aufrichten","Langsam zurückrollen"],
  plank:["Unterarme unter den Schultern","Körper bildet eine Linie","Bauch und Po anspannen"],
  leg_raise:["Unterer Rücken bleibt am Boden","Beine gestreckt heben","Langsam senken"],
  hang_raise:["Ruhig hängen, nicht schwingen","Beine bis waagerecht heben","Langsam senken"],
  cable_crunch:["Seil neben dem Kopf halten","Oberkörper nach unten einrollen","Hüfte bleibt ruhig"],
  ab_wheel:["Auf den Knien starten","Rolle langsam nach vorne","Bauch fest, zurückrollen"],
  mountain:["Hände unter den Schultern","Knie im Wechsel zur Brust","Hüfte bleibt tief"],
  jacks:["Locker in den Knien","Beine öffnen, Arme über den Kopf","Zurück zur Mitte springen"]
};

// Läuft, solange ein animiertes Männchen sichtbar ist
let figRaf=null, figPaused=false;
function figKick(){
  const reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(figRaf||figPaused||reduce) return;
  const t0=performance.now();
  const step=now=>{
    const els=document.querySelectorAll("svg[data-fig]");
    if(!els.length||figPaused){ figRaf=null; return; }
    els.forEach(el=>{
      const ex=exInfoOf(el.dataset.fig); const pat=ex&&PAT[ex.pattern]; if(!pat) return;
      const d=pat.d||2600, t=((now-t0)%d)/d;
      // weich hin und zurück, kurz halten an beiden Enden
      let k=.5-.5*Math.cos(t*2*Math.PI);
      k=Math.min(1,Math.max(0,(k-.06)/.88));
      el.innerHTML=FIG.inner(ex,k);
    });
    figRaf=requestAnimationFrame(step);
  };
  figRaf=requestAnimationFrame(step);
}
