#!/usr/bin/env python3
"""Inyecta los módulos V28 (caja, equipo y RR HH, club, configuración dinámica, paleta, acceso oculto) en ../index.html.
Es idempotente: se puede correr las veces que haga falta; reemplaza el bloque anterior.
Uso:  cd fuente && python3 inyectar.py"""
import re,os,sys
H=os.path.dirname(os.path.abspath(__file__))
P=os.path.join(H,'..','index.html')
rd=lambda f:open(os.path.join(H,f),encoding='utf8').read()
s=open(P,encoding='utf8').read()
# 1) quitar el bloque anterior
s=re.sub(r'/\*V28-CSS-START\*/.*?/\*V28-CSS-END\*/\n?','',s,flags=re.S)
s=re.sub(r'/\*V28-JS-START\*/.*?/\*V28-JS-END\*/\n?','',s,flags=re.S)
s=re.sub(r'/\*V28-TAIL-START\*/.*?/\*V28-TAIL-END\*/\n?','',s,flags=re.S)
# 2) parches puntuales (se aplican una sola vez)
def patch(old,new,label):
    global s
    if old not in s: return  # ya aplicado
    if s.count(old)!=1: sys.exit('No se pudo aplicar el parche «%s» (coincidencias: %d)'%(label,s.count(old)))
    s=s.replace(old,new)
patch("return{ver:2,day:TODAYISO,ts:Date.now(),","return{ver:2,X:{CJ,RH,CB,XI:XINIT},day:TODAYISO,ts:Date.now(),",'snapshot')
patch("function restore(sn){\n const A=sn.A||{}","function restore(sn){\n if(sn.X)modRestore(sn.X);\n const A=sn.A||{}",'restore')
patch(" IA.items=[];\n [AS,COMP,EMPL"," IA.items=[];modReset();\n [AS,COMP,EMPL",'wipeAll')
patch(" DFE.forEach((x,i)=>x.id=i+1);\n CFG.mode='ejemplo';"," DFE.forEach((x,i)=>x.id=i+1);\n modReset();CFG.mode='ejemplo';",'trimEjemplo')
patch('<button class="btn sm" data-act="closepub" title="Solo para la demo">← Volver al panel</button>','','botón visible del sitio público')
# 3) CSS
css='/*V28-CSS-START*/\n'+rd('mod.css')+'\n/*V28-CSS-END*/\n'
i=s.find('</style>');assert i>0
s=s[:i]+css+s[i:]
# 4) JS (antes del arranque) y cola (después del arranque, antes del primer render)
js='/*V28-JS-START*/\n'+rd('mod-a-caja.js')+'\n'+rd('mod-b-equipo-club.js')+'\n'+rd('mod-c-sistema.js')+'\n/*V28-JS-END*/\n'
m='const _RESTORED=loadSaved();'
assert s.count(m)==1
s=s.replace(m,js+m)
tail="/*V28-TAIL-START*/\nmodPermFix();if(!S.role&&(!location.hash||location.hash==='#'))history.replaceState(null,'','#publico');\n/*V28-TAIL-END*/\n"
t='\nrender();syncHash();\n</script>'
k=s.rfind(t);assert k>0
s=s[:k+1]+tail+s[k+1:]
open(P,'w',encoding='utf8').write(s)
print('OK · index.html',len(s),'bytes')
