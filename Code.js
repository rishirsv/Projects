// ===================== Personal Capital 3.5 =====================
// CSV import · rule engine · staging→ledger · wide Spending Insights
// ===============================================================

// ───────── CONFIG ─────────
const BANK_MAP = {
  RAW_AMEX   : {header:true , cols:{date:0,vendor:2,amt:3},            debitNeg:false, headerRegex:/^date\b.*description\b.*amount\b/i},
  RAW_CIBC   : {header:false, cols:{date:0,vendor:1,debit:2,credit:3}, debitNeg:true , headerRegex:/^\d{4}-\d{2}-\d{2}/},
  RAW_SIMPLII: {header:true , cols:{date:0,vendor:1,debit:2,credit:3}, debitNeg:true , headerRegex:/\bfunds\s*out\b/i}
};

const SH_STG    = 'STG_Transactions';
const SH_LOG    = 'SYS_ImportLog';
const SH_RULES  = 'CategoryRules';
const SH_TX     = 'Transactions';
const SH_INC    = 'Income';
const SH_PARAMS = 'SYS_Parameters';


// ───────── UTILITIES ─────────
function num(v){ return typeof v==='number' ? v : parseFloat(String(v||'').replace(/[^0-9.\-]/g,''))||0; }
function cur(n){ return (n<0?'-$':'$')+Math.abs(n).toLocaleString('en-US'); }
function pctStr(v){ return (v*100).toFixed(1)+'%'; }
function monthKey(d){ return Utilities.formatDate(d,'GMT','yyyy-MM'); }
function deltaCell(v,isPct){
  if(!v) return '—';
  const col=v>0?'#d93025':'#188038';
  const txt=isPct?pctStr(v):cur(Math.abs(v));
  return `<span style="color:${col}">${v>0?'+':'-'}${txt}</span>`;
}

// ───────── BOOTSTRAP ─────────
function ensureSheets(){
  const ss=SpreadsheetApp.getActive();
  const want={
    [SH_STG]:['Date','Vendor','Amount','Category','Source'],
    [SH_LOG]:['Timestamp','Bank','Rows Read','Rows Kept','Rows Skipped'],
    [SH_RULES]:['Pattern (Regex)','Category','Priority','Min','Max','Type','Notes'],
    [SH_TX]:['Date (MM/DD/YYYY)','Vendor','Amount','Category','DateKey'],
    [SH_INC]:['Date (MM/DD/YYYY)','Source','Amount','Category','DateKey']
  };
  for(const [n,h] of Object.entries(want)){
    if(!ss.getSheetByName(n)) ss.insertSheet(n).appendRow(h);
  }
}

function onOpen(){
  const ui=SpreadsheetApp.getUi();
  ui.createMenu('Import')
    .addItem('Import CSV(s)…','showImportDialog')
    .addItem('Import Staging→Ledger…','showImportToLedgerDialog')
    .addSeparator()
    .addItem('Auto-Categorize Staging','autoCategorizeStaging')
    .addToUi();
  ui.createMenu('Insights')
    .addItem('Spending Insights…','showSpendingInsightsDialog')
    .addToUi();
  ensureSheets();
}

// ───────── UI LAUNCHERS ─────────
function showImportDialog(){
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutputFromFile('ImportDialog')
      .setWidth(650).setHeight(400),
    'Import CSV(s) to Staging'
  );
}
function showImportToLedgerDialog(){
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutputFromFile('ImportToLedgerDialog')
      .setWidth(400).setHeight(250),
    'Import Staging → Transactions'
  );
}
function showSpendingInsightsDialog(){
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutputFromFile('SpendingInsightsDialog')
      .setWidth(380).setHeight(240),
    'Generate Spending Insights'
  );
}
function showReviewSidebar(rowsJSON){
  const t=HtmlService.createTemplateFromFile('ReviewSidebar');
  t.rowsJSON=rowsJSON;
  SpreadsheetApp.getUi().showSidebar(
    t.evaluate().setTitle('Review Uncategorised')
  );
}
function showError(m){ SpreadsheetApp.getUi().alert(m); }

// ───────── (CSV IMPORT / RULE ENGINE / LEDGER IMPORT) ─────────
// *identical to v3.4 — keep as-is; omitted here for brevity*

// ───────── INSIGHTS ENGINE ─────────
function generateSpendingInsights({period}){
  // ── 1. crunch numbers (unchanged) ──
  const ss=SpreadsheetApp.getActive();
  const tx=ss.getSheetByName(SH_TX).getDataRange().getValues().slice(1);
  const incSh=ss.getSheetByName(SH_INC);
  const inc =incSh?incSh.getDataRange().getValues().slice(1):[];
  const today=new Date();
  const win={
    lastMonth:{s:new Date(today.getFullYear(),today.getMonth()-1,1),
               e:new Date(today.getFullYear(),today.getMonth(),0),
               lbl:d=>Utilities.formatDate(d,'GMT','MMMM yyyy')},
    ytd:{s:new Date(today.getFullYear(),0,1),
         e:today,
         lbl:()=>`Year-to-Date (${Utilities.formatDate(today,'GMT','MMM d')})`},
    t12:{s:new Date(today.getFullYear()-1,today.getMonth()+1,1),
         e:today,
         lbl:d=>`T12M (${Utilities.formatDate(d,'GMT','MMM yyyy')}–${Utilities.formatDate(today,'GMT','MMM yyyy')})`}
  }[period||'lastMonth'];

  const now={},ltmSum={},ltmMon={},prevSum={},prevMon={},seen=new Set();
  let income=0,invest=0;

  tx.forEach(r=>{
    const d=new Date(r[4]||r[0]); if(isNaN(d)) return;
    const amt=num(r[2]), cat=r[3]||'Uncategorised';
    if(amt>=0) return;

    if(d>=win.s&&d<=win.e){
      if(cat==='Transfer') return;
      if(cat==='Investment'){ invest+=Math.abs(amt); return; }
      now[cat]=(now[cat]||0)+Math.abs(amt);
    }
    const ltmS=new Date(win.s); ltmS.setFullYear(ltmS.getFullYear()-1);
    const ltmE=new Date(win.s); ltmE.setDate(ltmE.getDate()-1);
    if(d>=ltmS&&d<=ltmE){
      ltmSum[cat]=(ltmSum[cat]||0)+Math.abs(amt);
      const tag=`ltm|${monthKey(d)}|${cat}`;
      if(!seen.has(tag)){ ltmMon[cat]=(ltmMon[cat]||0)+1; seen.add(tag); }
    }
    const prevS=new Date(win.s); prevS.setFullYear(prevS.getFullYear()-1);
    const prevE=new Date(win.e); prevE.setFullYear(prevE.getFullYear()-1);
    if(d>=prevS&&d<=prevE){
      prevSum[cat]=(prevSum[cat]||0)+Math.abs(amt);
      const tag=`prev|${monthKey(d)}|${cat}`;
      if(!seen.has(tag)){ prevMon[cat]=(prevMon[cat]||0)+1; seen.add(tag); }
    }
  });

  inc.forEach(r=>{
    const d=new Date(r[4]||r[0]); if(isNaN(d)) return;
    if(d>=win.s&&d<=win.e) income+=num(r[2]);
  });

  const cats=Object.keys(now).sort((a,b)=>now[b]-now[a]).slice(0,10);
  const rows=cats.map(cat=>{
    const total=now[cat];
    const avgLTM =ltmMon[cat]?ltmSum[cat]/ltmMon[cat]:0;
    const avgPrev=prevMon[cat]?prevSum[cat]/prevMon[cat]:0;
    const dAbs=total-avgLTM, dPct=avgLTM?dAbs/avgLTM:0;
    return{category:cat,total,pctIncome:income?total/income:0,
           avgLTM,avgPrev,deltaAbs:dAbs,deltaPct:dPct,chartVal:total};
  });

  // ── 2. build HTML for sidebar ──
  let tbl=`<table><thead><tr>
  <th>Category</th><th>Total</th><th>%Inc</th><th>Avg-LTM</th><th>Avg-Prev</th><th>Δ $</th><th>Δ %</th>
  </tr></thead><tbody>
  <tr class="income-row"><td>Income</td><td>${cur(income)}</td><td>100%</td><td colspan="4"></td></tr>`;
  rows.forEach(r=>{
    tbl+=`<tr><td>${r.category}</td><td>${cur(r.total)}</td><td>${pctStr(r.pctIncome)}</td>
      <td>${cur(r.avgLTM)}</td><td>${cur(r.avgPrev)}</td>
      <td>${deltaCell(r.deltaAbs,false)}</td><td>${deltaCell(r.deltaPct,true)}</td></tr>`;
  });
  tbl+='</tbody></table>';

  const t=HtmlService.createTemplateFromFile('SpendingInsightsSidebar');
  t.narrative   = buildNarrative(win.lbl(win.s),income,rows,invest);
  t.tableHTML   = tbl;
  t.rowsJSON    = JSON.stringify(rows);
  t.periodLabel = win.lbl(win.s);

  // ── 3. show **wide** modeless dialog ──
  SpreadsheetApp.getUi().showModelessDialog(
    t.evaluate()
     .setSandboxMode(HtmlService.SandboxMode.NATIVE)   // allow inline JS
     .setWidth(820).setHeight(650),
    'Spending Insights'
  );
}

// ───────── NARRATIVE (Gemini) ─────────
function buildNarrative(label,income,rows,invest){
  const prop=PropertiesService.getScriptProperties();
  const key =prop.getProperty('OPENROUTER_API_KEY');
  const base=prop.getProperty('OPENROUTER_API_BASE')||'https://openrouter.ai/api/v1';
  const model=prop.getProperty('OPENROUTER_MODEL')||'google/gemini-2.5-flash-preview:thinking';
  const invPct=income?invest/income:0;

  const fallback=()=>{
    const top=rows.slice(0,3).map(r=>r.category).join(', ');
    return `In ${label} you spent ${cur(rows.reduce((s,r)=>s+r.total,0))}.`
         +(top?` Biggest areas: ${top}.`:'')
         +(invest?` You invested ${cur(invest)} (${pctStr(invPct)} of income).`:'');
  };

  if(!key) return fallback()+' (AI disabled)';

  try{
    const resp=UrlFetchApp.fetch(`${base}/chat/completions`,{
      method:'post',contentType:'application/json',
      headers:{Authorization:'Bearer '+key},
      payload:JSON.stringify({
        model,
        messages:[
          {role:'system',content:'You are a personal-finance assistant.'},
          {role:'user',content:
`Period: ${label}
Income: ${cur(income)}
Invested: ${cur(invest)} (${pctStr(invPct)})
Top categories:
${rows.map(r=>`- ${r.category}: ${cur(r.total)} (${pctStr(r.pctIncome)})`).join('\n')}
Write a two-paragraph insight on spending drivers & budget health, comparing to historical trends.`}
        ],
        temperature:0.4,max_tokens:1200
      }),
      muteHttpExceptions:true
    });
    return JSON.parse(resp.getContentText())
           .choices?.[0]?.message?.content.trim()||fallback();
  }catch(e){
    Logger.log('AI error '+e); return fallback()+' (AI error)';
  }
}
