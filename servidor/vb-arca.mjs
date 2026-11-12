/* ---------------------------------------------------------------------
   Sistema VB · puente hacia sv.arca.sdk (facturación electrónica propia)
   Reemplaza a Afip SDK para EMITIR comprobantes con CAE (WSAA + WSFEv1).
   No trae Mis Comprobantes ni el Domicilio Fiscal: eso sigue en /afipsdk.

   Variables de entorno (archivo .env FUERA del repositorio):
     SV_ARCA_SDK   carpeta del repo sv.arca.sdk ya compilado (npm run build)
     ARCA_AMBIENTE, ARCA_CUIT, ARCA_CERT_PEM_B64, ARCA_KEY_PEM_B64,
     ARCA_KEY_PASSPHRASE …  (ver .env.example del SDK)
     ARCA_PTO_VTA            punto de venta Web Service (por defecto 1)
     ARCA_CONDICION_EMISOR   RESPONSABLE_INSCRIPTO | MONOTRIBUTO | EXENTO
     ARCA_JOURNAL            carpeta del journal en disco (por defecto .arca-journal)

   Uso:  node --env-file=/ruta/.env vb-api.mjs --datos datos-estudio.json
   Requiere Node 20.6 o superior. Las rutas exigen la clave Bearer del servidor.
   --------------------------------------------------------------------- */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/* Neto y IVA 21 % que suman exactamente el total (todo en centavos) */
export function netoParaTotal(total) {
  const tc = Math.round(Number(total) * 100);
  if (!Number.isFinite(tc) || tc <= 0) throw new Error('El total debe ser un número positivo');
  const base = Math.round(tc / 1.21);
  for (let d = 0; d <= 3; d++) for (const n of d ? [base - d, base + d] : [base]) {
    if (n + Math.round(n * 0.21) === tc) return n / 100;
  }
  return base / 100; // sin coincidencia exacta: ARCA recibe lo que calcula el SDK
}

const soloDigitos = v => String(v == null ? '' : v).replace(/\D/g, '');

export function crearPuenteArca({ log, authorized, env = process.env, sdkFactory } = {}) {
  let sdkP = null, cfg = null;

  async function cargar() {
    if (sdkFactory) return sdkFactory();
    if (!env.SV_ARCA_SDK) throw Object.assign(new Error('Falta SV_ARCA_SDK: la carpeta del repo sv.arca.sdk compilado (npm run build).'), { st: 503 });
    const base = path.resolve(env.SV_ARCA_SDK, 'dist');
    let core, nodeMod;
    try { core = await import(pathToFileURL(path.join(base, 'index.js')).href); nodeMod = await import(pathToFileURL(path.join(base, 'node.js')).href); }
    catch (e) { throw Object.assign(new Error('No se pudo cargar sv.arca.sdk desde ' + base + ' (¿corriste npm install && npm run build?): ' + e.message), { st: 503 }); }
    const c = await core.cargarConfigDesdeEnv(env);
    const sdk = await core.crearArcaSdk({
      ambiente: c.ambiente, cuit: c.cuit, identity: c.identity, cipher: c.cipher,
      transport: new nodeMod.NodeHttpsTransport({ legacyDh: c.legacyDh }),
      repo: nodeMod.FileJournalRepository.open(env.ARCA_JOURNAL || '.arca-journal'),
      logger: core.createLogger({ level: 'warn' }),
      contexto: { condicionEmisor: env.ARCA_CONDICION_EMISOR || 'RESPONSABLE_INSCRIPTO' },
    });
    return { sdk, core, cfg: { ambiente: c.ambiente, cuit: c.cuit, cert: { subject: c.identity.info.subject, vence: c.identity.info.notAfter } } };
  }
  async function listo() {
    if (!sdkP) sdkP = cargar().catch(e => { sdkP = null; throw e; });
    const r = await sdkP; cfg = r.cfg; return r;
  }

  async function estado() {
    const { sdk } = await listo();
    let servidores = null, error = null;
    try { servidores = await sdk.wsfe.dummy(); } catch (e) { error = e.message; }
    return { configurado: true, ambiente: cfg.ambiente, cuit: cfg.cuit, certificado: cfg.cert, ptoVta: +(env.ARCA_PTO_VTA || 1), arca: servidores, error };
  }

  /* body: { idempotency_key, tipo: 'A'|'B'|'C', total, docTipo?, docNro?, condicionIvaReceptorId?, ptoVta? } */
  async function emitir(b) {
    const { sdk, core } = await listo();
    /* El SDK admite 8–128 caracteres [A-Za-z0-9:_.-]: se normaliza igual siempre, así un reintento no duplica */
    let key = String(b.idempotency_key || '').replace(/[^A-Za-z0-9:_.-]/g, '_').slice(0, 120);
    if (key && key.length < 8) key = 'vb-' + key.padEnd(5, '_');
    if (!key) throw Object.assign(new Error('Falta idempotency_key (usar el id de la venta: un reintento no duplica la factura).'), { st: 400 });
    const tipo = String(b.tipo || 'B').toUpperCase();
    const cbteTipo = { A: 1, B: 6, C: 11 }[tipo];
    if (!cbteTipo) throw Object.assign(new Error('Tipo de factura no soportado: ' + b.tipo), { st: 400 });
    const total = Number(b.total);
    const claseC = tipo === 'C';
    const neto = claseC ? total : netoParaTotal(total);
    const importes = core.calcularImportes([{ neto }], { claseC });
    const docNro = soloDigitos(b.docNro) || '0';
    const docTipo = b.docTipo || (tipo === 'A' ? 80 : 99);
    if (tipo === 'A' && !/^\d{11}$/.test(docNro)) throw Object.assign(new Error('La Factura A necesita el CUIT del cliente (11 dígitos).'), { st: 400 });
    const comp = {
      ptoVta: +(b.ptoVta || env.ARCA_PTO_VTA || 1), cbteTipo, concepto: 1,
      docTipo, docNro: docTipo === 99 ? 0 : docNro,
      condicionIvaReceptorId: b.condicionIvaReceptorId || (tipo === 'A' ? 1 : 5),
      ...importes,
    };
    const r = await sdk.facturador.emitir(comp, { idempotencyKey: key });
    return {
      ambiente: cfg.ambiente, estado: r.estado, valido: r.valido, modo: r.modo, mensaje: r.mensaje,
      ptoVta: r.ptoVta, cbteTipo: r.cbteTipo, cbteNro: r.cbteNro, cbteFch: r.cbteFch,
      cae: r.cae, caeFchVto: r.caeFchVto, caea: r.caea, qrUrl: r.qrUrl,
      impNeto: importes.impNeto, impIva: importes.impIva, impTotal: importes.impTotal,
      observaciones: r.observaciones, errores: r.errores, hallazgos: r.hallazgos,
    };
  }

  const leer = req => new Promise((ok, ko) => { let b = ''; req.on('data', c => { b += c; if (b.length > 1e5) { ko(Object.assign(new Error('Cuerpo demasiado grande'), { st: 413 })); req.destroy(); } }); req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch { ko(Object.assign(new Error('JSON inválido'), { st: 400 })); } }); req.on('error', ko); });

  /* Devuelve true si atendió la ruta. send(res, status, body) es el del servidor. */
  return function manejar(req, res, u, send) {
    if (!u.pathname.startsWith('/arca/')) return false;
    if (!authorized(req)) { send(res, 401, { error: 'Falta la clave o no es válida. Enviala como Authorization: Bearer <clave>.' }, { 'WWW-Authenticate': 'Bearer' }); return true; }
    const fallo = e => {
      const st = e.st || (e.code && /VALID|CONFIG/.test(String(e.code)) ? (e.analisis ? 422 : 400) : 502);
      log('arca', u.pathname, 'error', e.code || '', e.message);
      send(res, st, { error: e.message, codigo: e.code, hallazgos: e.analisis ? e.analisis.hallazgos : undefined, detalle: typeof e.toJSON === 'function' ? e.toJSON() : undefined });
    };
    if (u.pathname === '/arca/estado' && req.method === 'GET') { estado().then(r => send(res, 200, r), fallo); return true; }
    if (u.pathname === '/arca/emitir' && req.method === 'POST') {
      leer(req).then(emitir).then(r => { log('arca emitir', r.estado, r.ptoVta + '-' + r.cbteNro); send(res, r.valido ? 200 : (r.estado === 'RECHAZADO' ? 422 : 202), r); }).catch(fallo);
      return true;
    }
    send(res, 404, { error: 'Ruta no encontrada. Disponibles: GET /arca/estado · POST /arca/emitir' });
    return true;
  };
}
