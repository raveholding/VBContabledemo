# Servidor API REST + MCP · Sistema VB

Sirve los datos fiscales de la cartera del estudio a otros sistemas (API REST) y a asistentes de IA (MCP). Es **de solo lectura**: no carga, no modifica y no opera ante ARCA.

## 1. Datos

En Sistema VB: **API REST y MCP → Instalar el servidor → Descargar `datos-estudio.json`**. El archivo trae:

- clientes;
- comprobantes de 12 meses;
- Sistema de Cuentas Tributarias;
- CCMA;
- Libro IVA Digital;
- Domicilio Fiscal Electrónico;
- vencimientos;
- la huella SHA-256 de las claves activas (nunca la clave).

Si se vuelve a descargar el archivo, el servidor lo recarga solo.

## 2. Iniciar (Node.js 18 o superior, sin dependencias)

```bash
node vb-api.mjs --datos datos-estudio.json --puerto 8787
```

- API REST: `http://localhost:8787/v1/...` con `Authorization: Bearer <clave creada en Sistema VB>`. Otra opción es fijar una clave con la variable de entorno `VB_API_KEY`.
- Especificación: `GET /v1/openapi.json`.
- MCP remoto (HTTP, JSON-RPC): `POST http://localhost:8787/mcp`, con la misma clave.

### Endpoints

| Ruta | Devuelve |
|---|---|
| `/v1/clientes` | Cartera (`tipo`, `q`) |
| `/v1/clientes/{cuit}` | Ficha e impuestos |
| `/v1/clientes/{cuit}/sct` | Deudas con intereses, vencimientos y DDJJ pendientes |
| `/v1/clientes/{cuit}/ccma` | Saldo deudor o a favor |
| `/v1/clientes/{cuit}/comprobantes` | Emitidos y recibidos (`tipo`, `desde`, `hasta`, `letra`, `limit`, `offset`) |
| `/v1/clientes/{cuit}/libro-iva` | Presentaciones del Libro IVA Digital |
| `/v1/clientes/{cuit}/dfe` | Notificaciones (`no_leidas=1`) |
| `/v1/clientes/{cuit}/monotributo` | Categoría, facturación y tope |
| `/v1/notificaciones` | DFE de toda la cartera |
| `/v1/deudas` | Deuda vencida de la cartera |
| `/v1/vencimientos` | Vencimientos (`desde`, `hasta`, `cuit`) |
| `/v1/recategorizacion` | Monotributistas frente al tope |
| `/v1/estado` | Sincronización y versión |

## 3. Conectar Claude Desktop (MCP por consola)

Configuración → Desarrollador → Editar configuración:

```json
{
  "mcpServers": {
    "estudio-vb": {
      "command": "node",
      "args": ["C:/SistemaVB/vb-api.mjs", "--mcp", "--datos", "C:/SistemaVB/datos-estudio.json"]
    }
  }
}
```

Herramientas:

- `listar_clientes`
- `ficha_cliente`
- `deuda_y_vencimientos`
- `cuenta_ccma`
- `comprobantes`
- `libro_iva`
- `notificaciones_dfe`
- `deudas_cartera`
- `vencimientos`
- `recategorizacion`

## Límites

- En esta versión los datos salen del archivo que exporta el sistema. La sincronización con ARCA es simulada.
- La conexión real con ARCA requiere la clave fiscal delegada de cada cliente y se integra en la versión con nube.
- Para publicarlo en internet hace falta ponerlo detrás de HTTPS (un proxy o un servicio de hosting).

Desarrollado por **Vincular Business** · WhatsApp (387) 4484132 · vincularbusiness@gmail.com


## Puente con Afip SDK (conexión real con ARCA)

Si el navegador no puede llamar directo a Afip SDK, iniciá el servidor (no hace falta el archivo de datos):

```bash
node vb-api.mjs --puerto 8787
```

En Sistema VB: **Conexión con ARCA → Avanzado → URL de la API** = `http://localhost:8787/afipsdk`. El servidor reenvía cada consulta a `app.afipsdk.com` con la clave de acceso que manda el navegador (o la de la variable `AFIPSDK_TOKEN`).
