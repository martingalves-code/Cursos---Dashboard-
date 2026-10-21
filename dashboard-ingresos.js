/* ISSP: tablero de incorporaciones y clasificación de gestión.
   Fuente: pestaña Ingresos de Google Sheets. No cargar datos personales aquí. */
(function () {
  "use strict";
  const sheet = "15WzM4V0uXH4QfVmsSQ7fGIxhOF-H7Z1koV40SWrUpuk";
  const gid = "1748902602";
  const types = [
    ["Cadetes Policía", "cadetes"],
    ["Aspirantes Bomberos", "bomberos"],
    ["Servicio Penitenciario", "penitenciarios"]
  ];
  const fallback = [
    {id:"policia-2025-14",type:"Cadetes Policía",promo:"14ª Prom.",year:2025,month:"Febrero",period:"Febrero 2025 a diciembre 2025",total:1210,male:679,female:531,red:null,management:"Gestión de Martín Galves"},
    {id:"bomberos-2025-10",type:"Aspirantes Bomberos",promo:"9ª Prom.",year:2025,month:"Febrero",period:"Incorporación febrero 2025",total:205,male:143,female:62,red:null,management:"Gestión de Martín Galves"},
    {id:"policia-2026-15",type:"Cadetes Policía",promo:"15ª Prom.",year:2026,month:"Febrero",period:"Incorporación febrero 2026",total:1190,male:672,female:518,red:85,management:"Gestión de Martín Galves"},
    {id:"bomberos-2026-10",type:"Aspirantes Bomberos",promo:"10ª Prom.",year:2026,month:"Febrero",period:"Incorporación febrero 2026",total:212,male:149,female:63,red:15,management:"Gestión de Martín Galves"},
    {id:"bomberos-2024-8",type:"Aspirantes Bomberos",promo:"8ª Prom.",year:2024,month:"Sin informar",period:"Año 2024 (fecha exacta no informada)",total:155,male:106,female:49,red:null,management:"Gestión anterior"},
    {id:"penitenciario-2026-1",type:"Servicio Penitenciario",promo:"1ª Prom.",year:2026,month:"Agosto",period:"Ingreso 31/08/2026",total:120,male:66,female:54,red:null,management:"Gestión de Martín Galves"}
  ];
  let incomes = fallback.slice();
  const esc = value => String(value == null ? "" : value)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const fmt = value => value == null || !Number.isFinite(value) ? "—" : Number(value).toLocaleString("es-AR");
  const sum = (arr,key) => arr.reduce((n,x) => n+(Number(x[key])||0),0);
  const numberOrNull = value => {
    if (value == null || value === "") return null;
    const n = typeof value === "number" ? value : Number(String(value).replace(/\./g,"").replace(",","."));
    return Number.isFinite(n) ? n : NaN;
  };
  function card(label, value) {
    return '<div class="s-card"><div class="s-num">'+fmt(value)+'</div><div class="s-label">'+esc(label)+'</div></div>';
  }
  function management(c) {
    const previous = /anterior/i.test(String(c.management||""));
    return '<span class="management-pill '+(previous?'pre':'martin')+'">'+esc(c.management||"No informado")+'</span>';
  }
  function tableRows(group) {
    if (!group.length) return '<tr><td colspan="9" style="padding:20px;color:#767085">Sin promociones cargadas todavía. Se completarán desde la pestaña «Ingresos».</td></tr>';
    const months=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    return group.slice().sort((a,b)=>a.year-b.year||months.indexOf(a.month)-months.indexOf(b.month))
      .map(c=>'<tr><td>'+esc(c.year)+'</td><td>'+esc(c.month)+'</td><td>'+esc(c.period)+'</td><td><span class="ed-badge">'+esc(c.promo)+'</span></td>'
        +'<td class="num-cell">'+fmt(c.male)+'</td><td class="num-cell">'+fmt(c.female)+'</td><td class="num-cell">'+fmt(c.total)+'</td><td>'+management(c)+'</td>'
        +'<td>'+fmt(c.red)+'</td></tr>').join("");
  }
  function render() {
    const parent = document.getElementById("tab-ingreso");
    if (!parent) return;
    const years = [...new Set(incomes.map(x=>x.year))].sort((a,b)=>a-b);
    const total = sum(incomes,"total");
    parent.innerHTML =
      '<div class="summary-row" id="ingreso-total-cards">'
      +card("Promociones registradas",incomes.length)+card("Total incorporaciones",total)
      +card("Masculinos",sum(incomes,"male"))+card("Femeninos",sum(incomes,"female"))
      +years.map(y=>card("Ingresos "+y,sum(incomes.filter(x=>x.year===y),"total"))).join("")+'</div>'
      +'<div id="ingreso-sync-status" class="search-meta" style="margin:12px 0 20px">'
      +'Estadísticas del ISSP · Google Sheets · Actualización automática.'
      +'</div>'
      +types.map(t=>'<div class="section-title">'+esc(t[0])+'</div><div class="table-wrap">'
      +'<table><thead><tr><th>Año</th><th>Mes</th><th>Período</th><th>Promoción</th>'
      +'<th>Masculinos</th><th>Femeninos</th><th>Total</th><th>Gestión</th><th>En rojo*</th></tr></thead>'
      +'<tbody id="ingresos-'+t[1]+'">'+tableRows(incomes.filter(x=>x.type===t[0]))+'</tbody></table></div>').join("")
      +'<p class="search-meta" style="margin:15px 0">*Los registros en rojo forman parte del total de 2026 y no se suman otra vez. '
      +'Servicio Penitenciario se completará cuando se incorpore su primera nómina. '
      +'Los datos estadísticos no requieren publicar nombres ni DNI.</p>';
  }
  function cellsToObjects(response) {
    const cols = response.table.cols.map(x=>String(x.label||"").trim());
    const name = ["ID","Tipo de ingreso","Promoción","Año","Mes","Período","Total","Masculinos","Femeninos","Estado","Observaciones","Ausentes / bajas","Registrados en archivo","Fecha de corte","Gestión"];
    const rows = response.table.rows || [];
    const get = (r,index) => {
      const i=cols.indexOf(name[index]),c=r.c?.[i>=0?i:index];
      return c ? (c.v ?? c.f ?? "") : "";
    };
    const seen=new Set(),data=[];
    for (const r of rows) {
      const id=String(get(r,0)).trim();if (!id)continue;
      const type=String(get(r,1)).trim(),year=numberOrNull(get(r,3));
      const total=numberOrNull(get(r,6)),male=numberOrNull(get(r,7));
      const female=numberOrNull(get(r,8)),red=numberOrNull(get(r,11));
      if (seen.has(id)||!types.some(t=>t[0]===type)||!Number.isInteger(year)||
        (total!==null&&(!Number.isInteger(total)||total<=0))||
        [male,female,red].some(x=>x!==null&&(!Number.isInteger(x)||x<0))||
        (total!==null&&((male??0)+(female??0)>total))||
        (total!==null&&male!==null&&female!==null&&male+female!==total)) continue;
      seen.add(id);
      data.push({
        id,type,promo:String(get(r,2)||"Incorporación"),year,
        month:String(get(r,4)||""),period:String(get(r,5)||""),
        total,male,female,red,management:String(get(r,14)||"No informado")
      });
    }
    const mandatory=fallback.map(x=>x.id);
    for(const id of mandatory){
      if(!data.some(x=>x.id===id)){
        const known=fallback.find(x=>x.id===id);
        if(known)data.push({...known});
      }
    }
    if(data.length<5) throw Error("Datos incompletos en Ingresos");
    return data;
  }
  function fetchStats(){
    return new Promise((resolve,reject)=>{
      const callback="isspIngresos"+Date.now()+Math.floor(Math.random()*1000);
      const script=document.createElement("script");
      let finished=false;
      const timer=setTimeout(()=>complete(new Error("Sin respuesta")),13000);
      function complete(err,data){
        if(finished)return;finished=true;clearTimeout(timer);
        try{delete window[callback]}catch(_){}
        script.remove();err?reject(err):resolve(data);
      }
      window[callback]=reply=>{
        try {
          if (!reply?.table || reply.status==="error") throw Error("Error al consultar Google Sheets");
          complete(null,cellsToObjects(reply));
        } catch(e){complete(e);}
      };
      script.onerror=()=>complete(new Error("No se pudo conectar"));
      script.src="https://docs.google.com/spreadsheets/d/"+sheet+
        "/gviz/tq?gid="+gid+"&tqx="+encodeURIComponent("out:json;responseHandler:"+callback)+"&t="+Date.now();
      document.head.appendChild(script);
    });
  }
  let pending=false;
  async function update(){
    if(pending)return;pending=true;
    try {
      const result=await fetchStats();
      incomes=result;render();
      const label=document.getElementById("ingreso-sync-status");
      if(label)label.textContent="Sincronizado con Google Sheets. Para agregar una nueva promoción, completá una fila en «Ingresos».";
    }catch(e){
      const label=document.getElementById("ingreso-sync-status");
      if(label)label.textContent="No se pudo sincronizar en este momento; se muestran los últimos datos precargados.";
    }finally{pending=false;}
  }
  function init(){
    const button=[...document.querySelectorAll(".tab-btn")].find(x=>x.textContent.includes("Cadetes"));
    if(button)button.textContent="Cadetes · Bomberos · Penitenciario";
    try {
      if(typeof gestionBadge==="function") {
        gestionBadge=c=>'<span class="management-pill '+(/anterior/i.test(String(c.management||""))?'pre':'martin')+'">'+esc(c.management||"No informado")+'</span>';
      }
      if(typeof COURSE_BASE!=="undefined" && typeof COURSES!=="undefined"){
        for(const group of [COURSE_BASE,COURSES]) for(const c of group){
          c.management=(c.id==="ep2024may"||c.id==="ep2024jul")?"Gestión anterior":"Gestión de Martín Galves";
        }
        if(typeof renderCursosNice==="function")renderCursosNice();
      }
    }catch(e){console.warn("No se pudo modificar etiqueta de NICE:",e);}
    render();update();
    setInterval(update,60000);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();
