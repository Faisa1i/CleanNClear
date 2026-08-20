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
salesForm.addEventListener("submit",e=>{e.preventDefault();if(!saleItems.length){alert("Add at least one product to the invoice.");return}if(!sBill.value.trim()){alert("Enter Bill No.");return}const invoice={id:editingInvoiceId||uid(),date:sDate.value,bill:sBill.value.trim(),customer:sCustomer.value.trim()||"Cash",previousBalance:Number(sOldBalance.value)||0,items:saleItems.map(i=>({...i})),amount:saleTotal()};const i=db.sales.findIndex(x=>x.id===invoice.id);if(i>=0)db.sales[i]=invoice;else db.sales.push(invoice);clearSaleForm();save();show("sales")});
function loadInvoiceForEdit(id){const inv=db.sales.find(x=>x.id===id);if(!inv)return;editingInvoiceId=inv.id;sDate.value=inv.date;sBill.value=inv.bill;sCustomer.value=inv.customer;sOldBalance.value=Number(inv.previousBalance)||0;saleItems=(inv.items||[]).map(i=>({...i}));renderSaleItems();document.querySelector(".invoice-builder-card").classList.add("invoice-editing");document.querySelector("#salesForm .btn.primary").textContent="✏️ Update Invoice";window.scrollTo({top:0,behavior:"smooth"})}
function clearSaleForm(){editingInvoiceId=null;saleItems=[];sDate.value=today;sBill.value="";sCustomer.value="Cash";sOldBalance.value=0;clearSaleProductEntry();renderSaleItems();document.querySelector(".invoice-builder-card")?.classList.remove("invoice-editing");document.querySelector("#salesForm .btn.primary").textContent="💾 Save Invoice";setInitialBillNumber()}
function deleteInvoice(id){if(!confirm("Delete this complete invoice?"))return;db.sales=db.sales.filter(x=>x.id!==id);if(editingInvoiceId===id)clearSaleForm();save()}
function printSavedInvoice(id){const inv=db.sales.find(x=>x.id===id);if(inv)printInvoice(inv)}
function printCurrentInvoice(){if(!saleItems.length){alert("Add at least one product first.");return}printInvoice({date:sDate.value,bill:sBill.value||"Draft",customer:sCustomer.value||"Cash",previousBalance:Number(sOldBalance.value)||0,items:saleItems,amount:saleTotal()})}
function printInvoice(inv){
    const w=window.open("","_blank");
    if(!w){
        alert("Please allow pop-ups to print the invoice.");
        return;
    }

    const rows=(inv.items||[]).map((i,n)=>`
      <div class="item-card">
        <div class="item-name">${esc(i.product)}</div>
        <div class="item-grid">
          <div><span>Quantity</span><b>${i.qty} ${esc(i.unit||"")}</b></div>
          <div><span>Price/Unit</span><b>${money(i.rate)}</b></div>
          <div class="item-amount"><span>Amount</span><b>${money(i.amount)}</b></div>
        </div>
      </div>
    `).join("");

    const subtotal=Number(inv.amount)||0;
    const received=Number(inv.receivedAmount ?? subtotal)||0;
    const transactionBalance=Number(inv.transactionBalance ?? (subtotal-received))||0;
    const previousBalance=Number(inv.previousBalance||0)||0;
    const currentBalance=previousBalance+transactionBalance;

    const safeDate=inv.date || "";
    const billNo=inv.bill || "Draft";

    w.document.write(`<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(billNo)} - ${esc(BUSINESS.name)}</title>
<style>
@page{size:A5 portrait;margin:4mm}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff}
body{font-family:Arial,Helvetica,sans-serif;color:#303544;font-size:10px}
.sheet{width:100%;max-width:148mm;margin:0 auto;padding:2mm 0}

.top{display:flex;justify-content:space-between;align-items:flex-start;gap:8mm;padding:1mm 0 5mm}
.brand{display:flex;gap:3mm;align-items:center;min-width:0}
.logo{width:12mm;height:12mm;border-radius:50%;background:#087bc1;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:8px;flex:none}
.brand h1{margin:0;font-size:15px;line-height:1.1;color:#303544}
.brand .mobile{margin-top:2mm;font-size:8.5px;color:#8b929e}
.brand .address{margin-top:1mm;font-size:7.4px;line-height:1.3;color:#8b929e;max-width:75mm}
.title{text-align:right;min-width:39mm}
.title h2{margin:0 0 5mm;font-size:18px;color:#303544}
.title div{font-size:8.5px;color:#8b929e;margin-top:1.5mm}
.title strong{color:#303544}

.meta{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-bottom:5mm}
.meta-box{min-height:17mm}
.meta-label{font-size:8.5px;color:#8b929e;font-weight:700;margin-bottom:2mm}
.meta-value{font-size:11px;color:#303544;font-weight:700}
.meta-right{text-align:right}

.item-card{border:1px solid #dfe2e6;border-radius:4mm;padding:4mm 4mm 3.5mm;margin-bottom:3mm;page-break-inside:avoid}
.item-name{font-size:11px;color:#087bc1;font-weight:700;margin-bottom:3mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.item-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm}
.item-grid span{display:block;color:#8b929e;font-size:8.5px;margin-bottom:1.5mm}
.item-grid b{display:block;color:#303544;font-size:10px;font-weight:500}
.item-amount{text-align:right}
.item-amount b{font-weight:700}

.breakup{border:1px solid #dfe2e6;border-radius:4mm;padding:4mm 4mm 3mm;margin-top:4mm;page-break-inside:avoid}
.breakup h3{margin:0 0 4mm;font-size:11.5px;color:#303544}
.break-row{display:flex;justify-content:space-between;align-items:center;padding:1.2mm 0;color:#8b929e;font-size:9.5px}
.break-row strong{color:#303544;font-size:9.5px}
.break-row.total{color:#087bc1;font-size:10.5px;font-weight:700}
.break-row.total strong{color:#087bc1;font-size:11px}

.bottom{display:flex;justify-content:flex-end;margin-top:5mm}
.signature{width:58mm;height:27mm;border:1px solid #dfe2e6;border-radius:4mm;display:flex;flex-direction:column;align-items:center;justify-content:center}
.signature .sign{font-size:16px;color:#303544;font-family:cursive;font-style:italic}
.signature .firm{margin-top:3mm;font-size:8px;color:#8b929e;font-weight:700;letter-spacing:.4px}

.footer{display:flex;justify-content:space-between;gap:4mm;margin-top:4mm;padding-top:3mm;border-top:1px solid #e5e7eb;color:#8b929e;font-size:7.5px}
.footer-right{text-align:right}

@media print{
  html,body{background:#fff}
  .sheet{max-width:none}
}
</style>
</head>
<body>
<div class="sheet">

  <div class="top">
    <div class="brand">
      <div class="logo">CN</div>
      <div>
        <h1>${esc(BUSINESS.name)}</h1>
        <div class="mobile">${esc(BUSINESS.mobile)}</div>
        <div class="address">${esc(BUSINESS.address)}</div>
      </div>
    </div>
    <div class="title">
      <h2>INVOICE</h2>
      <div><strong>Invoice No.</strong></div>
      <div>${esc(billNo)}</div>
      <div style="margin-top:2mm">${esc(safeDate)}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-box">
      <div class="meta-label">Bill To:</div>
      <div class="meta-value">${esc(inv.customer||"Cash")}</div>
    </div>
    <div class="meta-box meta-right">
      <div class="meta-label">Payment</div>
      <div class="meta-value">${esc(inv.payment||"Cash / As received")}</div>
    </div>
  </div>

  ${rows}

  <div class="breakup">
    <h3>Pricing / Breakup</h3>
    <div class="break-row"><span>Sub Total</span><strong>${money(subtotal)}</strong></div>
    <div class="break-row total"><span>Total Amount</span><strong>${money(subtotal)}</strong></div>
    <div class="break-row"><span>Received Amount</span><strong>${money(received)}</strong></div>
    <div class="break-row"><span>Transaction Balance</span><strong>${money(transactionBalance)}</strong></div>
    <div class="break-row"><span>Previous Balance</span><strong>${money(previousBalance)}</strong></div>
    <div class="break-row"><span>Current Balance</span><strong>${money(currentBalance)}</strong></div>
  </div>

  <div class="bottom">
    <div class="signature">
      <div class="sign">Faisal</div>
      <div class="firm">${esc(BUSINESS.name).toUpperCase()}</div>
    </div>
  </div>

  <div class="footer">
    <div>Thank you for your business.</div>
    <div class="footer-right">${esc(BUSINESS.name)}</div>
  </div>

</div>
<script>window.onload=function(){setTimeout(function(){window.print()},150)}<\/script>
</body>
</html>`);
    w.document.close();
}

/* PURCHASES */


function searchPurchaseProducts(){
    const q=(pProductSearch.value||"").trim().toLowerCase();
    if(!q){
        pProductResults.style.display="none";
        return;
    }

    const results=db.products
        .filter(p=>(p.name+" "+p.category+" "+p.unit).toLowerCase().includes(q))
        .slice(0,15);

    pProductResults.innerHTML=results.length
        ? results.map(p=>`
            <div class="product-result" onclick="selectPurchaseProduct('${p.id}')">
                <strong>${esc(p.name)}</strong>
                <small>${esc(p.category||"Product")} • ${esc(p.unit)} • Purchase ${money(p.purchaseRate)}</small>
            </div>`).join("")
        : `<div class="product-result"><strong>No product found</strong><small>Add it in Products tab first.</small></div>`;

    pProductResults.style.display="block";
}

function selectPurchaseProduct(id){
    const p=productById(id);
    if(!p)return;

    pProduct.value=id;
    pProductSearch.value=p.name;
    pRate.value=p.purchaseRate||0;
    updatePurchaseAmount();
    selectedPurchaseProductInfo.textContent=`${p.name} • ${p.unit} • Purchase Rate ${money(p.purchaseRate)}`;
    pProductResults.style.display="none";
    pQty.focus();
}

function updatePurchaseAmount(){
    const qty=Number(pQty.value)||0;
    const rate=Number(pRate.value)||0;
    pAmount.value=(qty*rate).toFixed(2);
}

pProductSearch.addEventListener("input",searchPurchaseProducts);
pQty.addEventListener("input",updatePurchaseAmount);
pRate.addEventListener("input",updatePurchaseAmount);

purchaseForm.addEventListener("submit",e=>{
    e.preventDefault();

    const p=productById(pProduct.value);
    if(!p){
        alert("Search and select a product first.");
        pProductSearch.focus();
        return;
    }

    const qty=Number(pQty.value)||0;
    const rate=Number(pRate.value)||0;
    const amount=Number(pAmount.value)||0;

    if(qty<=0){
        alert("Enter a valid quantity.");
        return;
    }

    db.purchases.push({
        id:uid(),
        date:pDate.value,
        supplier:pSupplier.value.trim(),
        bill:pBill.value.trim(),
        productId:p.id,
        product:p.name,
        unit:p.unit,
        qty,
        rate,
        amount
    });

    clearPurchaseForm();
    save();
    show("purchases");
});

function clearPurchaseForm(){
    pDate.value=today;
    pSupplier.value="";
    pBill.value="";
    pProduct.value="";
    pProductSearch.value="";
    pQty.value=1;
    pRate.value=0;
    pAmount.value=0;
    selectedPurchaseProductInfo.textContent="No product selected";
    pProductResults.style.display="none";
}

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
 renderProducts();renderSaleItems();updateReportPreview();renderStock();
 const invoices=[...db.sales].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 invoiceCount.textContent=`${invoices.length} Invoice${invoices.length===1?"":"s"}`;
 invoiceBody.innerHTML=invoices.map(inv=>`<tr><td>${esc(inv.date)}</td><td><b>${esc(inv.bill)}</b></td><td>${esc(inv.customer)}</td><td>${(inv.items||[]).length}</td><td>${money(inv.amount)}</td><td><button class="btn small secondary" onclick="loadInvoiceForEdit('${inv.id}')">✏️ Edit</button> <button class="btn small primary" onclick="printSavedInvoice('${inv.id}')">🖨 Print</button> <button class="btn small danger" onclick="deleteInvoice('${inv.id}')">🗑</button></td></tr>`).join("");
 salesBody.innerHTML=invoices.map(inv=>`<tr><td>${esc(inv.date)}</td><td>${esc(inv.bill)}</td><td>${esc(inv.customer)}</td><td>${(inv.items||[]).length} items</td><td>${money(inv.amount)}</td><td><button class="btn small secondary" onclick="loadInvoiceForEdit('${inv.id}')">✏️</button> <button class="btn small primary" onclick="printSavedInvoice('${inv.id}')">🖨</button> <button class="btn small danger" onclick="deleteInvoice('${inv.id}')">🗑</button></td></tr>`).join("");
 purchaseCount.textContent=`${db.purchases.length} Purchase${db.purchases.length===1?"":"s"}`;
 purchaseBody.innerHTML=db.purchases.map(i=>`<tr><td>${esc(i.date)}</td><td>${esc(i.supplier)}</td><td>${esc(i.bill)}</td><td>${esc(i.product)}</td><td>${i.qty} ${esc(i.unit||"")}</td><td>${money(i.rate)}</td><td>${money(i.amount)}</td><td><button class="btn small danger" onclick="del('purchases','${i.id}')">🗑</button></td></tr>`).join("");
 expenseBody.innerHTML=db.expenses.map(i=>`<tr><td>${esc(i.date)}</td><td>${esc(i.name)}</td><td>${money(i.amount)}</td><td><button class="btn small danger" onclick="del('expenses','${i.id}')">🗑</button></td></tr>`).join("");
 dueBody.innerHTML=db.dues.map(i=>`<tr><td>${esc(i.customer)}</td><td>${esc(i.bill)}</td><td>${money(i.amount)}</td><td><button class="btn small danger" onclick="del('dues','${i.id}')">🗑</button></td></tr>`).join("");
 const stockRows=db.products.map(p=>{
    const productId=String(p.id);
    const productName=String(p.name||"").trim().toLowerCase();

    const purchased=db.purchases
        .filter(x=>String(x.productId||"")===productId ||
                   String(x.product||"").trim().toLowerCase()===productName)
        .reduce((s,x)=>s+(Number(x.qty)||0),0);

    const sold=db.sales
        .flatMap(x=>Array.isArray(x.items)?x.items:[])
        .filter(x=>String(x.productId||"")===productId ||
                   String(x.product||"").trim().toLowerCase()===productName)
        .reduce((s,x)=>s+(Number(x.qty)||0),0);

    const opening=Number(p.openingStock)||0;
    const current=opening+purchased-sold;

    return {p,opening,purchased,sold,current};
});

const stockEl=document.getElementById("stockBody");

if(stockEl){
    stockEl.innerHTML=stockRows.map(x=>`
        <tr>
            <td><b>${esc(x.p.name)}</b></td>
            <td>${esc(x.p.unit)}</td>
            <td>${x.opening}</td>
            <td>${x.purchased}</td>
            <td>${x.sold}</td>
            <td><b>${x.current}</b></td>
            <td>${money(x.current*(Number(x.p.saleRate)||0))}</td>
        </tr>
    `).join("");
}
}


/* ================= WEEKLY / MONTHLY EXCEL REPORT ================= */

function isoDate(d){
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,"0");
    const day=String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
}

function reportDates(){
    const selected=reportDate.value || today;
    const parts=selected.split("-").map(Number);
    const d=new Date(parts[0],parts[1]-1,parts[2]);
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


/* ================= STOCK ================= */

function renderStock(){
    const rows=db.products.map(p=>{
        const productId=String(p.id);
        const productName=String(p.name||"").trim().toLowerCase();

        const purchased=db.purchases
            .filter(x=>String(x.productId||"")===productId ||
                       String(x.product||"").trim().toLowerCase()===productName)
            .reduce((s,x)=>s+(Number(x.qty)||0),0);

        const sold=db.sales
            .flatMap(x=>Array.isArray(x.items)?x.items:[])
            .filter(x=>String(x.productId||"")===productId ||
                       String(x.product||"").trim().toLowerCase()===productName)
            .reduce((s,x)=>s+(Number(x.qty)||0),0);

        const opening=Number(p.openingStock)||0;
        const current=opening+purchased-sold;

        return {p,opening,purchased,sold,current};
    });

    const el=document.getElementById("stockBody");
    if(!el)return;

    el.innerHTML=rows.map(x=>`
        <tr>
          <td><b>${esc(x.p.name)}</b></td>
          <td>${esc(x.p.unit)}</td>
          <td>${x.opening}</td>
          <td>${x.purchased}</td>
          <td>${x.sold}</td>
          <td><b>${x.current}</b></td>
          <td>${money(x.current*(Number(x.p.saleRate)||0))}</td>
        </tr>
    `).join("");
}

/* BACKUP */
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="Clean_N_Clear_Backup_"+today+".json";a.click();URL.revokeObjectURL(url)}
importFile.addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.products||!x.sales)throw 0;db=x;db.sales=(db.sales||[]).map(s=>s.items?s:{...s,items:[{id:uid(),productId:s.productId,product:s.product,unit:"PCS",qty:s.qty,rate:s.qty?s.amount/s.qty:0,amount:s.amount}]});save();alert("Backup imported successfully.")}catch{alert("Invalid backup file.")}};r.readAsText(f)});
function clearAll(){if(!confirm("DELETE ALL DATA?\n\nExport a backup first."))return;db={products:[],sales:[],purchases:[],expenses:[],dues:[]};clearSaleForm();save()}

/* PWA */
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(console.log));
show("dashboard");setInitialBillNumber();render();
