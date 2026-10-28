# Sistema VB · Estudio contable (demo)

Demo HTML5 de un sistema para estudios contables, organizado como una **cartera de clientes con la ficha de cada uno**. Funciona en un solo archivo, sin instalar nada, y guarda los datos en el navegador.

## Cómo se usa

- **Entrar:** como Administrador (acceso completo) o Secretaria (carga de comprobantes, retenciones, datos de ARCA, agenda y cobranzas; sin liquidaciones, declaraciones juradas ni configuración).
- **Datos:** arranca con datos de ejemplo. Con **"Empezar en limpio"** queda vacío para cargar la cartera real; lo que se carga queda guardado en el navegador. Hay copia de seguridad (descargar y restaurar) e importación de clientes desde Excel o CSV.

## Cartera

Inicio, bandeja de entrada (Domicilio Fiscal Electrónico, vencimientos, credenciales y alertas), agenda de vencimientos por terminación de CUIT con tareas del estudio, y listas separadas de **monotributistas, responsables inscriptos, sociedades y personas humanas**, con filtros (tope ≥ 75 %, categorías D–H, con deuda, DDJJ pendientes) y exportación a Excel. Además: IVA de la cartera, avance del mes, honorarios y cobranzas, reportes mensuales con la marca del estudio y API para empresas.

## Ficha de cada cliente

- **Resumen** con condición fiscal, deuda, CCMA, vencimientos, DDJJ pendientes, Domicilio Fiscal y ventas y compras de 12 meses.
- **Comprobantes:** ventas (emitidos) y compras (recibidos) con el tipo de factura, número, contraparte e importes a la vista. Carga manual completa (tipo, punto de venta, número, fecha, contraparte, condición de IVA, actividad, tipo de IVA, imputación, tipo de gasto, CAE/CAI y todos los importes: neto, alícuota, no gravado, exento, percepciones de IVA, IIBB, actividades varias y Ganancias, impuestos internos, combustibles y otros). Valida CUIT, duplicados, CAE y reglas de facturación (monotributo solo C, consumidor final B). Cada comprobante genera su asiento; editar o eliminar deja asiento de anulación. Importación del archivo de "Mis Comprobantes" de ARCA (Excel o CSV) y exportación a Excel con hojas Emitidos y Recibidos. Carga con foto (IA).
- **Impuestos:** liquidación de IVA con el detalle desplegable de cada renglón y traslado automático del saldo técnico y del saldo de libre disponibilidad, Ingresos Brutos (local o Convenio Multilateral), Ganancias, Monotributo (tope y recategorización), retenciones y percepciones, y declaraciones juradas simuladas con acuse y VEP.
- **Datos de ARCA:** CCMA, Domicilio Fiscal Electrónico por tema, liquidaciones de hacienda, Mis Comprobantes, Portal IVA (Libro IVA Digital), Sistema de Cuentas Tributarias (vencimientos, DDJJ pendientes y deudas con intereses) y Sistema Registral.
- **Herramientas:** contabilidad (libro diario, estados contables, ajuste por inflación), papeles de trabajo, documentos, reporte mensual y vista del cliente.

## Módulos activables (Configuración → Módulos)

Conciliación bancaria, sueldos, e-commerce, inversiones en bolsa y sitio público.

## Qué es simulado

La sincronización con ARCA, la lectura con IA, las presentaciones de declaraciones juradas, los VEP, Interbanking y las plataformas de e-commerce son simuladas. Las alícuotas, escalas de monotributo, tasa de interés y convenios son valores de ejemplo y se parametrizan en la versión real. La lectura y escritura de Excel y CSV es real.

Desarrollado por **Vincular Business** · WhatsApp (387) 4484132 · vincularbusiness@gmail.com
