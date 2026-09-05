
const DB_NAME="money-manager-premium", DB_VERSION=1, STORE="state";
const COLORS=["#2D8A61","#3FB27D","#52B788","#74C69D","#1B5B40","#3A86FF","#F4A261","#E76F51","#9D4EDD","#E63946","#0077B6","#B08968"];
const money=n=>Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>crypto?.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36);
const $=s=>document.querySelector(s);
const page=document.body.dataset.page;

function db(){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open(DB_NAME,DB_VERSION);
  r.onupgradeneeded=()=>r.result.createObjectStore(STORE);
  r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
 });
}
async function load(){
 try{const d=await db(); return await new Promise((res,rej)=>{const q=d.transaction(STORE).objectStore(STORE).get("app");q.onsuccess=()=>res(q.result||{budget:null,history:[]});q.onerror=()=>rej(q.error)})}
 catch(e){try{return JSON.parse(localStorage.getItem("money-manager-state")||'{"budget":null,"history":[]}')}catch{return {budget:null,history:[]}}}
}
async function save(state){
 try{const d=await db();await new Promise((res,rej)=>{const q=d.transaction(STORE,"readwrite").objectStore(STORE).put(state,"app");q.onsuccess=res;q.onerror=()=>rej(q.error)})}
 catch(e){localStorage.setItem("money-manager-state",JSON.stringify(state))}
}
async function update(fn){const s=await load();fn(s);await save(s);return s}
function toast(msg){let x=$("#toast");if(!x){x=document.createElement("div");x.id="toast";x.className="toast";document.body.appendChild(x)}x.textContent=msg;x.hidden=false;clearTimeout(window.__toast);window.__toast=setTimeout(()=>x.hidden=true,1800)}
function nav(){
 document.querySelectorAll("[data-nav]").forEach(a=>{a.classList.toggle("active",a.dataset.nav===page)})
}
function go(path){location.href=path}
function fmtDate(d){return new Date(d).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}
function totals(b){const allocated=b?.types?.reduce((s,t)=>s+Number(t.allocated||0),0)||0;const spent=b?.types?.reduce((s,t)=>s+Number(t.spent||0),0)||0;return {allocated,spent,remaining:allocated-spent,pct:allocated?Math.min(100,spent/allocated*100):0}}
function shell(content){
 return `<div class="app"><div class="shell"><aside class="sidebar">
 <div class="brand"><span class="brand-mark">₿</span><span>Money Manager</span></div>
 <nav class="nav">
  <a href="dashboard.html" data-nav="dashboard">⌂ Dashboard</a>
  <a href="history.html" data-nav="history">◷ History</a>
  <a href="setup.html" data-nav="setup">＋ New budget</a>
 </nav><div class="sidebar-bottom">Your data stays on this device.<br>Offline-ready & privacy-first.</div>
 </aside><main class="main">${content}</main></div></div>`;
}
function statCard(label,value,note){return `<div class="card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></div>`}
function modal(title,body,actions){return `<div class="modal-backdrop" data-close><div class="modal"><div class="modal-head"><h3>${title}</h3><button class="icon-btn" data-close>×</button></div>${body}${actions?`<div class="modal-actions">${actions}</div>`:""}</div></div>`}

async function init(){
 const state=await load(); nav();
 if(!state.budget && page!=="setup"){go("setup.html");return}
 if(page==="dashboard") renderDashboard(state);
 if(page==="history") renderHistory(state);
 if(page==="category") renderCategory(state);
 if(page==="setup") renderSetup(state);
 bindCommon();
}
function bindCommon(){
 document.addEventListener("click",async e=>{
  const close=e.target.closest("[data-close]"); if(close && (e.target===close || e.target.dataset.close!==undefined)){document.querySelector(".modal-backdrop")?.remove();return}
  const action=e.target.closest("[data-action]")?.dataset.action;
  if(!action)return;
  if(action==="newBudget")go("setup.html");
  if(action==="dashboard")go("dashboard.html");
  if(action==="history")go("history.html");
  if(action==="deleteExpense"){const typeId=e.target.closest("[data-action]").dataset.type,expId=e.target.closest("[data-action]").dataset.exp;await update(s=>{const t=s.budget.types.find(x=>x.id===typeId);const ex=t.expenses.find(x=>x.id===expId);if(ex){t.spent=Math.max(0,t.spent-Number(ex.amount));t.expenses=t.expenses.filter(x=>x.id!==expId)}});location.reload()}
  if(action==="deleteType"){const id=e.target.closest("[data-action]").dataset.id;await update(s=>s.budget.types=s.budget.types.filter(t=>t.id!==id));go("dashboard.html")}
  if(action==="confirmEnd"){const s=await load();document.body.insertAdjacentHTML("beforeend",modal("Close this budget?","<p class='muted'>The current budget will be saved permanently in history. You can start a fresh budget afterward.</p>",`<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-action="endBudget">Close & archive</button>`))}
  if(action==="endBudget"){await update(s=>{const t=totals(s.budget);s.history.unshift({id:s.budget.id,name:s.budget.name,startDate:s.budget.startDate,closedDate:new Date().toISOString(),...t,types:s.budget.types.map(x=>({name:x.name,color:x.color,allocated:x.allocated,spent:x.spent}))});s.budget=null});go("setup.html")}
  if(action==="confirmDelete"){const id=e.target.closest("[data-action]").dataset.id;document.body.insertAdjacentHTML("beforeend",modal("Delete category?","<p class='muted'>This removes the category and all expenses inside it. This cannot be undone.</p>",`<button class="btn" data-close>Cancel</button><button class="btn btn-danger" data-action="deleteType" data-id="${id}">Delete category</button>`))}
  if(action==="editType"){openEdit(e.target.closest("[data-action]").dataset.id)}
  if(action==="addExpense"){openExpense(e.target.closest("[data-action]").dataset.id)}
  if(action==="openCategory"){go("category.html?id="+encodeURIComponent(e.target.closest("[data-action]").dataset.id))}
 });
}
function openExpense(typeId){
 const s=window.__state;const t=s.budget.types.find(x=>x.id===typeId);
 document.body.insertAdjacentHTML("beforeend",modal("Add expense",`<div class="field"><label class="label">Amount</label><input class="input" id="m-amount" type="number" min="0.01" step="0.01" inputmode="decimal" autofocus></div><div class="field"><label class="label">Note <span class="muted">(optional)</span></label><input class="input" id="m-note" placeholder="e.g. Petrol refill"></div>`,`<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-modal-add="${typeId}">Add expense</button>`));
 document.querySelector("[data-modal-add]")?.addEventListener("click",async()=>{const amount=Number($("#m-amount").value),note=$("#m-note").value.trim();if(!(amount>0)){toast("Enter a valid amount");return}await update(s=>{const t=s.budget.types.find(x=>x.id===typeId);t.spent=Number(t.spent||0)+amount;t.expenses.unshift({id:uid(),amount,note,date:new Date().toISOString()})});document.querySelector(".modal-backdrop")?.remove();location.reload()})
}
function openEdit(typeId){
 const s=window.__state,t=s.budget.types.find(x=>x.id===typeId);
 document.body.insertAdjacentHTML("beforeend",modal("Edit category",`<div class="field"><label class="label">Name</label><input class="input" id="m-name" value="${esc(t.name)}"></div><div class="field"><label class="label">Allocated amount</label><input class="input" id="m-allocated" type="number" min="0" step="0.01" value="${t.allocated}"></div><div class="field"><label class="label">Color</label><div class="color-palette">${COLORS.map(c=>`<button class="swatch ${c===t.color?"selected":""}" style="background:${c}" data-color-pick="${c}"></button>`).join("")}</div></div>`,`<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-modal-save="${typeId}">Save changes</button>`));
 let color=t.color;document.querySelectorAll("[data-color-pick]").forEach(b=>b.onclick=()=>{color=b.dataset.colorPick;document.querySelectorAll("[data-color-pick]").forEach(x=>x.classList.toggle("selected",x===b))});
 document.querySelector("[data-modal-save]")?.addEventListener("click",async()=>{const name=$("#m-name").value.trim(),allocated=Number($("#m-allocated").value);if(!name||allocated<0){toast("Check the category details");return}await update(s=>Object.assign(s.budget.types.find(x=>x.id===typeId),{name,allocated,color}));document.querySelector(".modal-backdrop")?.remove();location.reload()})
}
function renderDashboard(s){
 window.__state=s;const b=s.budget,t=totals(b);const content=`<div class="topbar"><div><div class="eyebrow">Current budget</div><h1 class="page-title">${esc(b.name)}</h1><div class="page-subtitle">Started ${fmtDate(b.startDate)}</div></div><div class="actions"><button class="btn optional" data-action="history">View history</button><button class="btn btn-primary" data-action="newBudget">New month</button></div></div>
 <section class="hero"><div class="hero-row"><div><div class="eyebrow" style="color:#9fc4b1">Remaining</div><h2>$${money(t.remaining)}</h2><p>$${money(t.spent)} spent from $${money(t.allocated)} allocated</p></div><div class="hero-amount">${t.pct.toFixed(0)}%</div></div><div class="progress"><i style="width:${t.pct}%"></i></div></section>
 <div class="grid grid-3" style="margin-top:16px">${statCard("Total allocated","$"+money(t.allocated),"Across all categories")}${statCard("Total spent","$"+money(t.spent),"Recorded expenses")}${statCard("Available","$"+money(t.remaining),t.remaining<0?"Over budget":"Still available")}</div>
 <div class="section-head"><div class="section-title">Categories</div><button class="btn btn-primary" data-action="newBudget">＋ Manage budget</button></div>
 <div class="category-list">${b.types.length?b.types.map(catCard).join(""):`<div class="empty" style="grid-column:1/-1">No categories yet.</div>`}</div>
 <div class="section-head"><div class="section-title">Finish month</div></div><div class="card"><div class="row" style="align-items:center;justify-content:space-between"><div><b>Archive this budget</b><div class="muted" style="font-size:12px;margin-top:4px">Save it to history and start a clean month.</div></div><button class="btn btn-danger" data-action="confirmEnd">End & archive</button></div></div>`;
 document.querySelector(".main").innerHTML=content;nav();
}
function catCard(t){const pct=t.allocated?Math.min(100,t.spent/t.allocated*100):0,over=t.spent>t.allocated;return `<div class="category" data-action="openCategory" data-id="${t.id}"><div class="cat-head"><div class="cat-name"><span class="dot" style="background:${t.color}"></span>${esc(t.name)}</div><button class="icon-btn" data-action="addExpense" data-id="${t.id}" style="width:34px;height:34px">＋</button></div><div class="cat-amounts"><span>$${money(t.spent)} / $${money(t.allocated)}</span><span class="cat-left" style="color:${over?"var(--danger)":"var(--green-700)"}">$${money(t.allocated-t.spent)} left</span></div><div class="bar"><i style="width:${pct}%;background:${over?"var(--danger)":t.color}"></i></div></div>`}
function renderHistory(s){
 const total=s.history.reduce((a,h)=>a+Number(h.remaining||0),0);
 document.querySelector(".main").innerHTML=`<div class="topbar"><div><div class="eyebrow">Archive</div><h1 class="page-title">Budget history</h1><div class="page-subtitle">Every closed month, kept locally on this device.</div></div><button class="btn btn-primary" data-action="newBudget">＋ New budget</button></div>
 <div class="grid grid-3">${statCard("Closed budgets",s.history.length,"Archived months")}${statCard("Total allocated","$"+money(s.history.reduce((a,h)=>a+h.allocated,0)),"All archived budgets")}${statCard("Net remaining","$"+money(total),"Across closed months")}</div>
 <div class="section-head"><div class="section-title">Past budgets</div></div>
 <div class="grid">${s.history.length?s.history.map(h=>`<div class="card history-item"><div><div class="history-title">${esc(h.name)}</div><div class="muted" style="font-size:12px;margin-top:5px">Closed ${fmtDate(h.closedDate)}</div><div class="chips">${h.types.map(t=>`<span class="chip" style="background:${t.color}18;color:${t.color}">${esc(t.name)}</span>`).join("")}</div></div><div style="text-align:right"><div class="muted" style="font-size:11px">Remaining</div><b style="font-size:20px;color:${h.remaining<0?"var(--danger)":"var(--green-700)"}">$${money(h.remaining)}</b></div></div>`).join(""):`<div class="empty">No archived budgets yet.<br>End your current month to create the first entry.</div>`}</div>`;nav();
}
function renderCategory(s){
 window.__state=s;const id=new URLSearchParams(location.search).get("id"),t=s.budget?.types.find(x=>x.id===id);if(!t){go("dashboard.html");return}
 const pct=t.allocated?Math.min(100,t.spent/t.allocated*100):0,remaining=t.allocated-t.spent;
 document.querySelector(".main").innerHTML=`<div class="topbar"><div><div class="eyebrow">Category</div><h1 class="page-title"><span class="dot" style="background:${t.color}"></span>${esc(t.name)}</h1><div class="page-subtitle">Detailed expense tracking</div></div><div class="actions"><button class="btn optional" data-action="dashboard">← Dashboard</button><button class="btn" data-action="editType" data-id="${t.id}">Edit</button></div></div>
 <div class="grid grid-3">${statCard("Allocated","$"+money(t.allocated),"Category budget")}${statCard("Spent","$"+money(t.spent),"Recorded expenses")}${statCard("Remaining","$"+money(remaining),remaining<0?"Over budget":"Available")}</div>
 <div class="card" style="margin-top:16px"><div class="section-title">Budget usage</div><div class="bar" style="height:9px;margin-top:14px"><i style="width:${pct}%;background:${remaining<0?"var(--danger)":t.color}"></i></div><div class="muted" style="font-size:12px;margin-top:8px">${pct.toFixed(0)}% used</div></div>
 <div class="section-head"><div class="section-title">Expense history</div><button class="btn btn-primary" data-action="addExpense" data-id="${t.id}">＋ Add expense</button></div>
 <div class="card" style="padding:7px 15px">${t.expenses.length?`<table class="table"><thead><tr><th>Amount</th><th>Note</th><th>Date</th><th></th></tr></thead><tbody>${t.expenses.map(e=>`<tr><td><b>$${money(e.amount)}</b></td><td>${esc(e.note||"—")}</td><td>${fmtDate(e.date)}</td><td style="text-align:right"><button class="icon-btn" data-action="deleteExpense" data-type="${t.id}" data-exp="${e.id}">×</button></td></tr>`).join("")}</tbody></table>`:`<div class="empty" style="margin:8px">No expenses recorded yet.</div>`}</div>
 <div style="margin-top:18px"><button class="btn btn-danger" data-action="confirmDelete" data-id="${t.id}">Delete category</button></div>`;nav();
}
function renderSetup(s){
 const previous=s.history?.[0];const rows=window.__setupRows||(previous?.types?.length?previous.types.map(t=>({name:t.name,allocated:String(t.allocated),color:t.color})): [{name:"Food",allocated:"",color:COLORS[6]},{name:"Transport",allocated:"",color:COLORS[5]},{name:"Household",allocated:"",color:COLORS[0]}]);
 window.__setupRows=rows;
 document.querySelector(".main").innerHTML=`<div class="setup-wrap"><div class="setup-logo">₿</div><div class="eyebrow" style="margin-top:20px">Budget setup</div><h1 class="setup-title">${s.budget?"Create another budget":"Take control of your money."}</h1><p class="setup-copy">Create a clean monthly plan, divide it into categories, and record expenses as they happen. Everything is stored locally for offline use.</p>
 <div class="card form"><div class="field"><label class="label">Budget name</label><input class="input" id="setup-name" value="${esc(window.__setupName||(previous?.name?previous.name.replace(/\b\d{4}\b/,""):""))}" placeholder="e.g. September 2026"></div>
 <div class="section-head" style="margin-top:5px"><div class="section-title">Categories</div><div class="muted" id="setup-total">$0.00</div></div>
 <div id="setup-rows">${rows.map((r,i)=>setupRow(r,i)).join("")}</div><button class="btn" id="add-row" style="width:100%">＋ Add category</button><button class="btn btn-primary" id="start-budget" style="width:100%;margin-top:10px">Start budget →</button></div></div>`;
 updateSetupTotal();bindSetup();
}
function setupRow(r,i){return `<div class="category-row"><input class="color-input" type="color" value="${r.color}" data-color="${i}"><input class="input" data-name="${i}" value="${esc(r.name)}" placeholder="Category name"><input class="input" data-amount="${i}" value="${esc(r.allocated)}" type="number" min="0" step="0.01" placeholder="Amount"><button class="icon-btn" data-remove="${i}">×</button></div>`}
function updateSetupTotal(){let total=window.__setupRows.reduce((a,r)=>a+Number(r.allocated||0),0);$("#setup-total").textContent="$"+money(total)}
function bindSetup(){
 document.querySelectorAll("[data-name]").forEach(x=>x.oninput=()=>{window.__setupRows[+x.dataset.name].name=x.value});
 document.querySelectorAll("[data-amount]").forEach(x=>x.oninput=()=>{window.__setupRows[+x.dataset.amount].allocated=x.value;updateSetupTotal()});
 document.querySelectorAll("[data-color]").forEach(x=>x.oninput=()=>window.__setupRows[+x.dataset.color].color=x.value);
 document.querySelectorAll("[data-remove]").forEach(x=>x.onclick=()=>{window.__setupRows.splice(+x.dataset.remove,1);renderSetup(window.__state);});
 $("#add-row").onclick=()=>{window.__setupRows.push({name:"",allocated:"",color:COLORS[window.__setupRows.length%COLORS.length]});renderSetup(window.__state)};
 $("#start-budget").onclick=async()=>{const name=$("#setup-name").value.trim();const rows=window.__setupRows.filter(r=>r.name.trim()&&Number(r.allocated)>0);if(!name||!rows.length){toast("Add a name and at least one category");return}await update(s=>{s.budget={id:uid(),name,startDate:new Date().toISOString(),types:rows.map(r=>({id:uid(),name:r.name.trim(),color:r.color,allocated:Number(r.allocated),spent:0,expenses:[]}))}});window.__setupRows=null;go("dashboard.html")};
}
init();

if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(()=>{}));
