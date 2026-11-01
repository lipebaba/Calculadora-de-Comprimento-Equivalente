const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dn=[8,10,15,20,25,32,40,50,65,80,100,125,150,200,250,300,350];
const key='aduari-project-v1';
let state={version:1,project:'',diameter:3,unit:'in',items:[]};
function validate(s){
 if(!s || s.version!==1 || typeof s.project!=='string' || s.project.length>100 || !['in','mm'].includes(s.unit) || !Array.isArray(s.items) || s.items.length>500)throw Error('Arquivo de projeto inválido.');
 calculate(s.items,s.diameter,HYDRAULIC_DATA);
 return {version:1,project:s.project,diameter:s.diameter,unit:s.unit,items:s.items.map(x=>({id:x.id,quantity:x.quantity}))};
}
try{const saved=localStorage.getItem(key);if(saved)state=validate(JSON.parse(saved));}catch(e){$('save-status').textContent='Não foi possível recuperar o projeto anterior.';}
function persist(){try{localStorage.setItem(key,JSON.stringify(state));$('save-status').textContent='Salvo automaticamente neste navegador';}catch(e){$('save-status').textContent='Armazenamento indisponível. Exporte seu projeto.';}}
function diameters(){
 $('diameter').innerHTML=HYDRAULIC_DATA.diameters.map((v,i)=>`<option value="${i}">${state.unit==='mm'?`DN ${dn[i]}`:esc(v)}</option>`).join('');$('diameter').value=state.diameter;
 $('dn-note').textContent=state.unit==='mm'?'DN é uma designação nominal, não uma conversão exata em mm.':'O diâmetro se aplica a todos os itens adicionados.';
}
function components(){
 $('component').innerHTML=HYDRAULIC_DATA.components.filter(c=>c.material===$('material').value).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');unitValue();
}
function unitValue(){const c=HYDRAULIC_DATA.components.find(c=>c.id===$('component').value);if(!c)return;
 $('unit-value').textContent=fmt(c.values[state.diameter])+' m';const straight=c.name==='Trecho Reto';$('quantity-label').textContent=straight?'Comprimento real (m)':'Quantidade de peças';$('quantity').step=straight?'any':'1';$('quantity').min=straight?'0.001':'1';}
function render(){
 const r=calculate(state.items,state.diameter,HYDRAULIC_DATA);
 $('total').textContent=fmt(r.total);$('accessory-total').textContent=fmt(r.accessories);$('straight-total').textContent=fmt(r.straight);$('diameter-summary').textContent=`Diâmetro ${HYDRAULIC_DATA.diameters[state.diameter]} · DN ${dn[state.diameter]}`;$('count').textContent=`${state.items.length} ${state.items.length===1?'item':'itens'} na tubulação`;
 $('empty').hidden=!!r.lines.length;$('clear').disabled=!r.lines.length;
 $('items').innerHTML=r.lines.map((l,i)=>`<tr><td><strong>${esc(l.component.name)}</strong><small>${esc(l.component.material)}${l.isStraight?' · comprimento em metros':''}</small></td><td data-label="Qtd. / metros"><input aria-label="${esc(l.isStraight?'Comprimento':'Quantidade')} de ${esc(l.component.name)} ${esc(l.component.material)}" data-index="${i}" type="number" min="${l.isStraight?'0.001':'1'}" max="1000000" step="${l.isStraight?'any':'1'}" value="${l.quantity}"></td><td data-label="Unitário (m)">${fmt(l.unit)}</td><td data-label="Total (m)">${fmt(l.total)}</td><td><button class="remove" data-remove="${i}" aria-label="Remover ${esc(l.component.name)}">×</button></td></tr>`).join('');unitValue();persist();
}
function error(e){$('error').textContent=e?e.message:'';}
function add(){try{error(null);const quantity=Number($('quantity').value),id=$('component').value;
 const candidate=[...state.items.map(x=>({...x}))];const existing=candidate.find(x=>x.id===id);if(existing)existing.quantity+=quantity;else candidate.push({id,quantity});
 // Validate the new input independently so a negative value cannot reduce an existing row.
 calculate([{id,quantity}],state.diameter,HYDRAULIC_DATA);calculate(candidate,state.diameter,HYDRAULIC_DATA);if(candidate.length>500)throw Error('Limite de 500 itens por projeto.');state.items=candidate;render();}catch(e){error(e);}}
 $('add').onclick=add;$('quantity').onkeydown=e=>{if(e.key==='Enter')add();};
 $('material').onchange=components;$('component').onchange=unitValue;
 $('unit').onchange=()=>{state.unit=$('unit').value;diameters();render();};
 $('diameter').onchange=()=>{state.diameter=Number($('diameter').value);render();};
 $('project').oninput=()=>{state.project=$('project').value;persist();};
 $('items').onchange=e=>{if(!e.target.matches('input[data-index]'))return;try{const items=state.items.map(x=>({...x}));items[Number(e.target.dataset.index)].quantity=Number(e.target.value);calculate(items,state.diameter,HYDRAULIC_DATA);state.items=items;error(null);render();}catch(err){error(err);render();}};
 $('items').onclick=e=>{const b=e.target.closest('[data-remove]');if(b){state.items.splice(Number(b.dataset.remove),1);render();}};
 $('clear').onclick=()=>{if(confirm('Remover todos os componentes desta tubulação?')){state.items=[];error(null);render();}};
 $('example').onclick=()=>{if(state.items.length&&!confirm('Substituir a composição atual pelo exemplo?'))return;
 state={version:1,project:'Exemplo · Tubulação de 3/4 polegada',diameter:3,unit:'in',items:[{id:'44',quantity:1},{id:'2',quantity:5},{id:'54',quantity:2},{id:'64',quantity:10.7}]};$('project').value=state.project;$('unit').value=state.unit;diameters();error(null);render();};
 function download(name,text){const url=URL.createObjectURL(new Blob([text],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 $('export').onclick=()=>download('projeto-comprimento-equivalente.json',JSON.stringify(state,null,2));$('import').onclick=()=>$('file').click();
 $('file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>1000000)throw Error('O arquivo deve ter até 1 MB.');const next=validate(JSON.parse(await file.text()));if(state.items.length&&!confirm('Substituir o projeto atual pelo arquivo importado?'))return;state=next;$('project').value=state.project;$('unit').value=state.unit;diameters();error(null);render();}catch(err){error(new Error('Não foi possível importar: '+err.message));}finally{e.target.value='';}};
 function report(){const r=calculate(state.items,state.diameter,HYDRAULIC_DATA);$('report').innerHTML=`<p>CALCULADORA DE COMPRIMENTO EQUIVALENTE · FENÔMENOS DE TRANSPORTE</p><h1>Memorial de cálculo</h1><h2>${esc(state.project||'Projeto sem título')}</h2><p>Emitido em ${new Date().toLocaleString('pt-BR')}<br>Diâmetro nominal: ${esc(HYDRAULIC_DATA.diameters[state.diameter])} / DN ${dn[state.diameter]}<br>Todos os comprimentos equivalentes estão em metros.</p><table><thead><tr><th>Componente</th><th>Material</th><th>Quantidade / m</th><th>Unitário (m)</th><th>Equivalente (m)</th></tr></thead><tbody>${r.lines.map(l=>`<tr><td>${esc(l.component.name)}</td><td>${esc(l.component.material)}</td><td>${esc(l.quantity.toLocaleString('pt-BR',{maximumFractionDigits:6}))}${l.isStraight?' m':''}</td><td data-label="Unitário (m)">${fmt(l.unit)}</td><td data-label="Total (m)">${fmt(l.total)}</td></tr>`).join('')}</tbody></table><p>Acessórios: ${fmt(r.accessories)} m · Trechos retos: ${fmt(r.straight)} m</p><p class="report-total">Comprimento total equivalente: ${fmt(r.total)} m</p><h2>Método e rastreabilidade</h2><p>L equivalente = Σ (quantidade × comprimento equivalente unitário). Trechos retos são adicionados em metros. O cálculo mantém a precisão original; a exibição é arredondada para duas casas decimais.</p><p>Fonte: ${esc(HYDRAULIC_DATA.source)}. Valores preservados da planilha, sem interpolação. Metal é a classificação original da fonte. DN é designação nominal, sem representar diâmetro interno ou conversão exata em mm.</p><p>Este resultado é comprimento equivalente, não perda de pressão. Para obter a perda de carga em mca ou Pa são necessários os dados de escoamento e um modelo de perda distribuída. Confira os valores tabelados para a aplicação pretendida.</p>`;window.print();}
 $('print-top').onclick=report;$('print-bottom').onclick=report;
 $('project').value=state.project;$('unit').value=state.unit;diameters();components();render();
