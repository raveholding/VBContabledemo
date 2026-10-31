# Sistema VB · Estudio contable (demo)

Demo HTML5 de un sistema para estudios contables, organizado como una **cartera de clientes con la ficha de cada uno**. Funciona en un solo archivo, sin instalar nada, y guarda los datos en el navegador.

## Cómo se usa

- **Entrar:** como Administrador (acceso completo) o Secretaria (carga de comprobantes, retenciones, datos de ARCA, agenda y cobranzas; sin liquidaciones, declaraciones juradas ni configuración).
- **Datos:** arranca vacío, listo para cargar la cartera real (a mano, importando Excel o CSV, o con la clave fiscal de cada cliente). Con **"Cargar datos de ejemplo"** se ven 6 clientes completos de distintos tipos: dos monotributistas, un responsable inscripto, dos sociedades (una con empleados y otra agropecuaria con inversiones) y una persona humana con inversiones. Desde Configuración → Datos se puede volver a empezar en limpio. Lo que se carga queda guardado en el navegador; hay copia de seguridad (descargar y restaurar).

## Cartera

Inicio, bandeja de entrada (Domicilio Fiscal Electrónico, vencimientos, credenciales y alertas), agenda de vencimientos por terminación de CUIT con tareas del estudio, y listas separadas de **monotributistas, responsables inscriptos, sociedades y personas humanas**, con filtros (tope ≥ 75 %, categorías D–H, con deuda, DDJJ pendientes) y exportación a Excel. Además: IVA de la cartera, avance del mes, honorarios y cobranzas, reportes mensuales con la marca del estudio y API para empresas.

## Ficha de cada cliente

- **Resumen** con condición fiscal, deuda, CCMA, vencimientos, DDJJ pendientes, Domicilio Fiscal y ventas y compras de 12 meses.
- **Comprobantes:** ventas (emitidos) y compras (recibidos) con el tipo de factura, número, contraparte e importes a la vista. Carga manual completa (tipo, punto de venta, número, fecha, contraparte, condición de IVA, actividad, tipo de IVA, imputación, tipo de gasto, CAE/CAI y todos los importes: neto, alícuota, no gravado, exento, percepciones de IVA, IIBB, actividades varias y Ganancias, impuestos internos, combustibles y otros). Valida CUIT, duplicados, CAE y reglas de facturación (monotributo solo C, consumidor final B). Cada comprobante genera su asiento; editar o eliminar deja asiento de anulación. Importación del archivo de "Mis Comprobantes" de ARCA (Excel o CSV) y exportación a Excel con hojas Emitidos y Recibidos. Carga con foto (IA).
- **Impuestos:** liquidación de IVA con el detalle desplegable de cada renglón y traslado automático del saldo técnico y del saldo de libre disponibilidad, Ingresos Brutos (local o Convenio Multilateral), Ganancias, Monotributo (tope y recategorización), retenciones y percepciones, y declaraciones juradas simuladas con acuse y VEP.
- **Datos de ARCA:** CCMA, Domicilio Fiscal Electrónico por tema, liquidaciones de hacienda, Mis Comprobantes, Portal IVA (Libro IVA Digital), Sistema de Cuentas Tributarias (vencimientos, DDJJ pendientes y deudas con intereses) y Sistema Registral.
- **Herramientas:** contabilidad (libro diario, estados contables, ajuste por inflación), papeles de trabajo, documentos, reporte mensual y vista del cliente.

## Datos de ARCA de toda la cartera (sincronización diaria)

Cada pantalla muestra cuándo se sincronizó con ARCA y tiene "Sincronizar ahora". Los clientes sin clave fiscal delegada aparecen marcados.

- **Alta de cliente con clave fiscal:** con datos de ejemplo, al agregar un cliente con su clave fiscal se hace la primera sincronización con ARCA (simulada) y la ficha se completa con comprobantes de 12 meses, Domicilio Fiscal Electrónico, cuentas tributarias y CCMA. Desde la ficha se puede volver a sincronizar en cualquier momento. En el modo con tus datos no se inventa nada.

- **Deudas y vencimientos:** Sistema de Cuentas Tributarias de cada cliente, con deuda e intereses, DDJJ pendientes y próximo vencimiento.
- **Notificaciones:** alertas del Domicilio Fiscal Electrónico de toda la cartera en la bandeja de entrada.
- **Mis Comprobantes:** emitidos y recibidos de toda la cartera, con filtros y exportación a Excel.
- **Libro IVA Digital:** qué período presentó cada cliente, cuándo, y con qué débito y crédito fiscal.
- **CCMA:** saldo deudor o a favor de cada monotributista y autónomo.
- **Recategorización:** facturación de 12 meses frente al tope de cada categoría, con la proyección a la próxima recategorización.
- **Agenda:** vencimientos con los CUIT que alcanza cada uno, y tareas con responsable, tags y estado.
- **Reportes con tu marca:** llevan el logo y el nombre del estudio.

## API REST y servidor MCP (solo lectura)

Desde *API REST y MCP* se crean claves por sistema, se prueban los 13 endpoints con los datos de la cartera, se configuran webhooks y se descarga `datos-estudio.json`. La carpeta [`servidor/`](servidor/) trae `vb-api.mjs`, que corre con Node.js 18 y no necesita dependencias:

- Sirve esos datos por API REST, con clave `Bearer` y especificación OpenAPI.
- Funciona como servidor MCP, por consola (para Claude Desktop) o por HTTP, con 10 herramientas de solo lectura.

## Asistente de IA

Responde en castellano preguntas sobre deudas, vencimientos, facturación, Libro IVA, CCMA, recategorización y notificaciones. Funciona dentro del sistema, desde el menú o desde el botón flotante.

- Debajo de cada respuesta muestra las consultas a la API que usó.
- No modifica nada ni opera ante ARCA.
- Para preguntas libres, se puede conectar Claude u otro asistente compatible con MCP al servidor MCP.

## Todas las funciones del pedido original

Siguen en el menú: panel general, fichas de clientes, calendario de vencimientos, turnos y tablero, ventas y compras, impuestos, papeles de trabajo, contabilidad, sueldos, conciliación bancaria, documentos, carga de facturas con IA, e-commerce, inversiones en bolsa (mercado en vivo, cartera y órdenes, perfil del inversor), honorarios, portal del cliente, sitio público y exportaciones. Vienen activadas; cada módulo se puede apagar en Configuración → Módulos.

## Qué funciona con datos reales

- **Importación de "Mis Comprobantes" de ARCA** (CSV o Excel tal como se descargan, incluido el formato con columnas por alícuota): reconoce las columnas, convierte moneda, valida, saltea repetidos y genera el asiento.
- **Cálculos sobre esos datos:** liquidación de IVA, Libro IVA, Ingresos Brutos, Ganancias, tope y recategorización de monotributo, contabilidad y reportes.
- **Libro IVA Digital:** genera los 4 archivos con el diseño de registro oficial de ARCA (ventas 266, alícuotas de ventas 62, compras 325 y alícuotas de compras 84 caracteres por renglón).
- **Monotributo:** escalas y cuotas oficiales de ARCA vigentes desde agosto de 2026, con cuota distinta para servicios y para venta de bienes.
- **Vencimientos:** cronograma de ARCA 2026 por terminación de CUIT (IVA, autónomos, F.931, anticipos de Ganancias y Bienes Personales, monotributo) con los feriados nacionales.
- **Validaciones:** dígito verificador del CUIT y reglas de facturación.

## Conexión real con ARCA (Afip SDK)

En **Configuración → Conexión con ARCA** (o en el aviso de Inicio) se pega la clave de acceso de Afip SDK. Después, en la ficha de cada cliente, **Sincronizar con ARCA** pide la clave fiscal (la guarda solo en ese navegador) y trae de verdad, en modo solo lectura:

- **Mis Comprobantes** emitidos y recibidos de los últimos 12 meses, que alimentan IVA, Libro IVA Digital, tope de monotributo, contabilidad y reportes;
- **Domicilio Fiscal Electrónico**, con las comunicaciones en la bandeja de entrada;
- **Información de Monotributo**, con la categoría vigente.

La clave de acceso y las claves fiscales no se guardan en las copias de seguridad, ni en la API, ni en el repositorio. Si el navegador no puede llegar a Afip SDK, se usa el servidor de `servidor/` (`node vb-api.mjs …`) y en *URL de la API* se pone `http://localhost:8787/afipsdk`.

## Qué es simulado

Con los datos de ejemplo, la sincronización con ARCA es simulada. También lo son el Sistema de Cuentas Tributarias y la CCMA (Afip SDK tiene automatizaciones para ambos que se pueden sumar), la lectura con IA, las presentaciones de declaraciones juradas, los VEP, Interbanking y las plataformas de e-commerce. La tasa de interés resarcitorio y las alícuotas de Ingresos Brutos y tasas municipales son valores editables.

Desarrollado por **Vincular Business** · WhatsApp (387) 4484132 · vincularbusiness@gmail.com
