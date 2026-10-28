/* Sistema VB · Estudio contable — servidor API REST + MCP (solo lectura). Desarrollado por Vincular Business · WhatsApp (387) 4484132 · vincularbusiness@gmail.com */
/* =====================================================================
   SISTEMA VB · API REST + MCP — núcleo compartido (navegador y servidor)
   Funciones puras sobre una "foto" de datos del estudio. Solo lectura.
   ===================================================================== */
const API_VER='1.0.0';
const API_EPS=[
 ['GET','/v1/clientes','Lista de clientes de la cartera','tipo (mono|ri|soc|ph), q (nombre o CUIT)'],
 ['GET','/v1/clientes/{cuit}','Ficha del cliente: datos de inscripción, impuestos y última sincronización',''],
 ['GET','/v1/clientes/{cuit}/sct','Sistema de Cuentas Tributarias: deudas con intereses, vencimientos y DDJJ pendientes',''],
 ['GET','/v1/clientes/{cuit}/ccma','Cuenta Corriente de Monotributistas y Autónomos: saldo deudor o a favor',''],
 ['GET','/v1/clientes/{cuit}/comprobantes','Mis Comprobantes: emitidos y recibidos','tipo (emitidos|recibidos), desde, hasta (AAAA-MM), letra, limit, offset'],
 ['GET','/v1/clientes/{cuit}/libro-iva','Portal IVA: presentaciones del Libro IVA Digital con débito y crédito fiscal',''],
 ['GET','/v1/clientes/{cuit}/dfe','Domicilio Fiscal Electrónico: notificaciones','no_leidas (1)'],
 ['GET','/v1/clientes/{cuit}/monotributo','Categoría, facturación de 12 meses y tope',''],
 ['GET','/v1/notificaciones','Novedades del DFE de toda la cartera','no_leidas (1), desde (AAAA-MM-DD)'],
 ['GET','/v1/deudas','Deuda vencida de toda la cartera, de mayor a menor',''],
 ['GET','/v1/vencimientos','Vencimientos de la cartera','desde, hasta (AAAA-MM-DD), cuit'],
 ['GET','/v1/recategorizacion','Monotributistas cerca del tope de su categoría','min_pct (por defecto 0)'],
 ['GET','/v1/estado','Estado de la sincronización y versión de la API','']
];
const MCP_TOOLS=[
 {name:'listar_clientes',description:'Lista los clientes de la cartera del estudio. Filtra por condición (mono, ri, soc, ph) o por texto (nombre o CUIT).',inputSchema:{type:'object',properties:{tipo:{type:'string',enum:['mono','ri','soc','ph']},q:{type:'string',description:'Nombre o CUIT'}}},path:a=>'/v1/clientes',q:a=>({tipo:a.tipo,q:a.q})},
 {name:'ficha_cliente',description:'Datos de inscripción de un cliente: condición, categoría, actividad, impuestos y fecha de la última sincronización con ARCA.',inputSchema:{type:'object',properties:{cliente:{type:'string',description:'CUIT o nombre del cliente'}},required:['cliente']},path:a=>'/v1/clientes/{c}'},
 {name:'deuda_y_vencimientos',description:'Sistema de Cuentas Tributarias de un cliente: deudas con intereses, próximos vencimientos y declaraciones juradas pendientes.',inputSchema:{type:'object',properties:{cliente:{type:'string'}},required:['cliente']},path:a=>'/v1/clientes/{c}/sct'},
 {name:'cuenta_ccma',description:'Cuenta Corriente de Monotributistas y Autónomos de un cliente: saldo deudor o a favor y cuotas.',inputSchema:{type:'object',properties:{cliente:{type:'string'}},required:['cliente']},path:a=>'/v1/clientes/{c}/ccma'},
 {name:'comprobantes',description:'Comprobantes emitidos o recibidos de un cliente (Mis Comprobantes) con totales, entre dos meses.',inputSchema:{type:'object',properties:{cliente:{type:'string'},tipo:{type:'string',enum:['emitidos','recibidos']},desde:{type:'string',description:'AAAA-MM'},hasta:{type:'string',description:'AAAA-MM'},limit:{type:'number'}},required:['cliente']},path:a=>'/v1/clientes/{c}/comprobantes',q:a=>({tipo:a.tipo,desde:a.desde,hasta:a.hasta,limit:a.limit||50})},
 {name:'libro_iva',description:'Presentaciones del Libro IVA Digital de un cliente: período, fecha y totales de débito y crédito fiscal.',inputSchema:{type:'object',properties:{cliente:{type:'string'}},required:['cliente']},path:a=>'/v1/clientes/{c}/libro-iva'},
 {name:'notificaciones_dfe',description:'Notificaciones del Domicilio Fiscal Electrónico. Con cliente devuelve las de ese cliente; sin cliente, las de toda la cartera.',inputSchema:{type:'object',properties:{cliente:{type:'string'},no_leidas:{type:'boolean'}}},path:a=>a.cliente?'/v1/clientes/{c}/dfe':'/v1/notificaciones',q:a=>({no_leidas:a.no_leidas?'1':''})},
 {name:'deudas_cartera',description:'Clientes con deuda vencida en el Sistema de Cuentas Tributarias, de mayor a menor.',inputSchema:{type:'object',properties:{}},path:a=>'/v1/deudas'},
 {name:'vencimientos',description:'Vencimientos de la cartera entre dos fechas (AAAA-MM-DD), opcionalmente de un cliente.',inputSchema:{type:'object',properties:{desde:{type:'string'},hasta:{type:'string'},cliente:{type:'string'}}},path:a=>'/v1/vencimientos',q:a=>({desde:a.desde,hasta:a.hasta,cuit:a.cliente})},
 {name:'recategorizacion',description:'Monotributistas con su facturación de 12 meses frente al tope de la categoría, del más cercano al más lejano.',inputSchema:{type:'object',properties:{min_pct:{type:'number'}}},path:a=>'/v1/recategorizacion',q:a=>({min_pct:a.min_pct})}
];
function apiNorm(t){return String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
function apiFindCli(db,ref){
 if(ref==null)return null;const d=String(ref).replace(/\D/g,'');
 if(d.length===11){const c=db.clientes.find(x=>x.cuit.replace(/\D/g,'')===d);if(c)return c}
 if(/^\d+$/.test(String(ref).trim())){const c=db.clientes.find(x=>String(x.id)===String(ref).trim());if(c)return c}
 const q=apiNorm(ref);if(!q)return null;
 return db.clientes.find(x=>apiNorm(x.nombre)===q)||db.clientes.find(x=>apiNorm(x.nombre).includes(q))||null;
}
function apiRoute(db,method,path,query){
 query=query||{};method=String(method||'GET').toUpperCase();
 const ok=b=>({status:200,body:b}),err=(s,m)=>({status:s,body:{error:m}});
 if(method!=='GET')return err(405,'La API es de solo lectura: no permite cargar, modificar ni borrar datos, ni operar ante ARCA.');
 const p=String(path||'').split('?')[0].replace(/\/+$/,'');
 if(p==='/v1/estado')return ok({api:API_VER,estudio:db.estudio.nombre,generado:db.generado,sincronizacion:db.sync,clientes:db.clientes.length,solo_lectura:true});
 if(p==='/v1/clientes'){let L=db.clientes;if(query.tipo)L=L.filter(c=>c.tipo===query.tipo);if(query.q){const q=apiNorm(query.q),d=String(query.q).replace(/\D/g,'');L=L.filter(c=>apiNorm(c.nombre).includes(q)||(d.length>3&&c.cuit.replace(/\D/g,'').includes(d)))}
  return ok({total:L.length,clientes:L.map(c=>({cuit:c.cuit,nombre:c.nombre,condicion:c.condicion,categoria:c.categoria||null,sincronizado:c.sincronizado}))})}
 if(p==='/v1/deudas'){const L=db.clientes.map(c=>({c,s:db.sct[c.cuit]})).filter(x=>x.s&&x.s.deuda_vencida>0).sort((a,b)=>b.s.deuda_vencida-a.s.deuda_vencida);
  return ok({total:Math.round(L.reduce((a,x)=>a+x.s.deuda_vencida,0)*100)/100,clientes:L.map(x=>({cuit:x.c.cuit,nombre:x.c.nombre,capital_vencido:x.s.capital_vencido,intereses:x.s.intereses,deuda_vencida:x.s.deuda_vencida,sincronizado:x.c.sincronizado}))})}
 if(p==='/v1/notificaciones'){let L=[];db.clientes.forEach(c=>(db.dfe[c.cuit]||[]).forEach(n=>L.push(Object.assign({cuit:c.cuit,cliente:c.nombre},n))));
  if(query.no_leidas==='1'||query.no_leidas===true)L=L.filter(n=>!n.leida);if(query.desde)L=L.filter(n=>n.fecha>=query.desde);L.sort((a,b)=>a.fecha<b.fecha?1:-1);return ok({total:L.length,notificaciones:L})}
 if(p==='/v1/vencimientos'){let L=db.vencimientos;if(query.desde)L=L.filter(v=>v.fecha>=query.desde);if(query.hasta)L=L.filter(v=>v.fecha<=query.hasta);
  if(query.cuit){const c=apiFindCli(db,query.cuit);if(!c)return err(404,'No encontré ese cliente en la cartera.');L=L.filter(v=>v.cuit===c.cuit)}
  return ok({total:L.length,vencimientos:L})}
 if(p==='/v1/recategorizacion'){const mn=+query.min_pct||0;const L=db.clientes.filter(c=>db.mono[c.cuit]).map(c=>Object.assign({cuit:c.cuit,nombre:c.nombre},db.mono[c.cuit])).filter(x=>x.porcentaje>=mn).sort((a,b)=>b.porcentaje-a.porcentaje);return ok({total:L.length,monotributistas:L})}
 const m=p.match(/^\/v1\/clientes\/([^/]+)(?:\/([a-z-]+))?$/);
 if(m){const c=apiFindCli(db,decodeURIComponent(m[1]));if(!c)return err(404,'No encontré ese cliente en la cartera.');const s=m[2]||'';
  const base={cuit:c.cuit,nombre:c.nombre,sincronizado:c.sincronizado};
  if(!s)return ok(c);
  if(s==='sct')return ok(Object.assign(base,db.sct[c.cuit]||{}));
  if(s==='ccma'){const k=db.ccma[c.cuit];if(!k)return err(404,'Las sociedades no tienen Cuenta Corriente de Monotributistas y Autónomos.');return ok(Object.assign(base,k))}
  if(s==='libro-iva'){const k=db.libro_iva[c.cuit];if(!k)return err(404,'El cliente no es responsable inscripto: no presenta Libro IVA Digital.');return ok(Object.assign(base,{presentaciones:k}))}
  if(s==='dfe'){let L=db.dfe[c.cuit]||[];if(query.no_leidas==='1'||query.no_leidas===true)L=L.filter(n=>!n.leida);return ok(Object.assign(base,{total:L.length,notificaciones:L}))}
  if(s==='monotributo'){const k=db.mono[c.cuit];if(!k)return err(404,'El cliente no es monotributista.');return ok(Object.assign(base,k))}
  if(s==='comprobantes'){const cp=db.comprobantes[c.cuit]||{emitidos:[],recibidos:[]};let L=[];
   if(query.tipo!=='recibidos')L=L.concat(cp.emitidos.map(x=>Object.assign({tipo:'emitido'},x)));
   if(query.tipo!=='emitidos')L=L.concat(cp.recibidos.map(x=>Object.assign({tipo:'recibido'},x)));
   if(query.desde)L=L.filter(x=>x.fecha.slice(0,7)>=query.desde);if(query.hasta)L=L.filter(x=>x.fecha.slice(0,7)<=query.hasta);
   if(query.letra)L=L.filter(x=>x.letra===String(query.letra).toUpperCase());
   L.sort((a,b)=>a.fecha<b.fecha?1:-1);
   const tot=k=>Math.round(L.filter(x=>x.tipo===k).reduce((a,x)=>a+x.total,0)*100)/100;
   const lim=Math.min(500,+query.limit||100),off=+query.offset||0;
   return ok(Object.assign(base,{total_registros:L.length,total_emitido:tot('emitido'),total_recibido:tot('recibido'),limit:lim,offset:off,comprobantes:L.slice(off,off+lim)}))}
  return err(404,'Recurso inexistente.')}
 return err(404,'Endpoint inexistente. Consultá GET /v1/estado y la documentación.');
}
function mcpCall(db,name,args){
 const t=MCP_TOOLS.find(x=>x.name===name);if(!t)return{isError:true,content:[{type:'text',text:'Herramienta desconocida: '+name}]};
 args=args||{};let path=t.path(args);
 if(path.includes('{c}')){const c=apiFindCli(db,args.cliente);if(!c)return{isError:true,content:[{type:'text',text:'No encontré el cliente "'+(args.cliente||'')+'" en la cartera. Usá listar_clientes para ver los nombres y CUIT.'}]};path=path.replace('{c}',c.cuit.replace(/\D/g,''))}
 const q=t.q?t.q(args):{};Object.keys(q).forEach(k=>{if(q[k]==null||q[k]==='')delete q[k]});
 const r=apiRoute(db,'GET',path,q);
 return{isError:r.status!==200,content:[{type:'text',text:JSON.stringify(r.body,null,1)}]};
}
function mcpHandle(db,msg){
 const id=msg.id,res=r=>({jsonrpc:'2.0',id,result:r}),er=(c,m)=>({jsonrpc:'2.0',id,error:{code:c,message:m}});
 if(msg.method==='initialize')return res({protocolVersion:(msg.params&&msg.params.protocolVersion)||'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'sistema-vb-estudio',version:API_VER},instructions:'Datos de la cartera del estudio contable (Sistema VB): comprobantes, deuda, saldos, vencimientos y notificaciones del Domicilio Fiscal Electrónico. Solo lectura: no modifica nada ni opera ante ARCA.'});
 if(msg.method==='notifications/initialized'||(msg.method||'').startsWith('notifications/'))return null;
 if(msg.method==='ping')return res({});
 if(msg.method==='tools/list')return res({tools:MCP_TOOLS.map(t=>({name:t.name,description:t.description,inputSchema:t.inputSchema,annotations:{readOnlyHint:true}}))});
 if(msg.method==='tools/call')return res(mcpCall(db,msg.params&&msg.params.name,msg.params&&msg.params.arguments));
 if(id==null)return null;
 return er(-32601,'Método no soportado: '+msg.method);
}

/* ---------------------------------------------------------------------
   Servidor: API REST + MCP (stdio y HTTP). Node.js 18+, sin dependencias.
   Uso:
     node vb-api.mjs --datos datos-estudio.json [--puerto 8787]
     node vb-api.mjs --mcp --datos datos-estudio.json        (Claude Desktop)
   Claves: las creadas en Sistema VB (API REST y MCP → Claves) viajan en
   datos-estudio.json como huella SHA-256. También se puede fijar una con
   la variable de entorno VB_API_KEY.
   --------------------------------------------------------------------- */
import fs from 'node:fs';
import http from 'node:http';
import crypto from 'node:crypto';
import readline from 'node:readline';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const MCP_STDIO = argv.includes('--mcp');
const FILE = opt('--datos', process.env.VB_DATOS || 'datos-estudio.json');
const PORT = +opt('--puerto', process.env.PORT || 8787);
const log = (...a) => process.stderr.write('[vb-api] ' + a.join(' ') + '\n');

let DB = null;
function load() {
  try {
    const d = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    if (!d || !Array.isArray(d.clientes)) throw new Error('el archivo no tiene el formato de Sistema VB');
    DB = d; log(`datos cargados: ${d.clientes.length} clientes · generado ${d.generado}`);
  } catch (e) { log('no se pudieron leer los datos (' + FILE + '): ' + e.message); if (!DB) process.exit(1); }
}
load();
fs.watchFile(FILE, { interval: 2000 }, () => load());

const sha = t => crypto.createHash('sha256').update(String(t)).digest('hex');
function authorized(req) {
  const h = String(req.headers.authorization || ''), k = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  if (!k) return false;
  if (process.env.VB_API_KEY && crypto.timingSafeEqual(Buffer.from(sha(k)), Buffer.from(sha(process.env.VB_API_KEY)))) return true;
  return (DB.claves || []).includes(sha(k));
}

if (MCP_STDIO) {
  // MCP por stdio: un mensaje JSON-RPC por línea
  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', line => {
    if (!line.trim()) return;
    let msg; try { msg = JSON.parse(line); } catch { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON inválido' } }) + '\n'); return; }
    const list = Array.isArray(msg) ? msg : [msg];
    const out = list.map(m => mcpHandle(DB, m)).filter(Boolean);
    if (out.length) process.stdout.write(JSON.stringify(Array.isArray(msg) ? out : out[0]) + '\n');
  });
  log('MCP por stdio listo');
} else {
  const openapi = () => ({
    openapi: '3.0.3', info: { title: 'Sistema VB · API del estudio', version: API_VER, description: 'Datos fiscales sincronizados de la cartera. Solo lectura.' },
    components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer' } } }, security: [{ bearer: [] }],
    paths: Object.fromEntries(API_EPS.map(e => [e[1], { get: { summary: e[2], description: e[3] ? 'Parámetros: ' + e[3] : '', parameters: (e[1].includes('{cuit}') ? [{ name: 'cuit', in: 'path', required: true, schema: { type: 'string' } }] : []), responses: { 200: { description: 'OK' }, 401: { description: 'Clave inválida' }, 404: { description: 'No encontrado' } } } }]))
  });
  const send = (res, st, body, extra) => { const t = JSON.stringify(body, null, 1); res.writeHead(st, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, Mcp-Session-Id', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Cache-Control': 'no-store' }, extra || {})); res.end(t); };
  http.createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost');
    if (req.method === 'OPTIONS') return send(res, 204, {});
    if (u.pathname === '/' || u.pathname === '/v1') return send(res, 200, { servicio: 'Sistema VB · API REST + MCP', estudio: DB.estudio.nombre, version: API_VER, documentacion: '/v1/openapi.json', mcp: '/mcp', solo_lectura: true });
    if (u.pathname === '/v1/openapi.json') return send(res, 200, openapi());
    if (!authorized(req)) return send(res, 401, { error: 'Falta la clave o no es válida. Enviala como Authorization: Bearer <clave>.' }, { 'WWW-Authenticate': 'Bearer' });
    if (u.pathname === '/mcp') {
      if (req.method !== 'POST') return send(res, 405, { error: 'El MCP remoto acepta POST con JSON-RPC.' });
      let b = ''; req.on('data', c => { b += c; if (b.length > 1e6) req.destroy(); });
      req.on('end', () => {
        let msg; try { msg = JSON.parse(b); } catch { return send(res, 400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON inválido' } }); }
        const list = Array.isArray(msg) ? msg : [msg], out = list.map(m => mcpHandle(DB, m)).filter(Boolean);
        if (!out.length) { res.writeHead(202, { 'Access-Control-Allow-Origin': '*' }); return res.end(); }
        send(res, 200, Array.isArray(msg) ? out : out[0]);
      });
      return;
    }
    const q = Object.fromEntries(u.searchParams), r = apiRoute(DB, req.method, u.pathname, q);
    log(req.method, u.pathname, r.status);
    send(res, r.status, r.body);
  }).listen(PORT, () => log(`API REST en http://localhost:${PORT}/v1 · MCP en http://localhost:${PORT}/mcp`));
}
