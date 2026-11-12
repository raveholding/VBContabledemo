/* ===== V28 · C · NAVEGACIÓN, CONFIGURACIÓN DINÁMICA, PALETA Ctrl+K, ACCESO OCULTO ===== */
AREAS.push(['caja','Caja y cobros'],['equipo','Equipo y RR HH'],['club','Club de clientes']);
SECDEF2.push('caja','club');VAREA.caja='caja';VAREA.equipo='equipo';VAREA.club='club';permDefaults();
function modPermFix(){AREAS.forEach(a=>{if(!(a[0] in PERM.sec))PERM.sec[a[0]]=SECDEF2.includes(a[0])})}
function modRestore(x){if(x.CJ)Object.assign(CJ,x.CJ);if(x.RH)Object.assign(RH,x.RH);if(x.CB)Object.assign(CB,x.CB);XINIT=!!x.XI}
{const i=NAVC.findIndex(n=>n[0]==='hon');NAVC.splice(i<0?NAVC.length:i+1,0,['caja','Caja y cobros','🧰'],['equipo','Equipo y RR HH','🧑‍💼'],['club','Club de clientes','🎁'])}
const cfgNorm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');

/* ---------- barra lateral: grupos plegables ---------- */
function navGroups(){
 const nav=$('#nav');if(!nav)return;let col={};try{col=JSON.parse(localStorage.getItem('svb.ng')||'{}')}catch(e){}
 const kids=[...nav.children],frag=document.createDocumentFragment();let cur=null;
 kids.forEach(k=>{if(k.classList.contains('grp')){cur=document.createElement('div');cur.className='ng';cur.dataset.g=k.textContent.trim();k.setAttribute('role','button');k.tabIndex=0;k.insertAdjacentHTML('beforeend','<i class="ng-chev">›</i>');cur.appendChild(k);frag.appendChild(cur)}else if(cur)cur.appendChild(k);else frag.appendChild(k)});
 nav.innerHTML='';nav.appendChild(frag);
 $$('#nav .ng').forEach(g=>{g.classList.toggle('col',!!col[g.dataset.g]&&!g.querySelector('a.on'))});
 const b=$('#btnCobrar');if(b)b.hidden=!(S.role&&can('caja'));
}
{const _bn=buildNav;buildNav=function(){_bn();try{navGroups()}catch(e){console.warn('nav',e)}}}
document.addEventListener('click',e=>{const g=e.target.closest('#nav .ng>.grp');if(!g)return;const w=g.parentElement;w.classList.toggle('col');let col={};try{col=JSON.parse(localStorage.getItem('svb.ng')||'{}')}catch(x){}col[w.dataset.g]=w.classList.contains('col')?1:0;try{localStorage.setItem('svb.ng',JSON.stringify(col))}catch(x){}});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('#nav .grp')){e.preventDefault();e.target.click()}});
$('#modeChip').insertAdjacentHTML('beforebegin','<button class="btn pri sm" id="btnCobrar" data-act="cajacobrar" title="Cobrar honorarios (F1)" hidden>Cobrar <kbd>F1</kbd></button><button class="ib" data-act="paleta" title="Buscar pantallas, clientes y acciones (Ctrl + K)">⌕</button>');

/* ---------- paleta de búsqueda Ctrl + K (tolera errores de tipeo) ---------- */
const lev1=(a,b)=>{if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,e=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue}if(++e>1)return false;if(a.length>b.length)i++;else if(a.length<b.length)j++;else{i++;j++}}return e+(a.length-i)+(b.length-j)<=1};
function palScore(q,t){const nq=cfgNorm(q).trim(),nt=cfgNorm(t);if(!nq)return 1;const ws=nq.split(/\s+/);if(ws.every(w=>nt.includes(w)))return nt.startsWith(nq)?4:3;const tw=nt.split(/[^a-z0-9]+/);if(ws.every(w=>nt.includes(w)||(w.length>=4&&tw.some(x=>lev1(w,x)))))return 2;let i=0;for(const ch of nq.replace(/\s/g,'')){i=nt.indexOf(ch,i);if(i<0)return 0;i++}return 1}
const PLT={q:'',i:0,items:[]};
function palList(q){
 const all=[];const add=(t,s,ic,fn)=>all.push({t,s,ic,fn});
 add('Cobrar honorarios','Acción · F1','💵',()=>ACT.cajacobrar());add('Abrir o ver la caja','Acción','🧰',()=>{S.tab.caja='turno';go('caja')});add('Fichar ingreso o egreso','Acción','🕘',()=>{S.tab.equipo='fichaje';go('equipo')});add('Cambiar tema claro u oscuro','Acción','◐',()=>ACT.theme());add('Ver el sitio público','Acción','🌐',()=>ACT.openpub());
 if(can('hon'))add('Nueva factura de honorarios','Acción','🧾',()=>{go('hon');setTimeout(()=>ACT.newfact&&ACT.newfact({}),50)});
 NAVC.forEach(n=>{if(n.length>1&&can(n[0]))add(n[1],'Pantalla',String(n[2]).startsWith('dot:')?'•':n[2],()=>go(n[0]))});
 if(can('cartera'))CL.forEach(c=>add(c.n,'Cliente · '+c.cuit,'👤',()=>goC(c.id,'resumen')));
 const r=all.map(x=>({x,s:palScore(q,x.t+' '+x.s)})).filter(r=>r.s>0);r.sort((a,b)=>b.s-a.s);return r.slice(0,9).map(r=>r.x);
}
function palDraw(){PLT.items=palList(PLT.q);if(PLT.i>=PLT.items.length)PLT.i=0;const e=$('#palr');if(e)e.innerHTML=PLT.items.map((x,i)=>`<button type="button" class="pit ${i===PLT.i?'on':''}" data-act="palgo" data-i="${i}"><span class="pic">${x.ic}</span><span><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span></button>`).join('')||'<p class="mut" style="padding:14px">Sin resultados. Probá con otra palabra.</p>'}
Object.assign(ACT,{
 paleta(){if(!S.role)return;if(!$('#pal'))document.body.insertAdjacentHTML('beforeend','<div id="pal" class="pal" hidden><div class="pbox"><input id="palq" data-inp="palq" placeholder="Buscar pantallas, clientes y acciones…" autocomplete="off"><div id="palr"></div><div class="phint">↑ ↓ moverse · Enter abrir · Esc cerrar</div></div></div>');PLT.q='';PLT.i=0;$('#pal').hidden=false;$('#palq').value='';palDraw();setTimeout(()=>$('#palq').focus(),0)},
 palgo(d){const x=PLT.items[+d.i];palClose();if(x)x.fn()}
});
function palClose(){const p=$('#pal');if(p)p.hidden=true}
Object.assign(INP,{palq(v){PLT.q=v;PLT.i=0;palDraw()}});
document.addEventListener('mousedown',e=>{if(e.target.id==='pal')palClose()});
document.addEventListener('keydown',e=>{
 const open=$('#pal')&&!$('#pal').hidden;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open?palClose():ACT.paleta();return}
 if(open){if(e.key==='Escape'){palClose()}else if(e.key==='ArrowDown'){e.preventDefault();PLT.i=Math.min(PLT.items.length-1,PLT.i+1);palDraw()}else if(e.key==='ArrowUp'){e.preventDefault();PLT.i=Math.max(0,PLT.i-1);palDraw()}else if(e.key==='Enter'){e.preventDefault();ACT.palgo({i:PLT.i})}return}
 if(e.key==='F1'&&S.role&&can('caja')){e.preventDefault();ACT.cajacobrar();return}
 if(e.key==='F12'&&S.role&&S.view==='caja'&&S.tab.caja==='cobrar'&&!$('#modal.on')){e.preventDefault();ACT.cbcobrar();return}
 if(e.key==='/'&&S.view==='config'&&!/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||'')){const q=$('#cfg-q');if(q){e.preventDefault();q.focus()}}
});

/* ---------- acceso oculto al panel desde el sitio público ---------- */
let _tp=[];
document.addEventListener('click',e=>{if(!e.target.closest('.ptop .logo,.ptop b'))return;const n=Date.now();_tp=_tp.filter(x=>n-x<3000);_tp.push(n);const d=_tp.length>1&&n-_tp[_tp.length-2]<450;if(d||_tp.length>=5){_tp=[];ACT.secret()}},true);
Object.assign(ACT,{secret(){if(S.role){ACT.closepub();return}history.replaceState(null,'',location.pathname+'#acceso');document.body.classList.remove('pub');showLogin()}});

/* ---------- configuración dinámica ---------- */
const CFGS=[
 {k:'estudio',t:'Estudio',d:'Nombre, logo, color, equipo y sitio público',ic:'🏢',tab:'estudio'},
 {k:'caja',t:'Caja y cobros',d:'Fondo inicial, medios de pago y recargos',ic:'💵'},
 {k:'rrhh',t:'Equipo y RR HH',d:'Jornada, tolerancia y fichaje',ic:'🧑‍💼'},
 {k:'club',t:'Club de clientes',d:'Puntos, niveles, cupones y premios',ic:'🎁'},
 {k:'mods',t:'Módulos',d:'Qué funciones usa el estudio',ic:'🧩',tab:'mods'},
 {k:'usuarios',t:'Usuarios y permisos',d:'Quién entra y qué puede hacer',ic:'🔑',tab:'usuarios'},
 {k:'arca',t:'ARCA y sincronización',d:'Conexión con ARCA, frecuencia y parámetros',ic:'🏛️',tab:'sync'},
 {k:'alertas',t:'Alertas',d:'Avisos automáticos a clientes',ic:'🔔',tab:'alertas'},
 {k:'datos',t:'Datos y copias',d:'Modo de datos, copias de seguridad y restauración',ic:'💾',tab:'datos'}];
const CFGMAP={estudio:'estudio',mods:'mods',datos:'datos',usuarios:'usuarios',sync:'arca',alertas:'alertas'};
let CFGU={sec:'estudio',q:'',open:{},dirty:{}};
const _cfg0=V.config;
function cfgSlug(s){return cfgNorm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)}
function cfgCards(tab,sec){
 const keep=S.cfgTab;S.cfgTab=tab;let h;try{h=_cfg0()}finally{S.cfgTab=keep}
 const doc=new DOMParser().parseFromString('<body>'+h+'</body>','text/html');doc.querySelectorAll('.ph,.tabs').forEach(n=>n.remove());
 return[...doc.body.querySelectorAll('.card')].filter(c=>!c.parentElement.closest('.card')).map(c=>{
  const hd=c.querySelector('h2,h3');let t='Ajustes';
  if(hd){const k=hd.cloneNode(true);k.querySelectorAll('button,a,small,span').forEach(x=>x.remove());t=k.textContent.trim()||hd.textContent.trim();
   if(hd.querySelector('button,a')){[...hd.childNodes].forEach(n=>{if(n.nodeType===3)n.remove()});hd.className='cfg-actions'}else hd.remove()}
  return cfgCard(sec,t,c.innerHTML,c)})}
function cfgCard(sec,t,html,node){
 const id=sec+'-'+cfgSlug(t),box=document.createElement('div');box.innerHTML=html;
 const p=box.querySelector('p.mut,p.disc,.mut'),help=p?p.textContent.trim().replace(/\s+/g,' '):'';
 const ins=[...box.querySelectorAll('input,select,textarea')].filter(i=>i.type!=='hidden'),chk=ins.filter(i=>i.type==='checkbox'),bits=[];
 if(ins.length)bits.push(ins.length+' campo'+(ins.length>1?'s':''));if(chk.length)bits.push(chk.filter(i=>i.checked).length+' de '+chk.length+' activas');
 const sum=(help?help.slice(0,100)+(help.length>100?'…':''):'')+(bits.length?(help?' · ':'')+bits.join(' · '):'');
 return{id,sec,t,sum,html:node?node.innerHTML:html,ins:ins.length}}
function cfgExtra(sec){
 const med=['Efectivo','Transferencia','Mercado Pago','Débito','Crédito'];
 if(sec==='caja')return[cfgCard('caja','Caja y medios de pago',`<p class="mut">Cómo se abre la caja y qué recargos se aplican al cobrar honorarios.</p><form data-form="cfgcaja"><div class="fr"><div><label>Fondo inicial sugerido</label><input type="number" name="f" min="0" value="${CJ.cfg.fondo}"></div><div><label>Recargo por crédito (%)</label><input type="number" name="r" min="0" max="30" step="0.5" value="${CJ.cfg.recCred}"></div></div><label style="margin-top:8px">Medios de pago habilitados</label><div class="chips">${med.map(m=>`<label class="chk"><input type="checkbox" name="m_${m}" ${CJ.cfg.medios.includes(m)?'checked':''} ${m==='Efectivo'?'disabled':''}> ${m}</label>`).join('')}</div><p><button class="btn pri">Guardar caja</button> <button type="button" class="btn" data-act="cajacobrar">Ir a cobrar</button></p></form>`)];
 if(sec==='rrhh')return[cfgCard('rrhh','Jornada y fichaje',`<p class="mut">Horario del equipo del estudio, tolerancia de ingreso y vacaciones.</p><form data-form="cfgrrhh"><div class="fr"><div><label>Entrada esperada</label><input type="time" name="i" value="${RH.cfg.inicio}"></div><div><label>Tolerancia (minutos)</label><input type="number" name="t" min="0" max="60" value="${RH.cfg.tol}"></div><div><label>Vacaciones base (días)</label><input type="number" name="v" min="0" max="40" value="${RH.cfg.vacBase}"></div></div><div class="fr"><div><label>Método de fichaje</label><select name="m">${['PIN','QR del celular','Geocerca'].map(x=>`<option ${RH.cfg.metodo===x?'selected':''}>${x}</option>`).join('')}</select></div></div><p><button class="btn pri">Guardar</button> <button type="button" class="btn" data-act="go" data-v="equipo">Abrir Equipo y RR HH</button></p></form>`)];
 if(sec==='club')return[cfgCard('club','Reglas del Club',`<p class="mut">Cuántos puntos se suman y dónde se editan niveles, cupones y premios.</p><form data-form="cfgclub"><div class="fr"><div><label>Un punto cada (pesos cobrados)</label><input type="number" name="p" min="1" value="${CB.cfg.ptsPor}"></div></div><p><button class="btn pri">Guardar</button> <button type="button" class="btn" data-act="clubtab" data-t="niveles">Editar niveles</button> <button type="button" class="btn" data-act="clubtab" data-t="cup">Cupones y premios</button></p></form>`)];
 if(sec==='estudio')return[cfgCard('estudio','Sitio público y acceso al panel',`<p class="mut">El sitio público es lo que ven tus clientes. Para entrar al panel desde ahí, hacé <b>doble clic (doble toque en el celular) sobre el logo</b>; no hay botón a la vista.</p><p><button type="button" class="btn" data-act="openpub">Ver el sitio público</button> <button type="button" class="btn" data-act="go" data-v="sitio">Editar servicios publicados</button></p>`)];
 if(sec==='arca')return[cfgCard('arca','Conexión con ARCA',`<p class="mut">Facturación y datos de ARCA con la llave propia del estudio (sv.arca.sdk). La conexión transitoria con Afip SDK se retira cuando la llave propia esté completa.</p><p><button type="button" class="btn pri" data-act="arccfg">Conectar ARCA propio</button> <button type="button" class="btn" data-act="afsCfg">Conexión transitoria (Afip SDK)</button></p>`)];
 return[];
}
V.config=()=>{
 modEnsure();
 if(S.cfgTab){CFGU.sec=CFGMAP[S.cfgTab]||CFGU.sec;S.cfgTab=''}
 CFGU.dirty={};
 const secs=CFGS.map(s=>Object.assign({},s,{cards:(s.tab?cfgCards(s.tab,s.k):[]).concat(cfgExtra(s.k))})).filter(s=>s.cards.length);
 if(!secs.some(s=>s.k===CFGU.sec))CFGU.sec=secs[0].k;
 secs.forEach(s=>{const f=s.cards.find(c=>c.ins)||s.cards[0];if(f&&CFGU.open[f.id]===undefined)CFGU.open[f.id]=true});
 return`<div class="ph"><div><h1>Configuración</h1><p>Todo lo que se puede cambiar, ordenado por tema. Buscá por palabra o elegí una sección.</p></div></div>
 <div class="cfg-top"><div class="cfg-search"><span aria-hidden="true">🔍</span><input id="cfg-q" data-inp="cfgq" type="search" placeholder="¿Qué querés cambiar? Ej.: logo, recargo, tolerancia, usuarios…" autocomplete="off" value="${esc(CFGU.q)}"><kbd>/</kbd></div></div>
 <div class="cfg-grid"><nav class="cfg-nav" aria-label="Secciones">${secs.map(s=>`<button type="button" class="cfg-sec" data-act="cfgsec" data-k="${s.k}"><span class="cfg-sic">${s.ic}</span><span><b>${esc(s.t)}</b><small>${esc(s.d)}</small></span><span class="cfg-n" data-n="${s.k}">${s.cards.length}</span></button>`).join('')}</nav>
 <section class="cfg-main"><div class="cfg-mhead"><div><h2 id="cfg-st"></h2><p class="mut" id="cfg-sd"></p></div><div class="row"><button type="button" class="btn sm" data-act="cfgall" data-v="1">Abrir todo</button> <button type="button" class="btn sm" data-act="cfgall" data-v="0">Cerrar todo</button></div></div>
 ${secs.map(s=>s.cards.map(c=>`<div class="cfg-card" data-cfgsec="${s.k}" data-cfgid="${c.id}" data-cfgt="${esc(c.t)}"><button type="button" class="cfg-head" data-act="cfgtog" data-id="${c.id}" aria-expanded="false"><span class="cfg-ht"><b>${esc(c.t)}</b><small>${esc(c.sum)}</small></span><span class="cfg-dirty" hidden>Sin guardar</span><span class="cfg-chev" aria-hidden="true">›</span></button><div class="cfg-body">${c.html}</div></div>`).join('')).join('')}
 <p class="cfg-empty mut" hidden>No hay ajustes con ese texto. Probá con otra palabra.</p></section></div>`;
};
function cfgPaint(){
 const v=$('#view');if(!v||!v.querySelector('.cfg-main'))return;const q=cfgNorm(CFGU.q).trim();let shown=0;
 $$('.cfg-card',v).forEach(c=>{const id=c.dataset.cfgid;let vis;
  if(q){const txt=cfgNorm(c.dataset.cfgt+' '+c.textContent+' '+[...c.querySelectorAll('input,textarea')].map(x=>x.placeholder||'').join(' '));vis=q.split(/\s+/).every(w=>txt.includes(w))}else vis=c.dataset.cfgsec===CFGU.sec;
  c.hidden=!vis;if(vis)shown++;const open=q?vis:!!CFGU.open[id];c.classList.toggle('open',open);const hd=c.querySelector('.cfg-head');if(hd)hd.setAttribute('aria-expanded',String(open));
  const dirty=!!CFGU.dirty[id];c.classList.toggle('dirty',dirty);const dd=c.querySelector('.cfg-dirty');if(dd)dd.hidden=!dirty;
  c.querySelectorAll('.cfg-hit').forEach(x=>x.classList.remove('cfg-hit'));if(q&&vis)c.querySelectorAll('label').forEach(l=>{if(q.split(/\s+/).every(w=>cfgNorm(l.textContent).includes(w)))l.classList.add('cfg-hit')})});
 $$('.cfg-sec',v).forEach(b=>{const k=b.dataset.k,on=!q&&k===CFGU.sec;b.classList.toggle('on',on);const dn=$$('.cfg-card',v).filter(c=>c.dataset.cfgsec===k&&CFGU.dirty[c.dataset.cfgid]).length,n=b.querySelector('.cfg-n');n.textContent=dn?dn+' sin guardar':$$('.cfg-card',v).filter(c=>c.dataset.cfgsec===k).length;n.classList.toggle('warn',!!dn)});
 const s=CFGS.find(x=>x.k===CFGU.sec),st=$('#cfg-st'),sd=$('#cfg-sd');if(st)st.textContent=q?'Resultados para «'+CFGU.q.trim()+'»':s.t;if(sd)sd.textContent=q?shown+' ajuste'+(shown===1?'':'s')+' encontrado'+(shown===1?'':'s'):s.d;
 const em=$('.cfg-empty',v);if(em)em.hidden=!!shown}
Object.assign(ACT,{
 cfgsec(d){CFGU.sec=d.k;CFGU.q='';const q=$('#cfg-q');if(q)q.value='';cfgPaint()},
 cfgtog(d){CFGU.open[d.id]=!CFGU.open[d.id];cfgPaint()},
 cfgall(d){$$('.cfg-card').forEach(c=>{if(!c.hidden)CFGU.open[c.dataset.cfgid]=d.v==='1'});cfgPaint()},
 clubtab(d){S.tab.club=d.t;go('club')}
});
Object.assign(INP,{cfgq(v){CFGU.q=v;cfgPaint()}});
['input','change'].forEach(ev=>document.addEventListener(ev,e=>{const c=e.target.closest&&e.target.closest('.cfg-card');if(c&&e.target.id!=='cfg-q'){CFGU.dirty[c.dataset.cfgid]=1;cfgPaint()}}));
window.addEventListener('beforeunload',e=>{if(S.view==='config'&&Object.keys(CFGU.dirty).length){e.preventDefault();e.returnValue=''}});
{const _r=render;render=function(){_r.apply(this,arguments);if(S.view==='config')cfgPaint()}}
Object.assign(FRM,{
 cfgcaja(f){CJ.cfg.fondo=Math.max(0,+f.get('f')||0);CJ.cfg.recCred=Math.max(0,+f.get('r')||0);CJ.cfg.medios=['Efectivo','Transferencia','Mercado Pago','Débito','Crédito'].filter(m=>m==='Efectivo'||f.get('m_'+m));logA('Configuración de caja actualizada');save();toast('Caja guardada ✔');render()},
 cfgrrhh(f){RH.cfg.inicio=f.get('i')||'08:00';RH.cfg.tol=Math.max(0,+f.get('t')||0);RH.cfg.vacBase=Math.max(0,+f.get('v')||0);RH.cfg.metodo=f.get('m');logA('Configuración de RR HH actualizada');save();toast('Guardado ✔');render()},
 cfgclub(f){CB.cfg.ptsPor=Math.max(1,+f.get('p')||1000);logA('Reglas del Club actualizadas');save();toast('Guardado ✔');render()}
});
