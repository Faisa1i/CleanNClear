const KEY="clean_n_clear_accounts_v4";
const BUSINESS={name:"Clean N Clear",mobile:"8766791763",address:"Jamiya Masjid Road, Opp Ambarkhane, Bijapur, Karnataka - 586101"};
const blankDB={products:[],sales:[],purchases:[],expenses:[],dues:[]};
let db=JSON.parse(localStorage.getItem(KEY)||JSON.stringify(blankDB));
db.products??=[];db.sales??=[];db.purchases??=[];db.expenses??=[];db.dues??=[];
const today=new Date().toISOString().slice(0,10);
const navItems=[["dashboard","🏠 Dashboard"],["products","📦 Products"],["sales","🧾 Sales"],["purchases","🛒 Purchases"],["expenses","💸 Expenses"],["reports","📈 Reports"],["stock","📊 Stock"],["dues","👥 Dues"],["backup","⚙️ Backup"]];
nav.innerHTML=navItems.map(x=>`<button id="nav-${x[0]}" onclick="show('${x[0]}')">${x[1]}</button>`).join("");
["sDate","pDate","eDate"].forEach(id=>{const e=document.getElementById(id);if(e)e.value=today;});
let saleItems=[],editingInvoiceId=null;
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2)}
function save(){localStorage.setItem(KEY,JSON.stringify(db));render()}
function money(v){return "₹"+Number(v||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function show(id){document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));document.getElementById(id)?.classList.add("active");document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));document.getElementById("nav-"+id)?.classList.add("active");render()}

/* PRODUCTS */
function productById(id){return db.products.find(p=>p.id===id)}
function resetProductForm(){prodId.value="";prodName.value="";prodCategory.value="";prodUnit.value="PCS";prodPurchaseRate.value=0;prodSaleRate.value=0;prodOpeningStock.value=0;productSaveBtn.textContent="💾 Save Product"}
productForm.addEventListener("submit",e=>{e.preventDefault();const id=prodId.value||uid();const p={id,name:prodName.value.trim(),category:prodCategory.value.trim(),unit:prodUnit.value,purchaseRate:+prodPurchaseRate.value||0,saleRate:+prodSaleRate.value||0,openingStock:+prodOpeningStock.value||0};const i=db.products.findIndex(x=>x.id===id);if(i>=0)db.products[i]=p;else db.products.push(p);resetProductForm();save()});
function editProduct(id){const p=productById(id);if(!p)return;prodId.value=p.id;prodName.value=p.name;prodCategory.value=p.category;prodUnit.value=p.unit;prodPurchaseRate.value=p.purchaseRate;prodSaleRate.value=p.saleRate;prodOpeningStock.value=p.openingStock;productSaveBtn.textContent="✏️ Update Product";show("products")}
function deleteProduct(id){const used=db.sales.some(s=>(s.items||[]).some(i=>i.productId===id))||db.purchases.some(p=>p.productId===id);if(used){alert("This product is already used in Sales/Purchases and cannot be deleted.");return}if(confirm("Delete this product?")){db.products=db.products.filter(p=>p.id!==id);save()}}
function renderProducts(){const q=(productSearch.value||"").toLowerCase();const list=db.products.filter(p=>(p.name+" "+p.category+" "+p.unit).toLowerCase().includes(q));productCount.textContent=`${db.products.length} Product${db.products.length===1?"":"s"}`;productBody.innerHTML=list.map(p=>`<tr><td><b>${esc(p.name)}</b></td><td>${esc(p.category)}</td><td>${esc(p.unit)}</td><td>${money(p.purchaseRate)}</td><td>${money(p.saleRate)}</td><td>${p.openingStock}</td><td><button class="btn small secondary" onclick="editProduct('${p.id}')">✏️</button> <button class="btn small danger" onclick="deleteProduct('${p.id}')">🗑</button></td></tr>`).join("")}

/* SEARCH PRODUCT */
function searchSaleProducts(){const q=(sProductSearch.value||"").trim().toLowerCase();if(!q){sProductResults.style.display="none";return}const results=db.products.filter(p=>(p.name+" "+p.category+" "+p.unit).toLowerCase().includes(q)).slice(0,15);sProductResults.innerHTML=results.length?results.map(p=>`<div class="product-result" onclick="selectSaleProduct('${p.id}')"><strong>${esc(p.name)}</strong><small>${esc(p.category||"Product")} • ${esc(p.unit)} • Sale ${money(p.saleRate)}</small></div>`).join(""):`<div class="product-result"><strong>No product found</strong><small>Add it in Products tab first.</small></div>`;sProductResults.style.display="block"}
function selectSaleProduct(id){const p=productById(id);if(!p)return;sProduct.value=id;sProductSearch.value=p.name;sRate.value=p.saleRate||0;selectedProductInfo.textContent=`${p.name} • ${p.unit} • Sale Rate ${money(p.saleRate)}`;sProductResults.style.display="none";sQty.focus()}
sProductSearch.addEventListener("input",searchSaleProducts);
document.addEventListener("click",e=>{if(!document.querySelector(".item-product-field")?.contains(e.target))sProductResults.style.display="none"});


/* ================= DATE-BASED BILL NUMBER ================= */
const MONTH_CODES=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function billPrefixFromDate(dateValue){
    if(!dateValue) return "CNC/";
    const d=new Date(dateValue+"T00:00:00");
    if(Number.isNaN(d.getTime())) return "CNC/";
    return `CNC/${MONTH_CODES[d.getMonth()]}${String(d.getDate()).padStart(2,"0")}/`;
}

function nextBillNumber(dateValue, ignoreId=null){
    const prefix=billPrefixFromDate(dateValue);
    let max=0;
    db.sales.forEach(inv=>{
        if(ignoreId && inv.id===ignoreId) return;
        const bill=String(inv.bill||"");
        if(bill.toUpperCase().startsWith(prefix)){
            const n=parseInt(bill.slice(prefix.length),10);
            if(Number.isFinite(n)) max=Math.max(max,n);
        }
    });
    return prefix+String(max+1).padStart(3,"0");
}

function updateBillNumberFromDate(force=true){
    if(!sDate.value) return;
    if(force || !sBill.value.trim()){
        sBill.value=nextBillNumber(sDate.value, editingInvoiceId);
    }
}

sDate.addEventListener("change",()=>updateBillNumberFromDate(true));

function setInitialBillNumber(){
    if(!editingInvoiceId && sDate.value){
        sBill.value=nextBillNumber(sDate.value);
    }
}

/* MULTI-ITEM INVOICE */
function addSaleItem(){const p=productById(sProduct.value);if(!p){alert("Search and select a product first.");sProductSearch.focus();return}const qty=+sQty.value,rate=+sRate.value;if(!qty||qty<=0){alert("Enter a valid quantity.");return}if(rate<0||Number.isNaN(rate)){alert("Enter a valid rate.");return}const existing=saleItems.find(i=>i.productId===p.id&&i.rate===rate);if(existing){existing.qty+=qty;existing.amount=existing.qty*existing.rate}else saleItems.push({id:uid(),productId:p.id,product:p.name,unit:p.unit,qty,rate,amount:qty*rate});clearSaleProductEntry();renderSaleItems()}
function clearSaleProductEntry(){sProduct.value="";sProductSearch.value="";sQty.value=1;sRate.value="";selectedProductInfo.textContent="No product selected";sProductResults.style.display="none"}
function removeSaleItem(id){saleItems=saleItems.filter(i=>i.id!==id);renderSaleItems()}
function editSaleItem(id){const i=saleItems.find(x=>x.id===id);if(!i)return;selectSaleProduct(i.productId);sQty.value=i.qty;sRate.value=i.rate;removeSaleItem(id)}
function saleTotal(){return saleItems.reduce((s,i)=>s+(+i.amount||0),0)}
function renderSaleItems(){saleItemCount.textContent=`${saleItems.length} Item${saleItems.length===1?"":"s"}`;saleGrandTotal.textContent=money(saleTotal());saleItemsBody.innerHTML=saleItems.map((i,n)=>`<tr><td>${n+1}</td><td><b>${esc(i.product)}</b><br><small>${esc(i.unit)}</small></td><td>${i.qty}</td><td>${money(i.rate)}</td><td>${money(i.amount)}</td><td><button type="button" class="btn small secondary" onclick="editSaleItem('${i.id}')">✏️</button> <button type="button" class="btn small danger" onclick="removeSaleItem('${i.id}')">🗑</button></td></tr>`).join("")}

/* SAVE / EDIT / PRINT */
salesForm.addEventListener("submit",e=>{e.preventDefault();if(!saleItems.length){alert("Add at least one product to the invoice.");return}if(!sBill.value.trim()){alert("Enter Bill No.");return}const invoice={id:editingInvoiceId||uid(),date:sDate.value,bill:sBill.value.trim(),customer:sCustomer.value.trim()||"Cash",items:saleItems.map(i=>({...i})),amount:saleTotal()};const i=db.sales.findIndex(x=>x.id===invoice.id);if(i>=0)db.sales[i]=invoice;else db.sales.push(invoice);clearSaleForm();save();show("sales")});
function loadInvoiceForEdit(id){const inv=db.sales.find(x=>x.id===id);if(!inv)return;editingInvoiceId=inv.id;sDate.value=inv.date;sBill.value=inv.bill;sCustomer.value=inv.customer;saleItems=(inv.items||[]).map(i=>({...i}));renderSaleItems();document.querySelector(".invoice-builder-card").classList.add("invoice-editing");document.querySelector("#salesForm .btn.primary").textContent="✏️ Update Invoice";window.scrollTo({top:0,behavior:"smooth"})}
function clearSaleForm(){editingInvoiceId=null;saleItems=[];sDate.value=today;sBill.value="";sCustomer.value="Cash";clearSaleProductEntry();renderSaleItems();document.querySelector(".invoice-builder-card")?.classList.remove("invoice-editing");document.querySelector("#salesForm .btn.primary").textContent="💾 Save Invoice";setInitialBillNumber()}
function deleteInvoice(id){if(!confirm("Delete this complete invoice?"))return;db.sales=db.sales.filter(x=>x.id!==id);if(editingInvoiceId===id)clearSaleForm();save()}
function printSavedInvoice(id){const inv=db.sales.find(x=>x.id===id);if(inv)printInvoice(inv)}
function printCurrentInvoice(){if(!saleItems.length){alert("Add at least one product first.");return}printInvoice({date:sDate.value,bill:sBill.value||"Draft",customer:sCustomer.value||"Cash",items:saleItems,amount:saleTotal()})}
function printInvoice(inv){const w=window.open("","_blank");if(!w){alert("Please allow pop-ups to print the invoice.");return}const rows=(inv.items||[]).map((i,n)=>`<tr><td>${n+1}</td><td>${esc(i.product)}</td><td>${i.qty} ${esc(i.unit)}</td><td>${money(i.rate)}</td><td>${money(i.amount)}</td></tr>`).join("");w.document.write(`<!doctype html><html><head><meta charset="UTF-8"><title>${esc(inv.bill)} - Clean N Clear</title><style>@page{size:A5 landscape;margin:8mm}body{font-family:Arial,sans-serif;color:#111;margin:0}.header{text-align:center;border-bottom:2px solid #111;padding-bottom:7px}.header h1{margin:0;font-size:24px}.mobile{font-size:13px;margin-top:3px}.address{font-size:11px;margin-top:3px}.meta{display:flex;justify-content:space-between;gap:10px;margin:10px 0;font-size:12px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #777;padding:5px}th{background:#f0f0f0}.total{text-align:right;font-size:16px;font-weight:bold;margin-top:10px}.footer{margin-top:16px;font-size:10px;text-align:center}</style></head><body><div class="header"><h1>${esc(BUSINESS.name)}</h1><div class="mobile">Mobile: ${esc(BUSINESS.mobile)}</div><div class="address">${esc(BUSINESS.address)}</div></div><div class="meta"><div><b>Bill No:</b> ${esc(inv.bill)}</div><div><b>Date:</b> ${esc(inv.date)}</div><div><b>Customer:</b> ${esc(inv.customer)}</div></div><table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="total">Grand Total: ${money(inv.amount)}</div><div class="footer">GST not charged.</div><script>window.onload=function(){window.print()}<\/script></body></html>`);w.document.close()}

/* PURCHASES */
pProduct.addEventListener("change",updatePurchaseAmount);pQty.addEventListener("input",updatePurchaseAmount);
function updatePurchaseAmount(){const p=productById(pProduct.value);if(p)pAmount.value=(p.purchaseRate*(+pQty.value||0)).toFixed(2)}
purchaseForm.addEventListener("submit",e=>{e.preventDefault();const p=productById(pProduct.value);if(!p){alert("Please select a product.");return}db.purchases.push({id:uid(),date:pDate.value,supplier:pSupplier.value,bill:pBill.value,productId:p.id,product:p.name,qty:+pQty.value,amount:+pAmount.value});e.target.reset();pDate.value=today;pQty.value=1;save()});

/* EXPENSES */
expenseForm.addEventListener("submit",e=>{e.preventDefault();db.expenses.push({id:uid(),date:eDate.value,name:eName.value,amount:+eAmount.value});e.target.reset();eDate.value=today;save()});

/* DUES */
dueForm.addEventListener("submit",e=>{e.preventDefault();db.dues.push({id:uid(),customer:dCustomer.value,bill:dBill.value,amount:+dAmount.value});e.target.reset();save()});

/* DELETE */
function del(type,id){if(!confirm("Delete this entry?"))return;db[type]=db[type].filter(x=>x.id!==id);save()}

/* RENDER */
function render(){
 const salesTotal=db.sales.reduce((s,x)=>s+(+x.amount||0),0),purchaseTotal=db.purchases.reduce((s,x)=>s+(+x.amount||0),0),expenseTotal=db.expenses.reduce((s,x)=>s+(+x.amount||0),0);
 mSales.textContent=money(salesTotal);mPurchase.textContent=money(purchaseTotal);mExpense.textContent=money(expenseTotal);mProfit.textContent=money(salesTotal-purchaseTotal-expenseTotal);mTurnover.textContent=money(salesTotal);
 const pct=Math.min(100,salesTotal/4000000*100);turnText.textContent=`${pct.toFixed(1)}% of ₹40 lakh`;bar.style.width=pct+"%";
 renderProducts();renderSaleItems();updateReportPreview();
 const invoices=[...db.sales].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 invoiceCount.textContent=`${invoices.length} Invoice${invoices.length===1?"":"s"}`;
 invoiceBody.innerHTML=invoices.map(inv=>`<tr><td>${esc(inv.date)}</td><td><b>${esc(inv.bill)}</b></td><td>${esc(inv.customer)}</td><td>${(inv.items||[]).length}</td><td>${money(inv.amount)}</td><td><button class="btn small secondary" onclick="loadInvoiceForEdit('${inv.id}')">✏️ Edit</button> <button class="btn small primary" onclick="printSavedInvoice('${inv.id}')">🖨 Print</button> <button class="btn small danger" onclick="deleteInvoice('${inv.id}')">🗑</button></td></tr>`).join("");
 salesBody.innerHTML=invoices.map(inv=>`<tr><td>${esc(inv.date)}</td><td>${esc(inv.bill)}</td><td>${esc(inv.customer)}</td><td>${(inv.items||[]).length} items</td><td>${money(inv.amount)}</td><td><button class="btn small secondary" onclick="loadInvoiceForEdit('${inv.id}')">✏️</button> <button class="btn small primary" onclick="printSavedInvoice('${inv.id}')">🖨</button> <button class="btn small danger" onclick="deleteInvoice('${inv.id}')">🗑</button></td></tr>`).join("");
 purchaseBody.innerHTML=db.purchases.map(i=>`<tr><td>${esc(i.date)}</td><td>${esc(i.supplier)}</td><td>${esc(i.bill)}</td><td>${esc(i.product)}</td><td>${i.qty}</td><td>${money(i.amount)}</td><td><button class="btn small danger" onclick="del('purchases','${i.id}')">🗑</button></td></tr>`).join("");
 expenseBody.innerHTML=db.expenses.map(i=>`<tr><td>${esc(i.date)}</td><td>${esc(i.name)}</td><td>${money(i.amount)}</td><td><button class="btn small danger" onclick="del('expenses','${i.id}')">🗑</button></td></tr>`).join("");
 dueBody.innerHTML=db.dues.map(i=>`<tr><td>${esc(i.customer)}</td><td>${esc(i.bill)}</td><td>${money(i.amount)}</td><td><button class="btn small danger" onclick="del('dues','${i.id}')">🗑</button></td></tr>`).join("");
 const stock=db.products.map(p=>{const purchased=db.purchases.filter(x=>x.productId===p.id).reduce((s,x)=>s+(+x.qty||0),0),sold=db.sales.flatMap(x=>x.items||[]).filter(x=>x.productId===p.id).reduce((s,x)=>s+(+x.qty||0),0);return{p,purchased,sold,current:(+p.openingStock||0)+purchased-sold}});
 stockBody.innerHTML=stock.map(x=>`<tr><td><b>${esc(x.p.name)}</b></td><td>${esc(x.p.unit)}</td><td>${x.p.openingStock}</td><td>${x.purchased}</td><td>${x.sold}</td><td><b>${x.current}</b></td><td>${money(x.current*x.p.saleRate)}</td></tr>`).join("");
}


/* ================= WEEKLY / MONTHLY EXCEL REPORT ================= */

function isoDate(d){
    return d.toISOString().slice(0,10);
}

function reportDates(){
    const selected=reportDate.value || today;
    const d=new Date(selected+"T00:00:00");
    let start,end;

    if(reportPeriod.value==="monthly"){
        start=new Date(d.getFullYear(),d.getMonth(),1);
        end=new Date(d.getFullYear(),d.getMonth()+1,0);
    }else{
        end=new Date(d);
        start=new Date(d);
        start.setDate(start.getDate()-6);
    }

    return {start:isoDate(start),end:isoDate(end)};
}

function getReportData(){
    const {start,end}=reportDates();

    const sales=db.sales.filter(x=>x.date>=start&&x.date<=end);
    const purchases=db.purchases.filter(x=>x.date>=start&&x.date<=end);
    const expenses=db.expenses.filter(x=>x.date>=start&&x.date<=end);

    return {start,end,sales,purchases,expenses};
}

function updateReportPreview(){
    if(!document.getElementById("reportPreview")) return;

    const {start,end,sales,purchases,expenses}=getReportData();

    const saleTotal=sales.reduce((s,x)=>s+(+x.amount||0),0);
    const purchaseTotal=purchases.reduce((s,x)=>s+(+x.amount||0),0);
    const expenseTotal=expenses.reduce((s,x)=>s+(+x.amount||0),0);

    reportRangeText.textContent =
        `${reportPeriod.value==="monthly"?"Monthly":"Weekly"} report: ${start} to ${end}`;

    reportPreview.innerHTML=`
      <div class="report-preview-grid">
        <div class="report-mini"><div class="rlabel">SALES</div><div class="rvalue">${money(saleTotal)}</div></div>
        <div class="report-mini"><div class="rlabel">PURCHASES</div><div class="rvalue">${money(purchaseTotal)}</div></div>
        <div class="report-mini"><div class="rlabel">EXPENSES</div><div class="rvalue">${money(expenseTotal)}</div></div>
      </div>

      <div class="table-scroll">
      <table class="report-table">
        <thead>
          <tr><th>Date</th><th>Type</th><th>Bill / Ref</th><th>Party</th><th>Details</th><th>Amount</th></tr>
        </thead>
        <tbody>
          ${sales.map(x=>`<tr><td>${esc(x.date)}</td><td>Sale</td><td>${esc(x.bill)}</td><td>${esc(x.customer)}</td><td>${(x.items||[]).length} item(s)</td><td>${money(x.amount)}</td></tr>`).join("")}
          ${purchases.map(x=>`<tr><td>${esc(x.date)}</td><td>Purchase</td><td>${esc(x.bill)}</td><td>${esc(x.supplier)}</td><td>${esc(x.product)} × ${x.qty}</td><td>${money(x.amount)}</td></tr>`).join("")}
          ${expenses.map(x=>`<tr><td>${esc(x.date)}</td><td>Expense</td><td>—</td><td>—</td><td>${esc(x.name)}</td><td>${money(x.amount)}</td></tr>`).join("")}
        </tbody>
      </table>
      </div>`;
}

function xlsEscape(v){
    return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function xlsMoney(v){
    return Number(v||0).toFixed(2);
}

function downloadExcelReport(){
    const {start,end,sales,purchases,expenses}=getReportData();
    const period=reportPeriod.value==="monthly"?"Monthly":"Weekly";

    const saleTotal=sales.reduce((s,x)=>s+(+x.amount||0),0);
    const purchaseTotal=purchases.reduce((s,x)=>s+(+x.amount||0),0);
    const expenseTotal=expenses.reduce((s,x)=>s+(+x.amount||0),0);

    let rows=`
      <tr class="title"><th colspan="6">${xlsEscape(BUSINESS.name)} — ${period} Report</th></tr>
      <tr><td colspan="6">Period: ${xlsEscape(start)} to ${xlsEscape(end)}</td></tr>
      <tr><td colspan="6">Mobile: ${xlsEscape(BUSINESS.mobile)}</td></tr>
      <tr><td colspan="6">Address: ${xlsEscape(BUSINESS.address)}</td></tr>
      <tr class="head"><th>Date</th><th>Type</th><th>Bill / Ref</th><th>Party</th><th>Details</th><th>Amount</th></tr>`;

    sales.forEach(x=>{
        rows+=`<tr><td>${xlsEscape(x.date)}</td><td>Sale</td><td>${xlsEscape(x.bill)}</td><td>${xlsEscape(x.customer)}</td><td>${xlsEscape((x.items||[]).map(i=>i.product+" x "+i.qty).join(", "))}</td><td>${xlsMoney(x.amount)}</td></tr>`;
    });

    purchases.forEach(x=>{
        rows+=`<tr><td>${xlsEscape(x.date)}</td><td>Purchase</td><td>${xlsEscape(x.bill)}</td><td>${xlsEscape(x.supplier)}</td><td>${xlsEscape(x.product+" x "+x.qty)}</td><td>${xlsMoney(x.amount)}</td></tr>`;
    });

    expenses.forEach(x=>{
        rows+=`<tr><td>${xlsEscape(x.date)}</td><td>Expense</td><td>—</td><td>—</td><td>${xlsEscape(x.name)}</td><td>${xlsMoney(x.amount)}</td></tr>`;
    });

    rows+=`
      <tr class="total"><td colspan="5">Total Sales</td><td>${xlsMoney(saleTotal)}</td></tr>
      <tr class="total"><td colspan="5">Total Purchases</td><td>${xlsMoney(purchaseTotal)}</td></tr>
      <tr class="total"><td colspan="5">Total Expenses</td><td>${xlsMoney(expenseTotal)}</td></tr>
      <tr class="total"><td colspan="5">Net Position (Sales − Purchase − Expense)</td><td>${xlsMoney(saleTotal-purchaseTotal-expenseTotal)}</td></tr>`;

    const doc=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      body{font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #999;padding:7px;font-size:11px}
      .title{background:#dbeafe;font-size:16px}.head{background:#e0e7ff;font-weight:bold}
      .total{background:#f3f4f6;font-weight:bold}
    </style></head><body><table>${rows}</table></body></html>`;

    const blob=new Blob([doc],{type:"application/vnd.ms-excel;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`Clean_N_Clear_${period}_Report_${start}_to_${end}.xls`;
    a.click();
    URL.revokeObjectURL(url);
}

reportPeriod.addEventListener("change",updateReportPreview);
reportDate.addEventListener("change",updateReportPreview);

/* BACKUP */
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="Clean_N_Clear_Backup_"+today+".json";a.click();URL.revokeObjectURL(url)}
importFile.addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.products||!x.sales)throw 0;db=x;db.sales=(db.sales||[]).map(s=>s.items?s:{...s,items:[{id:uid(),productId:s.productId,product:s.product,unit:"PCS",qty:s.qty,rate:s.qty?s.amount/s.qty:0,amount:s.amount}]});save();alert("Backup imported successfully.")}catch{alert("Invalid backup file.")}};r.readAsText(f)});
function clearAll(){if(!confirm("DELETE ALL DATA?\n\nExport a backup first."))return;db={products:[],sales:[],purchases:[],expenses:[],dues:[]};clearSaleForm();save()}

/* PWA */
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(console.log));
show("dashboard");setInitialBillNumber();render();
