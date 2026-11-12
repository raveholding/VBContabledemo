/* ===== V28 · A · Núcleo de los módulos nuevos + CAJA DEL ESTUDIO =====
   Caja con turnos, cobro de honorarios (pagos mixtos, vuelto, recargo, un solo beneficio: gana el mayor),
   arqueo con Corte X / Corte Z sellados con SHA-256 encadenado e historial verificable. */
const CJ={cfg:{recCred:8,fondo:20000,medios:['Efectivo','Transferencia','Mercado Pago','Débito','Crédito']},turnos:[],nid:1};
const RH={leg:[],fich:[],lic:[],docs:[],cfg:{jornada:8,tol:10,metodo:'PIN',vacBase:14},nid:1};
const CB={cfg:{ptsPor:1000,niveles:[
 {n:'Bronce',min:0,d:0,ic:'🥉',b:'Atención por orden de llegada y aviso de vencimientos por WhatsApp.'},
 {n:'Plata',min:500,d:3,ic:'🥈',b:'3% de descuento en honorarios y respuesta prioritaria.'},
 {n:'Oro',min:1500,d:5,ic:'🥇',b:'5% de descuento, una consulta de inversiones por trimestre sin cargo.'},
 {n:'Platino',min:3500,d:8,ic:'💎',b:'8% de descuento, reunión anual de planificación impositiva y línea directa.'}]},
 mov:[],cup:[],pre:[],ref:[],nid:1};
let XINIT=false;
S.tab.caja='turno';S.tab.equipo='legajos';S.tab.club='resumen';S.cb={cid:'',sel:[],cup:'',medio:'Efectivo',mixto:false,ef:'',rec:''};

/* ---- utilidades ---- */
function sha256s(str){
 const b=new TextEncoder().encode(str),l=b.length,w=new Uint32Array(((l+9+63)>>6)<<4);
 for(let i=0;i<l;i++)w[i>>2]|=b[i]<<(24-(i&3)*8);
 w[l>>2]|=0x80<<(24-(l&3)*8);w[w.length-1]=l*8;
 const K=new Uint32Array(64),H=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
 let n=2,c=0;while(c<64){let p=1;for(let d=2;d*d<=n;d++)if(n%d===0){p=0;break}if(p)K[c++]=Math.floor((Math.cbrt(n)%1)*4294967296);n++}
 const W=new Uint32Array(64);
 for(let o=0;o<w.length;o+=16){
  for(let t=0;t<16;t++)W[t]=w[o+t];
  for(let t=16;t<64;t++){const a=W[t-15],e=W[t-2];W[t]=(W[t-16]+(((a>>>7)|(a<<25))^((a>>>18)|(a<<14))^(a>>>3))+W[t-7]+(((e>>>17)|(e<<15))^((e>>>19)|(e<<13))^(e>>>10)))|0}
  let a=H[0],b2=H[1],c2=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
  for(let t=0;t<64;t++){
   const t1=(h+(((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7)))+((e&f)^(~e&g))+K[t]+W[t])|0;
   const t2=((((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10)))+((a&b2)^(a&c2)^(b2&c2)))|0;
   h=g;g=f;f=e;e=(d+t1)|0;d=c2;c2=b2;b2=a;a=(t1+t2)|0}
  H[0]+=a;H[1]+=b2;H[2]+=c2;H[3]+=d;H[4]+=e;H[5]+=f;H[6]+=g;H[7]+=h}
 return[...H].map(x=>x.toString(16).padStart(8,'0')).join('');
}
const tabsH=(v,defs)=>`<div class="tabs">${defs.map(([k,l,n])=>`<button class="${S.tab[v]===k?'on':''}" data-act="tab" data-v="${v}" data-t="${k}">${l}${n?` <span class="badge b-warn">${n}</span>`:''}</button>`).join('')}</div>`;
const hm=ts=>new Date(ts).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
const fdh=ts=>new Date(ts).toLocaleString('es-AR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
const tsAt=(dOff,h,m)=>{const d=addD(TODAY,dOff);d.setHours(h,m||0,0,0);return d.getTime()};
const pct1=v=>num(v,1)+'%';
const stepper=(steps)=>`<div class="stepper">${steps.map((s,i)=>`<div class="st ${s[2]||''}"><i>${s[2]==='done'?'✔':i+1}</i><div><b>${s[0]}</b><small>${s[1]}</small></div></div>`).join('')}</div>`;

/* ---- datos de ejemplo (sólo en modo «datos de ejemplo») ---- */
function modEnsure(){
 if(XINIT)return;XINIT=true;
 if(!RH.leg.length)STAFF.forEach((s,i)=>RH.leg.push({id:RH.nid++,n:s.n,rol:s.r,mat:s.m,ingreso:iso(addD(TODAY,-365*(i===0?15:i===1?9:i===2?5:i===3?4:2)-i*37)),basico:[1650000,1380000,980000,1250000,820000][i]||800000,pin:String(1111*(i+1)).slice(0,4),jornada:8,vac:CCvac(i),est:'Activo',sid:i}));
 if(CFG.mode!=='ejemplo')return;
 /* caja */
 const mv=(h,t,m,x,c)=>[h,t,m,x,c];
 const seedT=(off,fondo,movs,dif)=>{const abre=tsAt(off,9,0);const t={id:CJ.nid++,abre,user:'Marta Gómez',fondo,mov:movs.map(([h,tipo,medio,monto,con])=>({ts:abre+h*3600e3,tipo,medio,monto,con})),estado:'cerrado',cortes:[]};cjSealZ(t,cjEsp(t)+dif,abre+9.4*3600e3);CJ.turnos.push(t)};
 seedT(-3,15000,[mv(1,'ing','Efectivo',48000,'Honorarios · Carlos Benítez'),mv(2,'ing','Transferencia',210000,'Honorarios · Panadería La Espiga'),mv(3,'egr','Efectivo',6500,'Librería y fotocopias'),mv(5,'ing','Mercado Pago',95000,'Alta de monotributo + consulta')],0);
 seedT(-2,15000,[mv(1,'ing','Efectivo',72000,'Honorarios · Sueldos del mes'),mv(2,'ing','Débito',120000,'Honorarios · Balance'),mv(4,'egr','Efectivo',12000,'Cadetería de documentación'),mv(6,'ing','Efectivo',35000,'Asesoramiento puntual')],-500);
 seedT(-1,15000,[mv(1,'ing','Transferencia',185000,'Honorarios · abono mensual'),mv(3,'ing','Efectivo',54000,'Honorarios · Carlos Benítez'),mv(5,'egr','Efectivo',9800,'Insumos de oficina'),mv(6,'ing','Crédito',64800,'Honorarios · liquidación IVA (con recargo)')],0);
 const ab=Math.min(tsAt(0,9,0),Date.now()-4*3600e3);
 CJ.turnos.push({id:CJ.nid++,abre:ab,user:'Marta Gómez',fondo:20000,estado:'abierto',cortes:[],mov:[
  {ts:ab+1*3600e3,tipo:'ing',medio:'Efectivo',monto:48000,con:'Honorarios · Carlos Benítez'},
  {ts:ab+2*3600e3,tipo:'ing',medio:'Transferencia',monto:210000,con:'Honorarios · Panadería La Espiga'},
  {ts:ab+2.5*3600e3,tipo:'egr',medio:'Efectivo',monto:4500,con:'Café y agua de la oficina'}].filter(m=>m.ts<=Date.now())});
 /* equipo */
 const wk=[];for(let k=1;k<=6&&wk.length<4;k++){const d=addD(TODAY,-k);if(d.getDay()>0&&d.getDay()<6)wk.push(-k)}
 RH.leg.forEach((l,i)=>wk.forEach((off,j)=>{const ent=tsAt(off,8,[0,3,12,55,2][(i+j)%5]),sal=tsAt(off,17,[5,0,30,10,15][(i*2+j)%5]);RH.fich.push({lid:l.id,ts:ent,tipo:'in',via:'PIN'});RH.fich.push({lid:l.id,ts:sal,tipo:'out',via:'PIN'})}));
 const hoy=RH.leg.filter((l,i)=>i!==3);hoy.forEach((l,i)=>{const ts=tsAt(0,8,[1,4,0,6][i%4]);if(ts<=Date.now())RH.fich.push({lid:l.id,ts,tipo:'in',via:i%2?'QR':'PIN'})});
 RH.lic.push({id:RH.nid++,lid:RH.leg[2].id,tipo:'Vacaciones',desde:iso(addD(TODAY,20)),hasta:iso(addD(TODAY,31)),dias:10,est:'Pendiente',nota:'Receso de verano'});
 RH.lic.push({id:RH.nid++,lid:RH.leg[4].id,tipo:'Estudio',desde:iso(addD(TODAY,6)),hasta:iso(addD(TODAY,6)),dias:1,est:'Pendiente',nota:'Examen final'});
 RH.lic.push({id:RH.nid++,lid:RH.leg[1].id,tipo:'Vacaciones',desde:iso(addD(TODAY,-60)),hasta:iso(addD(TODAY,-49)),dias:8,est:'Aprobada',nota:''});
 [[0,'Matrícula CPCE','mat',200],[0,'Seguro de responsabilidad profesional','seg',45],[1,'Matrícula CPCE','mat',120],[2,'Contrato de trabajo firmado','doc',9999],[3,'Matrícula CNV (idóneo)','mat',24],[3,'Curso de actualización PLA/FT','cur',-5],[4,'Apto de salud laboral','sal',60]].forEach(([i,n,k,d])=>RH.docs.push({id:RH.nid++,lid:RH.leg[i].id,n,k,ve:d>=9999?'':iso(addD(TODAY,d))}));
 /* club */
 FACT.filter(f=>f.est==='Cobrada').forEach(f=>CB.mov.push({id:CB.nid++,cid:f.cid,ts:pd(f.em).getTime()+3600e3,pts:Math.floor(f.imp/CB.cfg.ptsPor),con:'Honorarios cobrados',tipo:'cobro'}));
 CL.forEach(c=>{const b=((c.id*37)%5)*120;if(b)CB.mov.push({id:CB.nid++,cid:c.id,ts:tsAt(-200,10),pts:b+80,con:'Puntos de bienvenida y antigüedad',tipo:'bono'})});
 CB.cup.push({id:CB.nid++,cod:'BIENVENIDA10',d:10,ve:iso(addD(TODAY,90)),max:50,usados:3,uno:true,por:[],on:true,nota:'Primer honorario de un cliente nuevo'},{id:CB.nid++,cod:'REFERIDO5',d:5,ve:iso(addD(TODAY,180)),max:0,usados:1,uno:false,por:[],on:true,nota:'Para quien llega recomendado'},{id:CB.nid++,cod:'PAGOANUAL12',d:12,ve:iso(addD(TODAY,45)),max:20,usados:0,uno:true,por:[],on:true,nota:'Abono anual por adelantado'});
 CB.pre.push({id:CB.nid++,n:'Consulta de inversiones sin cargo',pts:400,on:true},{id:CB.nid++,n:'Informe patrimonial personal',pts:900,on:true},{id:CB.nid++,n:'Un mes de abono bonificado (hasta $50.000)',pts:2000,on:true},{id:CB.nid++,n:'Reunión de planificación impositiva',pts:1200,on:true});
 const c1=CL[0],c2=CL[1];if(c1&&c2)CB.ref.push({id:CB.nid++,de:c1.id,nombre:'Ferretería El Tornillo S.A.',tel:'5493870001122',est:'Pendiente',ts:tsAt(-9,12)},{id:CB.nid++,de:c2.id,nombre:'Lucía Fernández',tel:'5493870003344',est:'Acreditado',ts:tsAt(-40,11)});
 if(c2)CB.mov.push({id:CB.nid++,cid:c2.id,ts:tsAt(-38,11),pts:300,con:'Referido acreditado: Lucía Fernández',tipo:'ref'});
}
function CCvac(i){return[14,14,14,14,10][i]||10}
function modReset(){CJ.turnos.length=0;CJ.nid=1;RH.leg.length=0;RH.fich.length=0;RH.lic.length=0;RH.docs.length=0;RH.nid=1;CB.mov.length=0;CB.cup.length=0;CB.pre.length=0;CB.ref.length=0;CB.nid=1;XINIT=false}

/* ---- caja: cálculos ---- */
const cjOpen=()=>CJ.turnos.find(t=>t.estado==='abierto');
const cjSgn=m=>m.tipo==='ing'?m.monto:-m.monto;
const cjEsp=t=>t.fondo+sum(t.mov.filter(m=>m.medio==='Efectivo').map(cjSgn));
const cjPorMedio=t=>{const o={};CJ.cfg.medios.forEach(m=>o[m]=0);t.mov.forEach(m=>{o[m.medio]=(o[m.medio]||0)+cjSgn(m)});return o};
const cjIng=t=>sum(t.mov.filter(m=>m.tipo==='ing').map(m=>m.monto)),cjEgr=t=>sum(t.mov.filter(m=>m.tipo==='egr').map(m=>m.monto));
const cjPayload=t=>JSON.stringify({id:t.id,abre:t.abre,fondo:t.fondo,mov:t.mov,c:[t.cierre.ts,t.cierre.contado,t.cierre.esperado]});
function cjPrevHash(t){const i=CJ.turnos.indexOf(t),j=i<0?CJ.turnos.length-1:i-1;for(let k=j;k>=0;k--)if(CJ.turnos[k].cierre)return CJ.turnos[k].cierre.hash;return'GENESIS'}
function cjSealZ(t,contado,ts){const prev=cjPrevHash(t),esp=cjEsp(t);t.cierre={ts,contado,esperado:esp,dif:contado-esp,prev};t.cierre.hash=sha256s(prev+'|'+cjPayload(t));t.estado='cerrado'}
function cjVerify(){let prev='GENESIS',bad=[];CJ.turnos.filter(t=>t.cierre).forEach(t=>{const ok=t.cierre.prev===prev&&t.cierre.hash===sha256s(prev+'|'+cjPayload(t));if(!ok)bad.push(t.id);prev=t.cierre.hash});return bad}

/* ---- club: cálculos compartidos con la caja ---- */
const cbPts=cid=>sum(CB.mov.filter(m=>m.cid===+cid).map(m=>m.pts));
const cbNivel=cid=>{const p=cbPts(cid);let n=CB.cfg.niveles[0];CB.cfg.niveles.forEach(x=>{if(p>=x.min)n=x});return n};
const cbSig=cid=>{const p=cbPts(cid);return CB.cfg.niveles.find(x=>x.min>p)||null};
const cbCup=code=>CB.cup.find(c=>c.cod===String(code||'').trim().toUpperCase());
function cupErr(c,cid){if(!c)return'Ese cupón no existe';if(!c.on)return'El cupón está desactivado';if(c.ve&&c.ve<TODAYISO)return'El cupón venció el '+fd(c.ve);if(c.max&&c.usados>=c.max)return'El cupón ya alcanzó su cantidad máxima de usos';if(c.uno&&(c.por||[]).includes(+cid))return'Este cliente ya usó el cupón';return''}

/* ---- cobro: simulación (un solo beneficio por cobro: gana el mayor) ---- */
function cbCalc(){
 const s=S.cb,fs=FACT.filter(f=>s.sel.includes(f.id)&&f.est!=='Cobrada'),base=sum(fs.map(f=>f.imp));
 const niv=s.cid?cbNivel(s.cid):null,dN=niv?niv.d:0,cu=cbCup(s.cup),err=s.cup?cupErr(cu,s.cid):'',dC=cu&&!err?cu.d:0;
 const d=Math.max(dN,dC),win=!d?'':(dC>dN?'cupón '+cu.cod:'nivel '+niv.n),desc=Math.round(base*d/100),sub=base-desc;
 const ef=s.medio==='Efectivo'&&!s.mixto?sub:(s.mixto?Math.min(Math.max(+s.ef||0,0),sub):0),resto=sub-ef,recargo=s.medio==='Crédito'?Math.round(resto*CJ.cfg.recCred/100):0;
 const total=sub+recargo,recibido=+s.rec||0,vuelto=ef>0&&recibido>0?recibido-ef:0;
 return{fs,base,niv,dN,cu,err,dC,d,win,desc,sub,ef,resto,recargo,total,recibido,vuelto};
}

/* ---- pantallas ---- */
V.caja=()=>{
 modEnsure();const t=S.tab.caja,ab=cjOpen(),pend=FACT.filter(f=>f.est!=='Cobrada').length;
 const tabs=tabsH('caja',[['turno','Turno de hoy'],['cobrar','Cobrar honorarios',pend||''],['arqueo','Arqueo y cortes'],['hist','Historial y sellos']]);
 let b='';
 if(t==='turno')b=cjTurno(ab);
 if(t==='cobrar')b=cjCobrar(ab);
 if(t==='arqueo')b=cjArqueo(ab);
 if(t==='hist')b=cjHist();
 return`<div class="ph"><div><h1>Caja y cobros</h1><p>Turno del día, cobro de honorarios con todos los medios de pago, arqueo y cierre con sello verificable.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">${ab?`<button class="btn pri" data-act="cajacobrar">Cobrar <kbd>F1</kbd></button>`:`<button class="btn pri" data-act="cjabrirm">Abrir la caja</button>`}</div></div>${tabs}${b}`;
};
function cjTurno(ab){
 if(!ab){const u=CJ.turnos.filter(t=>t.cierre).slice(-1)[0];
  return stepper([['Abrir la caja','Fondo inicial en efectivo',''],['Cobrar','Honorarios y otros ingresos','wait'],['Arqueo','Corte X cuando quieras','wait'],['Cerrar','Corte Z sellado','wait']])+
  `<div class="card" style="max-width:640px"><h3>La caja está cerrada</h3><p class="mut">Abrí el turno para empezar a cobrar. ${u?`El último turno cerró el ${fdh(u.cierre.ts)} con ${u.cierre.dif===0?'caja exacta':'una diferencia de '+ars(u.cierre.dif)}.`:'Todavía no hay turnos cerrados.'}</p>
  <form data-form="cjabrir"><div class="fr"><div><label>Responsable</label><select name="u">${USERS.map(x=>`<option>${esc(x.n)}</option>`).join('')}</select></div><div><label>Fondo inicial en efectivo</label><input type="number" name="f" min="0" value="${CJ.cfg.fondo}" required></div></div><p><button class="btn pri">Abrir turno</button></p></form></div>`;}
 const p=cjPorMedio(ab),meds=Object.keys(p).filter(k=>p[k]>0);
 const hecho=ab.cortes.length;
 if(meds.length)chartDonut('cjd',meds,meds.map(k=>p[k]));
 return stepper([['Caja abierta','desde '+hm(ab.abre)+' · '+esc(ab.user),'done'],['Cobrar',ab.mov.length+' movimientos',ab.mov.length?'done':'now'],['Arqueo',hecho?hecho+' corte(s) X':'Sin cortes todavía',hecho?'done':'now'],['Cerrar','Corte Z al terminar',''] ])+
 `<div class="grid g4" style="margin:14px 0">${kpi('Ingresos del turno',ars(cjIng(ab)),'','up')}${kpi('Egresos',ars(cjEgr(ab)),cjEgr(ab)?'retiros y gastos':'sin egresos')}${kpi('Efectivo esperado',ars(cjEsp(ab)),'fondo '+ars(ab.fondo))}${kpi('Movimientos',ab.mov.length,'en este turno')}</div>
 <div class="grid g21"><div class="card"><h3>Movimientos <span style="display:flex;gap:6px"><button class="btn sm" data-act="cjing">+ Ingreso</button><button class="btn sm" data-act="cjegr">− Retiro o gasto</button></span></h3>
 ${ab.mov.length?`<div class="tw" style="max-height:420px"><table><thead><tr><th>Hora</th><th>Concepto</th><th>Medio</th><th class="r">Importe</th></tr></thead><tbody>${ab.mov.slice().reverse().map(m=>`<tr><td>${hm(m.ts)}</td><td>${esc(m.con)}</td><td>${badge(esc(m.medio),m.medio==='Efectivo'?'warn':'info')}</td><td class="r ${m.tipo==='egr'?'dn':'up'}"><b>${m.tipo==='egr'?'− ':''}${ars(m.monto)}</b></td></tr>`).join('')}</tbody></table></div>`:`<p class="mut">Todavía no hay movimientos. Tocá <b>Cobrar</b> para registrar el primero.</p>`}</div>
 <div class="card"><h3>Por medio de pago</h3>${meds.length?`<canvas id="cjd" data-h="190"></canvas>`:''}<div class="list">${Object.keys(p).map(k=>`<div><div class="g"><span>${esc(k)}</span><b>${ars(p[k])}</b></div></div>`).join('')}</div></div></div>`;
}
function cjCobrar(ab){
 if(!ab)return`<div class="card" style="max-width:640px"><h3>Primero abrí la caja</h3><p class="mut">Los cobros quedan registrados en el turno, así el arqueo cierra exacto.</p><button class="btn pri" data-act="cjabrirm">Abrir la caja</button></div>`;
 const s=S.cb,ids=[...new Set(FACT.filter(f=>f.est!=='Cobrada').map(f=>f.cid))],fs=s.cid?FACT.filter(f=>f.cid===+s.cid&&f.est!=='Cobrada').sort((a,b)=>a.ve<b.ve?-1:1):[];
 const k=cbCalc(),niv=s.cid?cbNivel(s.cid):null;
 return`<div class="grid g21"><div>
 <div class="card"><h3>1 · Cliente y comprobantes</h3><div class="fr"><div style="grid-column:span 2"><label>Cliente con honorarios pendientes</label><select data-chg="cbcli"><option value="">Elegí un cliente…</option>${ids.map(id=>`<option value="${id}" ${+s.cid===id?'selected':''}>${esc(cl(id).n)}</option>`).join('')}</select></div></div>
 ${s.cid?`<div class="tw" style="margin-top:8px"><table><thead><tr><th></th><th>Concepto</th><th>Vence</th><th>Estado</th><th class="r">Importe</th></tr></thead><tbody>${fs.map(f=>`<tr><td><input type="checkbox" data-chg="cbsel" data-id="${f.id}" ${s.sel.includes(f.id)?'checked':''}></td><td>${esc(f.con)}</td><td>${fd(f.ve)}</td><td>${badge(estF(f),stBadge(estF(f)))}</td><td class="r">${ars(f.imp)}</td></tr>`).join('')}</tbody></table></div>`:`<p class="mut">${ids.length?'Elegí un cliente para ver sus comprobantes.':'No hay honorarios pendientes de cobro.'}</p>`}</div>
 ${s.cid?`<div class="card" style="margin-top:14px"><h3>2 · Beneficios <small class="mut">se aplica uno solo: el mayor</small></h3>
 <div class="benef"><div><small>Nivel del Club</small><b>${niv.ic} ${niv.n}</b><span class="mut">${niv.d?niv.d+'% de descuento':'sin descuento'}</span></div>
 <div><label>Cupón</label><input data-chg="cbcup" placeholder="Ej.: BIENVENIDA10" value="${esc(s.cup)}" style="text-transform:uppercase"></div></div>
 ${s.cup&&k.err?`<p class="dn" style="margin:8px 0 0">${esc(k.err)}</p>`:''}${k.d?`<p class="up" style="margin:8px 0 0">✔ Se aplica <b>${k.d}%</b> por ${esc(k.win)}${k.dN&&k.dC?' (compiten: gana el mayor)':''}.</p>`:''}</div>`:''}
 ${s.cid?`<div class="card" style="margin-top:14px"><h3>3 · Medio de pago</h3><div class="chips">${CJ.cfg.medios.map(m=>`<button type="button" class="chip2 ${s.medio===m?'on':''}" data-act="cbmedio" data-m="${esc(m)}">${esc(m)}</button>`).join('')}</div>
 <label class="chk" style="margin-top:10px"><input type="checkbox" data-chg="cbmix" ${s.mixto?'checked':''}> Pago mixto: una parte en efectivo y el resto con ${esc(s.medio==='Efectivo'?'otro medio':s.medio)}</label>
 ${s.mixto||s.medio==='Efectivo'?`<div class="fr" style="margin-top:8px">${s.mixto?`<div><label>Parte en efectivo</label><input type="number" min="0" value="${esc(s.ef)}" data-chg="cbef"></div>`:''}<div><label>Efectivo recibido</label><input type="number" min="0" id="cbRec" data-inp="cbrec" value="${esc(s.rec)}" placeholder="Para calcular el vuelto"></div><div><label>Vuelto</label><div class="vuelto" id="cbVuelto">${k.vuelto>0?ars(k.vuelto):k.vuelto<0&&k.recibido?'<span class="dn">falta '+ars(-k.vuelto)+'</span>':'—'}</div></div></div>`:''}
 ${s.medio==='Crédito'?`<p class="mut" style="margin:8px 0 0">El crédito suma un recargo del ${CJ.cfg.recCred}% (se cambia en Configuración → Caja).</p>`:''}</div>`:''}
 </div>
 <div><div class="card cbres"><h3>Resumen del cobro</h3>
 <div class="stat"><span>Subtotal (${k.fs.length} comprobante${k.fs.length===1?'':'s'})</span><b>${ars(k.base)}</b></div>
 <div class="stat"><span>Descuento ${k.d?'('+k.d+'% · '+esc(k.win)+')':''}</span><b class="${k.desc?'up':''}">${k.desc?'− '+ars(k.desc):ars(0)}</b></div>
 ${k.recargo?`<div class="stat"><span>Recargo crédito (${CJ.cfg.recCred}%)</span><b>${ars(k.recargo)}</b></div>`:''}
 <div class="tot"><span>Total a cobrar</span><b>${ars(k.total)}</b></div>
 ${k.fs.length?`<p class="mut" style="margin:6px 0 0">Suma ${Math.floor(k.sub/CB.cfg.ptsPor)} punto${Math.floor(k.sub/CB.cfg.ptsPor)===1?'':'s'} al Club.</p>`:''}
 <button class="btn pri big" data-act="cbcobrar" ${k.fs.length?'':'disabled'}>Cobrar ${k.fs.length?ars(k.total):''} <kbd>F12</kbd></button></div></div></div>`;
}
function cjArqueo(ab){
 if(!ab)return`<div class="card" style="max-width:640px"><h3>No hay un turno abierto</h3><p class="mut">El arqueo se hace sobre el turno en curso. Los turnos anteriores están en <b>Historial y sellos</b>.</p><button class="btn pri" data-act="cjabrirm">Abrir la caja</button></div>`;
 const p=cjPorMedio(ab);
 return`<div class="grid g2"><div class="card"><h3>Lo que debería haber</h3><div class="stat"><span>Fondo inicial (efectivo)</span><b>${ars(ab.fondo)}</b></div>${Object.keys(p).map(k=>`<div class="stat"><span>${esc(k)}</span><b>${ars(p[k])}</b></div>`).join('')}<div class="tot"><span>Efectivo esperado en caja</span><b>${ars(cjEsp(ab))}</b></div><p class="disc">El Corte X es un parcial: no cierra el turno. El Corte Z cierra el turno, lo sella y ya no se puede modificar.</p></div>
 <div class="card"><h3>Contá el efectivo</h3><form data-form="cjcorte"><label>Efectivo contado en caja</label><input type="number" name="c" min="0" required placeholder="${cjEsp(ab)}" id="cjContado" data-inp="cjdif"><div class="vuelto" id="cjDif" style="margin:8px 0">Ingresá lo contado para ver la diferencia</div><label>Observaciones</label><input name="o" placeholder="Opcional"><p style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn" name="k" value="X">Corte X · parcial</button><button class="btn pri" name="k" value="Z">Corte Z · cerrar el turno</button></p></form></div></div>
 ${ab.cortes.length?`<div class="card" style="margin-top:14px"><h3>Cortes X de este turno</h3><div class="tw"><table><thead><tr><th>Hora</th><th class="r">Esperado</th><th class="r">Contado</th><th class="r">Diferencia</th><th>Observación</th></tr></thead><tbody>${ab.cortes.map(c=>`<tr><td>${hm(c.ts)}</td><td class="r">${ars(c.esp)}</td><td class="r">${ars(c.cont)}</td><td class="r ${c.cont-c.esp?'dn':'up'}">${ars(c.cont-c.esp)}</td><td>${esc(c.o||'')}</td></tr>`).join('')}</tbody></table></div></div>`:''}`;
}
function cjHist(){
 const ts=CJ.turnos.filter(t=>t.cierre).slice().reverse();
 return`<div class="card"><h3>Turnos cerrados <span><button class="btn sm" data-act="cjverif">🔐 Verificar todos los sellos</button></span></h3>${ts.length?`<div class="tw"><table><thead><tr><th>N°</th><th>Apertura</th><th>Cierre</th><th class="r">Ingresos</th><th class="r">Esperado</th><th class="r">Contado</th><th class="r">Dif.</th><th>Sello SHA-256</th></tr></thead><tbody>${ts.map(t=>`<tr><td>#${t.id}</td><td>${fdh(t.abre)}</td><td>${fdh(t.cierre.ts)}</td><td class="r">${ars(cjIng(t))}</td><td class="r">${ars(t.cierre.esperado)}</td><td class="r">${ars(t.cierre.contado)}</td><td class="r ${t.cierre.dif?'dn':'up'}">${ars(t.cierre.dif)}</td><td><code title="${t.cierre.hash}">${t.cierre.hash.slice(0,14)}…</code> <button class="btn sm" data-act="cjdet" data-id="${t.id}">Ver</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="mut">Todavía no hay turnos cerrados.</p>'}<p class="disc">Cada sello se calcula con el contenido del turno y el sello del turno anterior: si alguien cambia un movimiento viejo, la verificación lo detecta.</p></div>`;
}

/* ---- acciones de la caja ---- */
Object.assign(ACT,{
 cajacobrar(){if(!cjOpen()){S.tab.caja='turno';go('caja');return toast('Primero abrí la caja')}S.tab.caja='cobrar';go('caja')},
 cjabrirm(){S.tab.caja='turno';go('caja')},
 cbmedio(d){S.cb.medio=d.m;if(d.m!=='Efectivo')S.cb.rec='';render()},
 cbcobrar(){
  const ab=cjOpen();if(!ab)return toast('Primero abrí la caja');const k=cbCalc();if(!k.fs.length)return toast('Elegí al menos un comprobante');
  if(k.ef>0&&k.recibido&&k.recibido<k.ef)return toast('El efectivo recibido no alcanza');
  const c=cl(S.cb.cid),ts=Date.now(),con='Honorarios · '+c.n+(k.fs.length>1?' ('+k.fs.length+' comp.)':'');
  k.fs.forEach(f=>{const sh=k.base?Math.round(k.desc*f.imp/k.base):0;f.est='Cobrada';f.cobro={ts,medio:S.cb.medio+(S.cb.mixto?' + Efectivo':''),desc:sh,cobrado:f.imp-sh,cup:k.dC>k.dN&&k.cu?k.cu.cod:''}});
  if(k.ef>0)ab.mov.push({ts,tipo:'ing',medio:'Efectivo',monto:k.ef,con,cid:c.id});
  if(k.resto>0)ab.mov.push({ts,tipo:'ing',medio:S.cb.medio,monto:k.resto+k.recargo,con:con+(k.recargo?' (con recargo)':''),cid:c.id});
  const pts=Math.floor(k.sub/CB.cfg.ptsPor);if(pts>0)CB.mov.push({id:CB.nid++,cid:c.id,ts,pts,con:'Cobro de honorarios',tipo:'cobro'});
  if(k.cu&&k.dC>k.dN){k.cu.usados++;k.cu.por=(k.cu.por||[]).concat(c.id)}
  logA('Cobro registrado: '+c.n+' · '+ars(k.total)+' · '+S.cb.medio);
  const vuelto=k.vuelto>0?k.vuelto:0,txt='Hola '+c.n+', registramos tu pago de '+ars(k.total)+' al Estudio contable VB. ¡Gracias!';
  S.cb={cid:'',sel:[],cup:'',medio:'Efectivo',mixto:false,ef:'',rec:''};save();render();
  modal('Cobro registrado ✔',`<div class="card" style="box-shadow:none"><div class="stat"><span>Cliente</span><b>${esc(c.n)}</b></div><div class="stat"><span>Subtotal</span><b>${ars(k.base)}</b></div>${k.desc?`<div class="stat"><span>Descuento (${esc(k.win)})</span><b class="up">− ${ars(k.desc)}</b></div>`:''}${k.recargo?`<div class="stat"><span>Recargo crédito</span><b>${ars(k.recargo)}</b></div>`:''}<div class="tot"><span>Total cobrado</span><b>${ars(k.total)}</b></div>${vuelto?`<div class="stat"><span>Vuelto a entregar</span><b>${ars(vuelto)}</b></div>`:''}${pts?`<p class="up" style="margin:8px 0 0">+${pts} puntos en el Club</p>`:''}</div><p style="display:flex;gap:8px;margin-top:12px"><a class="btn wa" target="_blank" rel="noopener" href="${waLink(c.tel||STEL,txt)}">💬 Enviar comprobante por WhatsApp</a><button class="btn" data-act="close">Cerrar</button></p><p class="disc">Comprobante interno de demostración, sin validez fiscal.</p>`);
 },
 cjing(){modal('Otro ingreso',`<form data-form="cjmov" data-t="ing"><div class="fr"><div style="grid-column:span 2"><label>Concepto</label><input name="c" required placeholder="Ej.: consulta puntual"></div><div><label>Importe</label><input type="number" name="m" min="1" required></div><div><label>Medio</label><select name="md">${CJ.cfg.medios.map(m=>`<option>${esc(m)}</option>`).join('')}</select></div></div><p><button class="btn pri">Registrar ingreso</button></p></form>`)},
 cjegr(){modal('Retiro o gasto de caja',`<form data-form="cjmov" data-t="egr"><div class="fr"><div style="grid-column:span 2"><label>Concepto</label><input name="c" required placeholder="Ej.: librería, cadetería, café"></div><div><label>Importe</label><input type="number" name="m" min="1" required></div></div><p class="disc">Sale del efectivo de la caja.</p><p><button class="btn pri">Registrar egreso</button></p></form>`)},
 cjverif(){const bad=cjVerify();toast(bad.length?'⚠ Se detectaron cambios en el turno #'+bad.join(', #'):'✔ Todos los sellos son válidos ('+CJ.turnos.filter(t=>t.cierre).length+' turnos)')},
 cjdet(d){const t=CJ.turnos.find(x=>x.id===+d.id);if(!t)return;const ok=!cjVerify().includes(t.id);
  modal('Turno #'+t.id+' · '+fdh(t.abre),`<div class="grid g3">${kpi('Ingresos',ars(cjIng(t)),'','up')}${kpi('Egresos',ars(cjEgr(t)))}${kpi('Diferencia',ars(t.cierre.dif),t.cierre.dif?'revisar':'caja exacta',t.cierre.dif?'dn':'up')}</div><div class="tw" style="margin-top:12px;max-height:260px"><table><thead><tr><th>Hora</th><th>Concepto</th><th>Medio</th><th class="r">Importe</th></tr></thead><tbody>${t.mov.map(m=>`<tr><td>${hm(m.ts)}</td><td>${esc(m.con)}</td><td>${esc(m.medio)}</td><td class="r">${m.tipo==='egr'?'− ':''}${ars(m.monto)}</td></tr>`).join('')}</tbody></table></div><p class="disc"><b>Sello:</b> <code>${t.cierre.hash}</code><br><b>Sello anterior:</b> <code>${t.cierre.prev}</code><br>${ok?'<span class="up">✔ Verificado: el contenido no cambió.</span>':'<span class="dn">⚠ El contenido no coincide con el sello.</span>'}</p>`)}
});
Object.assign(CHG,{
 cbcli(v){S.cb={cid:v,sel:v?FACT.filter(f=>f.cid===+v&&f.est!=='Cobrada').sort((a,b)=>a.ve<b.ve?-1:1).slice(0,1).map(f=>f.id):[],cup:'',medio:'Efectivo',mixto:false,ef:'',rec:''};render()},
 cbsel(v,el){const id=+el.dataset.id,i=S.cb.sel.indexOf(id);if(el.checked&&i<0)S.cb.sel.push(id);if(!el.checked&&i>=0)S.cb.sel.splice(i,1);render()},
 cbcup(v){S.cb.cup=String(v||'').trim().toUpperCase();render()},
 cbmix(v,el){S.cb.mixto=el.checked;if(el.checked&&S.cb.medio==='Efectivo')S.cb.medio='Transferencia';render()},
 cbef(v){S.cb.ef=v;render()}
});
Object.assign(INP,{
 cbrec(v){S.cb.rec=v;const k=cbCalc(),e=$('#cbVuelto');if(e)e.innerHTML=k.vuelto>0?ars(k.vuelto):k.vuelto<0&&k.recibido?'<span class="dn">falta '+ars(-k.vuelto)+'</span>':'—'},
 cjdif(v){const ab=cjOpen(),e=$('#cjDif');if(!ab||!e)return;if(v===''){e.textContent='Ingresá lo contado para ver la diferencia';e.className='vuelto';return}const dif=+v-cjEsp(ab);e.innerHTML=dif===0?'<span class="up">✔ Caja exacta</span>':dif>0?'<span class="warn-t">Sobran '+ars(dif)+'</span>':'<span class="dn">Faltan '+ars(-dif)+'</span>'}
});
Object.assign(FRM,{
 cjabrir(f){if(cjOpen())return toast('Ya hay un turno abierto');CJ.turnos.push({id:CJ.nid++,abre:Date.now(),user:f.get('u'),fondo:Math.max(0,+f.get('f')||0),mov:[],estado:'abierto',cortes:[]});logA('Caja abierta · fondo '+ars(+f.get('f')));toast('Caja abierta ✔');save();render()},
 cjmov(f,form){const ab=cjOpen();if(!ab)return;const t=form.dataset.t,m=+f.get('m');if(!(m>0))return;const md=t==='egr'?'Efectivo':f.get('md');if(t==='egr'&&m>cjEsp(ab)){return toast('No hay tanto efectivo en la caja ('+ars(cjEsp(ab))+')')}ab.mov.push({ts:Date.now(),tipo:t,medio:md,monto:m,con:f.get('c')});logA((t==='egr'?'Egreso':'Ingreso')+' de caja: '+f.get('c')+' · '+ars(m));closeModal();toast('Registrado ✔');save();render()},
 cjcorte(f,form){const ab=cjOpen();if(!ab)return;const c=+f.get('c');if(isNaN(c)||f.get('c')==='')return toast('Ingresá el efectivo contado');
  const esp=cjEsp(ab);
  if(window._cjk==='Z'){cjSealZ(ab,c,Date.now());logA('Corte Z · turno #'+ab.id+' · diferencia '+ars(c-esp));window._cjk='';S.tab.caja='hist';save(true);toast('Turno cerrado y sellado ✔');render();return}
  ab.cortes.push({ts:Date.now(),esp,cont:c,o:f.get('o')});logA('Corte X · diferencia '+ars(c-esp));window._cjk='';save();toast('Corte X registrado');render()}
});
document.addEventListener('click',e=>{const b=e.target.closest('form[data-form="cjcorte"] button[name=k]');if(b)window._cjk=b.value},true);
