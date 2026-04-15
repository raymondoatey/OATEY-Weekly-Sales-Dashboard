import React, { useState, useEffect, useMemo, useRef } from "react";
import storage from "./storage";
import * as XLSX from "xlsx";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart } from "recharts";

const MONTHS=["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
const FY_OPTIONS=["FY 2025-26","FY 2026-27"];
const CK=["b2c_qcom","b2c_ecom","b2b_horeca","b2b_corp"];
const CL={"b2c_qcom":"B2C (Q-Com, Website)","b2c_ecom":"B2C (E-Com, Amazon)","b2b_horeca":"B2B (HORECA)","b2b_corp":"B2B (Corporates)"};
const SC={"b2c_qcom":"B2C D2C","b2c_ecom":"B2C E-Com","b2b_horeca":"HORECA","b2b_corp":"B2B Corp"};
const OK=["employment","director_rem","emp_benefits","travel","repairs","rent","prof_fees","consulting","legal","printing","tax_paid","software","internet","office","other_admin"];
const OL={"employment":"Employment Costs","director_rem":"Director Remuneration","emp_benefits":"Employee Benefits","travel":"Travel & Conveyance","repairs":"Repairs","rent":"Rent & Taxes","prof_fees":"Professional Fees","consulting":"Consulting Fees","legal":"Legal & Audit","printing":"Printing","tax_paid":"Tax Paid","software":"Software","internet":"Internet & Telecom","office":"Office Expenses","other_admin":"Other Admin"};
const P={navy:"#0F1B2D",blue:"#1B3A5C",acc:"#2A5F8F",teal:"#1D9E75",coral:"#D85A30",purp:"#534AB7",red:"#E24B4A",grn:"#006400",amb:"#BA7517"};
const CC=["#7F77DD","#D85A30","#1D9E75","#3266ad"];
const SKUC={"Millet":"#1D9E75","Barista":"#534AB7","Chocolate":"#D85A30","Caramel Coffee":"#BA7517","Kesar Badam":"#D4537E","Pre Orders":"#0078AD","Assorted Box":"#888780"};
const DSKUS=["Millet","Barista","Chocolate","Caramel Coffee","Kesar Badam","Pre Orders","Assorted Box"];
const DCUST=[{name:"Amazon",channel:"b2c_ecom"},{name:"OATEY Website",channel:"b2c_qcom"},{name:"Flipkart",channel:"b2c_ecom"},{name:"JioMart",channel:"b2c_ecom"},{name:"Nature's Basket",channel:"b2c_ecom"},{name:"CRED",channel:"b2c_ecom"},{name:"Zoho Books",channel:"b2b_corp"}];
const UCHAN=[{id:"amazon",name:"Amazon",icon:"\u{1F4E6}",channel:"b2c_ecom",color:"#FF9900",bg:"#FFF4E5"},{id:"flipkart",name:"Flipkart",icon:"\u{1F6D2}",channel:"b2c_ecom",color:"#2874F0",bg:"#EBF3FF"},{id:"jiomart",name:"JioMart",icon:"\u{1F3EA}",channel:"b2c_ecom",color:"#0078AD",bg:"#E5F4FA"},{id:"natures_basket",name:"Nature's Basket",icon:"\u{1F33F}",channel:"b2c_ecom",color:"#4CAF50",bg:"#E8F5E9"},{id:"oatey_website",name:"OATEY Website",icon:"\u{1F310}",channel:"b2c_qcom",color:"#534AB7",bg:"#F0EFFE"},{id:"cred",name:"CRED",icon:"\u{1F4B3}",channel:"b2c_ecom",color:"#1A1A2E",bg:"#EDEDF4"},{id:"zoho_books",name:"Zoho Books",icon:"\u{1F4DA}",channel:"b2b_corp",color:"#C42B1C",bg:"#FDECEA"}];
const SFIELDS=[{key:"date",label:"Date",req:true},{key:"sku",label:"SKU / Product",req:true},{key:"quantity",label:"Quantity",req:true},{key:"unit_price",label:"Unit Price without GST",req:true},{key:"customer_name",label:"Customer Name",req:false},{key:"gst",label:"Total Tax",req:false},{key:"cgst",label:"CGST",req:false},{key:"sgst",label:"SGST",req:false},{key:"igst",label:"IGST",req:false},{key:"order_id",label:"Order ID",req:false}];
const MKEY="oatey-maps",SKEY="oatey-mis",SLKEY="oatey-sales",CUKEY="oatey-custs";
const fmt=n=>{if(n==null||isNaN(n))return"0";const a=Math.abs(n);if(a>=1e7)return(n<0?"(":"")+"₹"+(a/1e7).toFixed(2)+"Cr"+(n<0?")":"");if(a>=1e5)return(n<0?"(":"")+"₹"+(a/1e5).toFixed(2)+"L"+(n<0?")":"");if(a>=1e3)return(n<0?"(":"")+"₹"+(a/1e3).toFixed(1)+"K"+(n<0?")":"");return(n<0?"(₹":"₹")+a.toFixed(0)+(n<0?")":"");};
const fN=n=>n==null||isNaN(n)?"0":Math.round(n).toLocaleString("en-IN");
const pc=n=>n==null||isNaN(n)?"0.0%":(n*100).toFixed(1)+"%";
const eM=()=>({b2c_qcom:0,b2c_ecom:0,b2b_horeca:0,b2b_corp:0,units_sold:0,cost_per_unit:22,opening_stock:0,closing_stock:0,purchases:0,packaging:0,marketplace_fees:0,courier:0,marketing:0,employment:0,director_rem:0,emp_benefits:0,travel:0,repairs:0,rent:0,prof_fees:0,consulting:0,legal:0,printing:0,tax_paid:0,software:0,internet:0,office:0,other_admin:0,customers:[]});
const gWN=d=>{const day=new Date(d).getDate();return day<=7?1:day<=14?2:day<=21?3:4;};
const gMD=(mi,fy,dy=15)=>{const s=parseInt(fy.split(" ")[1].split("-")[0]);const cm=mi+4;return`${cm>12?s+1:s}-${String(cm>12?cm-12:cm).padStart(2,"0")}-${String(dy).padStart(2,"0")}`;};
const gCM=mi=>{const m=mi+4;return m>12?m-12:m;};
const SKU_KW={"Millet":["millet","oat millet","millet oat","millets"],"Barista":["barista","barista oat","oat barista"],"Chocolate":["chocolate","choco","cocoa","choc"],"Caramel Coffee":["caramel","coffee","caramel coffee","cafe","latte","cappuccino"],"Kesar Badam":["kesar","badam","almond","saffron","kesar badam","kesari"],"Pre Orders":["pre order","preorder","pre-order","advance","booking"],"Assorted Box":["assorted","combo","variety","mix pack","sampler","gift box","mixed","bundle","hamper"]};
const fuzzyScore=(a,b)=>{if(a===b)return 1;if(a.includes(b)||b.includes(a))return 0.9;const al=a.length,bl=b.length;if(al<2||bl<2)return 0;let matches=0;const w1=a.split(/[\s\-_]+/),w2=b.split(/[\s\-_]+/);for(const x of w1)for(const y of w2){if(x===y){matches+=3;}else if(x.includes(y)||y.includes(x)){matches+=2;}else{let c=0;for(let i=0;i<Math.min(x.length,y.length);i++)if(x[i]===y[i])c++;if(c>=3)matches+=1;}}return matches/(Math.max(w1.length,w2.length)*3);};
const detSKUScored=t=>{if(!t)return{sku:null,score:0};const s=String(t).toLowerCase().replace(/[^a-z0-9\s\-]/g,"").trim();if(!s)return{sku:null,score:0};let best=null,bestScore=0;for(const[sku,keywords]of Object.entries(SKU_KW)){for(const kw of keywords){const sc=fuzzyScore(s,kw);if(sc>bestScore){bestScore=sc;best=sku;}if(s.includes(kw)){const len=kw.length/s.length;const bonus=0.85+len*0.15;if(bonus>bestScore){bestScore=bonus;best=sku;}}}}if(bestScore>=0.3)return{sku:best,score:bestScore};const words=s.split(/[\s\-_]+/);for(const[sku,keywords]of Object.entries(SKU_KW)){for(const kw of keywords){for(const w of words){if(w.length>=3&&kw.includes(w)&&0.35>bestScore){bestScore=0.35;best=sku;}if(w.length>=4){for(const kword of kw.split(/\s+/)){if(kword.length>=4&&(w.startsWith(kword.substring(0,4))||kword.startsWith(w.substring(0,4)))){if(0.32>bestScore){bestScore=0.32;best=sku;}}}}}}}return{sku:bestScore>=0.3?best:null,score:bestScore};};
const detSKU=t=>detSKUScored(t).sku;
const pDate=v=>{if(!v)return null;if(v instanceof Date&&!isNaN(v.getTime()))return v.toISOString().split("T")[0];if(typeof v==="number"){const d=XLSX.SSF.parse_date_code(v);return d?`${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`:null;}const s=String(v).trim();let m;if((m=s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/)))return`${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;if((m=s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/))){const a=parseInt(m[1]),b=parseInt(m[2]),y=m[3];if(a>12)return`${y}-${b.toString().padStart(2,"0")}-${a.toString().padStart(2,"0")}`;return`${y}-${b.toString().padStart(2,"0")}-${a.toString().padStart(2,"0")}`;}if((m=s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})$/))){{const a=parseInt(m[1]),b=parseInt(m[2]),y=parseInt(m[3])+(parseInt(m[3])>50?1900:2000);if(a>12)return`${y}-${b.toString().padStart(2,"0")}-${a.toString().padStart(2,"0")}`;return`${y}-${b.toString().padStart(2,"0")}-${a.toString().padStart(2,"0")}`;}}const months={"jan":1,"feb":2,"mar":3,"apr":4,"may":5,"jun":6,"jul":7,"aug":8,"sep":9,"oct":10,"nov":11,"dec":12,"january":1,"february":2,"march":3,"april":4,"june":6,"july":7,"august":8,"september":9,"october":10,"november":11,"december":12};if((m=s.match(/(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{4})/i))){const mo=months[m[2].toLowerCase()];return`${m[3]}-${String(mo).padStart(2,"0")}-${m[1].padStart(2,"0")}`;}if((m=s.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2}),?\s+(\d{4})/i))){const mo=months[m[1].toLowerCase()];return`${m[3]}-${String(mo).padStart(2,"0")}-${m[2].padStart(2,"0")}`;}const d=new Date(s);return!isNaN(d.getTime())?d.toISOString().split("T")[0]:null;};
const autoMap=h=>{const m={};const l=h.map(x=>String(x||"").toLowerCase());const f=p=>l.findIndex(x=>p.some(q=>x.includes(q)));let i;if((i=f(["date","order date","invoice date"]))>=0)m.date=h[i];if((i=f(["sku","product","item","description"]))>=0)m.sku=h[i];if((i=f(["qty","quantity","units"]))>=0)m.quantity=h[i];if((i=f(["rate","unit price","price","selling price","mrp"]))>=0)m.unit_price=h[i];if((i=f(["customer name","customer","buyer","buyer name","bill to","ship to","sold to","client"]))>=0)m.customer_name=h[i];if((i=f(["gst","tax amount","total tax","tax"]))>=0)m.gst=h[i];if((i=f(["cgst"]))>=0)m.cgst=h[i];if((i=f(["sgst"]))>=0)m.sgst=h[i];if((i=f(["igst"]))>=0)m.igst=h[i];if((i=f(["order id","order no","invoice no","invoice number"]))>=0)m.order_id=h[i];return m;};

function Bg({text,color,bg}){return React.createElement("span",{style:{fontSize:10,fontWeight:600,color,background:bg,padding:"2px 8px",borderRadius:4}},text);}
function Tst({message,type,onClose}){useEffect(()=>{const t=setTimeout(onClose,4e3);return()=>clearTimeout(t);},[onClose]);return React.createElement("div",{style:{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:type==="error"?P.red:P.teal,color:"#fff",padding:"12px 24px",borderRadius:10,fontSize:13,fontWeight:600,zIndex:100,display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 20px rgba(0,0,0,0.2)"}},React.createElement("span",{style:{fontSize:16}},type==="error"?"\u2717":"\u2713"),message);}
function KPI({label,value,sub,color}){return React.createElement("div",{style:{background:"#f8f9fb",borderRadius:10,padding:"14px 16px",border:"1px solid #eee",flex:1,minWidth:130}},React.createElement("div",{style:{fontSize:11,color:"#777",marginBottom:4,fontWeight:500}},label),React.createElement("div",{style:{fontSize:22,fontWeight:700,color:color||P.navy,fontVariantNumeric:"tabular-nums"}},value),sub&&React.createElement("div",{style:{fontSize:11,color:typeof sub==="string"&&(sub.startsWith("-")||sub.startsWith("("))?P.red:P.teal,marginTop:2,fontWeight:500}},sub));}
function PLR({label,value,rev,bold,bg,indent}){const v=value||0;const ind=indent||0;return React.createElement("div",{style:{display:"flex",alignItems:"center",padding:"6px 14px",paddingLeft:14+ind*16,background:bg||"transparent",borderBottom:"1px solid #f0f0f0"}},React.createElement("span",{style:{flex:1,fontSize:13,fontWeight:bold?700:400,color:P.navy}},label),React.createElement("span",{style:{width:110,textAlign:"right",fontSize:13,fontWeight:bold?700:400,color:v<0?P.red:P.navy}},v<0?"("+fmt(-v)+")":fmt(v)),React.createElement("span",{style:{width:70,textAlign:"right",fontSize:12,color:"#888"}},rev?pc(Math.abs(v)/rev):""));}
function Sec({title,icon,children,open:defOpen}){const[open,setOpen]=useState(defOpen!==false);return React.createElement("div",{style:{marginBottom:16,border:"1px solid #e2e2e2",borderRadius:10,overflow:"hidden",background:"#fff"}},React.createElement("div",{onClick:()=>setOpen(!open),style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 18px",cursor:"pointer",background:open?"#f0f4fa":"#fafbfc",borderBottom:open?"1px solid #e8e8e8":"none"}},React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},React.createElement("span",{style:{fontSize:18}},icon),React.createElement("span",{style:{fontWeight:600,fontSize:14,color:P.navy}},title)),React.createElement("span",{style:{fontSize:12,color:"#888",transform:open?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}},"\u25BC")),open&&React.createElement("div",{style:{padding:"16px 18px"}},children));}
function Fld({label,value,onChange,prefix,highlight}){const pf=prefix===undefined?"₹":prefix;return React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:3,flex:1}},React.createElement("label",{style:{fontSize:11,color:"#666",fontWeight:500,whiteSpace:"nowrap"}},label),React.createElement("div",{style:{display:"flex",alignItems:"center",border:highlight?"2px solid #2A5F8F":"1px solid #d8d8d8",borderRadius:6,overflow:"hidden",background:highlight?"#f0f6ff":"#fff"}},pf&&React.createElement("span",{style:{padding:"6px 8px",fontSize:12,color:"#999",background:"#f6f6f6",borderRight:"1px solid #e2e2e2"}},pf),React.createElement("input",{type:"number",value:value||"",onChange:e=>onChange(parseFloat(e.target.value)||0),placeholder:"0",style:{border:"none",outline:"none",padding:"8px 10px",fontSize:13,width:"100%",background:"transparent"}})));}

export default function MISPortal(){
  const[fy,sFy]=useState("FY 2025-26"),[mi,sMi]=useState(9),[dt,sDt]=useState(eM()),[ad,sAd]=useState({}),[vw,sVw]=useState("upload"),[ld,sLd]=useState(true),[sv,sSv]=useState(false);
  const[inv,sInv]=useState([]),[cc,sCc]=useState([]);
  const[iDate,sIDate]=useState(gMD(9,"FY 2025-26")),[iCust,sICust]=useState("Amazon"),[iItems,sIItems]=useState([{sku:"Millet",qty:0,price:0,custName:""}]);
  const[shAC,sShAC]=useState(false),[nCN,sNCN]=useState(""),[nCC,sNCC]=useState("b2c_ecom");
  const[svm,sSvm]=useState("create"),[sw,sSw]=useState(0);
  const[cN,sCN]=useState(""),[cR,sCR]=useState(0),[cCh,sCCh]=useState("b2b_corp"),[cT,sCT]=useState("Old");
  const[toast,sToast]=useState(null),[tType,sTType]=useState("success");
  const[uChan,sUChan]=useState(null),[uStep,sUStep]=useState("select");
  const[rH,sRH]=useState([]),[rD,sRD]=useState([]),[cMap,sCMap]=useState({}),[sMaps,setSMaps]=useState({});
  const[pRows,sPRows]=useState([]),[skuOv,sSkuOv]=useState({}),[fName,sFName]=useState("");
  const fRef=useRef(null);
  const sk=`${SKEY}:${fy.replace(/\s+/g,"_")}`,slk=`${SLKEY}:${fy.replace(/\s+/g,"_")}`;
  const show=(m,t)=>{sTType(t||"success");sToast(m);};

  useEffect(()=>{(async()=>{
    try{const r=await storage.get(sk);if(r?.value){const p=JSON.parse(r.value);sAd(p);if(p[mi])sDt(p[mi]);}}catch(e){}
    try{const r=await storage.get(slk);if(r?.value)sInv(JSON.parse(r.value));}catch(e){}
    try{const r=await storage.get(CUKEY);if(r?.value)sCc(JSON.parse(r.value));}catch(e){}
    try{const r=await storage.get(MKEY);if(r?.value)setSMaps(JSON.parse(r.value));}catch(e){}
    sLd(false);
  })();},[fy]);
  useEffect(()=>{if(ad[mi])sDt({...eM(),...ad[mi]});else sDt(eM());},[mi,ad]);
  useEffect(()=>{sIDate(gMD(mi,fy));},[mi,fy]);

  const upd=(k,v)=>sDt(p=>({...p,[k]:v}));
  const saveDt=async()=>{sSv(true);const u={...ad,[mi]:dt};sAd(u);try{await storage.set(sk,JSON.stringify(u));}catch(e){}sSv(false);show("Saved "+MONTHS[mi]);};
  const saveInv=async i=>{try{await storage.set(slk,JSON.stringify(i));}catch(e){}};
  const saveMaps=async m=>{setSMaps(m);try{await storage.set(MKEY,JSON.stringify(m));}catch(e){}};
  const allC=useMemo(()=>[...DCUST,...cc],[cc]);
  const nxId=useMemo(()=>{if(!inv.length)return"INV-001001";const n=inv.map(i=>parseInt(i.id.replace("INV-",""))).filter(n=>!isNaN(n));return"INV-"+String(Math.max(...n,1e3)+1).padStart(6,"0");},[inv]);

  const handleFile=e=>{const f=e.target.files?.[0];if(!f)return;sFName(f.name);const r=new FileReader();r.onload=ev=>{try{const wb=XLSX.read(ev.target.result,{type:"array",cellDates:true});const ws=wb.Sheets[wb.SheetNames[0]];const json=XLSX.utils.sheet_to_json(ws,{defval:"",raw:false});if(!json.length){show("Empty sheet","error");return;}const h=Object.keys(json[0]);sRH(h);sRD(json);const saved=sMaps[uChan?.id];const auto=autoMap(h);sCMap(saved?{...auto,...Object.fromEntries(Object.entries(saved).filter(([k,v])=>h.includes(v)))}:auto);sUStep("map");}catch(err){show("Parse error: "+err.message,"error");}};r.readAsArrayBuffer(f);};

  const applyMap=()=>{if(!cMap.date||!cMap.sku||!cMap.quantity){show("Map Date, SKU, Qty","error");return;}saveMaps({...sMaps,[uChan.id]:cMap});
    const rows=rD.map((row,i)=>{const d=pDate(row[cMap.date]);const sr=String(row[cMap.sku]||"");const skr=detSKUScored(sr);const sk=skr.sku;const conf=Math.round(skr.score*100);const q=parseFloat(String(row[cMap.quantity]||0).replace(/,/g,""))||0;const p=cMap.unit_price?parseFloat(String(row[cMap.unit_price]||0).replace(/,/g,""))||0:0;
      const g=(cMap.gst?parseFloat(String(row[cMap.gst]||0).replace(/,/g,""))||0:0)+(cMap.cgst?parseFloat(String(row[cMap.cgst]||0).replace(/,/g,""))||0:0)+(cMap.sgst?parseFloat(String(row[cMap.sgst]||0).replace(/,/g,""))||0:0)+(cMap.igst?parseFloat(String(row[cMap.igst]||0).replace(/,/g,""))||0:0);
      const up=p;const lineTotal=q*up;const custName=cMap.customer_name?String(row[cMap.customer_name]||"").trim():"";return{idx:i,date:d,skuRaw:sr,sku:sk,conf,qty:q,unitPrice:Math.round(up*100)/100,gst:Math.round(g*100)/100,total:Math.round(lineTotal*100)/100,orderId:cMap.order_id?String(row[cMap.order_id]||""):"",custName};}).filter(r=>r.qty>0);
    sPRows(rows);sSkuOv({});sUStep("preview");};

  const genInv=()=>{const valid=pRows.filter(r=>(skuOv[r.idx]||r.sku)&&r.date);if(!valid.length){show("No valid rows","error");return;}
    const byD={};valid.forEach(r=>{if(!byD[r.date])byD[r.date]=[];byD[r.date].push(r);});
    let ni=[...inv],mx=inv.length?Math.max(...inv.map(i=>parseInt(i.id.replace("INV-",""))||1e3),1e3):1e3,ct=0,tr=0,tu=0;
    const monthCounts={};
    Object.entries(byD).forEach(([date,rows])=>{mx++;const items=rows.map(r=>({sku:skuOv[r.idx]||r.sku,qty:r.qty,price:r.unitPrice,custName:r.custName||""}));const sub=rows.reduce((s,r)=>s+r.total,0);const units=rows.reduce((s,r)=>s+r.qty,0);
      ni.push({id:"INV-"+String(mx).padStart(6,"0"),date,channel:uChan.name,channelType:uChan.channel,items,subtotal:Math.round(sub*100)/100,units,gst:Math.round(rows.reduce((s,r)=>s+r.gst,0)*100)/100,status:"raised",createdAt:Date.now(),source:uChan.id});ct++;tr+=sub;tu+=units;
      const dd=new Date(date);const cm=dd.getMonth()+1;const yr=dd.getFullYear();const mk=`${yr}-${cm}`;monthCounts[mk]=(monthCounts[mk]||0)+rows.length;});
    sInv(ni);saveInv(ni);
    // Auto-detect primary month and switch to it
    if(Object.keys(monthCounts).length>0){const top=Object.entries(monthCounts).sort((a,b)=>b[1]-a[1])[0][0];const[yr,cm]=top.split("-").map(Number);const fyMonth=cm>=4?cm-4:cm+8;const fyStart=cm>=4?yr:yr-1;const detectedFY=`FY ${fyStart}-${String(fyStart+1).slice(2)}`;if(FY_OPTIONS.includes(detectedFY))sFy(detectedFY);sMi(fyMonth);}
    sUStep("done");show(`${ct} invoices from ${uChan.name} \u2014 \u20B9${fN(Math.round(tr))} | ${fN(tu)} units`);};

  const resetUp=()=>{sUStep("select");sUChan(null);sRH([]);sRD([]);sPRows([]);sCMap({});sFName("");if(fRef.current)fRef.current.value="";};
  const delInv=id=>{const u=inv.filter(i=>i.id!==id);sInv(u);saveInv(u);show("Deleted "+id);};
  const addCust=async()=>{if(!nCN.trim())return;const nc=[...cc,{name:nCN.trim(),channel:nCC}];sCc(nc);try{await storage.set(CUKEY,JSON.stringify(nc));}catch(e){console.error("Save customers failed",e);}sICust(nCN.trim());sNCN("");sShAC(false);};
  const iLT=it=>(it.qty||0)*(it.price||0);
  const iSub=iItems.reduce((s,it)=>s+iLT(it),0);
  const iUnits=iItems.reduce((s,it)=>s+(it.qty||0),0);
  const hDC=nd=>{sIDate(nd);const d=new Date(nd);const cm=d.getMonth()+1;const fm=cm>=4?cm-4:cm+8;if(fm!==mi)sMi(fm);};
  const raiseInv=()=>{if(iSub<=0)return;const co=allC.find(c=>c.name===iCust)||{name:iCust,channel:"b2c_ecom"};const nv={id:nxId,date:iDate,channel:iCust,channelType:co.channel,items:iItems.map(it=>({...it,custName:it.custName||""})),subtotal:iSub,units:iUnits,status:"raised",createdAt:Date.now()};const u=[...inv,nv];sInv(u);saveInv(u);sIItems([{sku:"Millet",qty:0,price:0,custName:""}]);show(`${nv.id} raised \u2014 \u20B9${fN(iSub)}`);sSvm("ledger");};
  const addCustMIS=()=>{if(!cN)return;upd("customers",[...(dt.customers||[]),{name:cN,revenue:cR,channel:cCh,type:cT}]);sCN("");sCR(0);};

  const cm=gCM(mi);
  const mInv=useMemo(()=>{const s=parseInt(fy.split(" ")[1].split("-")[0]);const yr=cm>=4?s:s+1;return inv.filter(i=>{const d=new Date(i.date);return d.getMonth()+1===cm&&d.getFullYear()===yr;});},[inv,cm,fy]);
  const wInv=useMemo(()=>sw===0?mInv:mInv.filter(i=>gWN(i.date)===sw),[mInv,sw]);
  const wkD=useMemo(()=>{const w={1:{rev:0,units:0,ord:0},2:{rev:0,units:0,ord:0},3:{rev:0,units:0,ord:0},4:{rev:0,units:0,ord:0}};mInv.forEach(i=>{const k=gWN(i.date);w[k].rev+=i.subtotal;w[k].units+=i.units;w[k].ord+=1;});return[1,2,3,4].map(i=>({week:`W${i}`,...w[i]}));},[mInv]);
  const skD=useMemo(()=>{const s={};wInv.forEach(i=>{i.items.forEach(it=>{if(!s[it.sku])s[it.sku]={sku:it.sku,qty:0,rev:0};s[it.sku].qty+=it.qty||0;s[it.sku].rev+=(it.qty||0)*(it.price||0);});});return Object.values(s).sort((a,b)=>b.rev-a.rev);},[wInv]);
  const csD=useMemo(()=>{const c={};wInv.forEach(i=>{const ch=i.channel||i.customer||"Unknown";if(!c[ch])c[ch]={name:ch,rev:0,units:0,ord:0,channelType:i.channelType||i.channel};c[ch].rev+=i.subtotal;c[ch].units+=i.units;c[ch].ord+=1;});return Object.values(c).sort((a,b)=>b.rev-a.rev);},[wInv]);
  const topCusts=useMemo(()=>{const c={};wInv.forEach(i=>{(i.items||[]).forEach(it=>{const nm=it.custName||i.channel||i.customer||"Unknown";if(!c[nm])c[nm]={name:nm,rev:0,units:0,ord:0};c[nm].rev+=(it.qty||0)*(it.price||0);c[nm].units+=it.qty||0;c[nm].ord+=1;});});return Object.values(c).sort((a,b)=>b.rev-a.rev);},[wInv]);
  const tWR=wInv.reduce((s,i)=>s+i.subtotal,0),tWU=wInv.reduce((s,i)=>s+i.units,0),tWO=wInv.length;

  const tS=CK.reduce((s,k)=>s+(dt[k]||0),0);const cogs=(dt.units_sold||0)*(dt.cost_per_unit||22);const gp=tS-cogs;
  const vc=(dt.packaging||0)+(dt.marketplace_fees||0)+(dt.courier||0);const cm1=gp-vc;const cm2=cm1-(dt.marketing||0);
  const tOp=OK.reduce((s,k)=>s+(dt[k]||0),0);const ebitda=cm2-tOp;const roas=dt.marketing>0?tS/dt.marketing:0;
  const gMDC=i=>{const d=ad[i]||eM();const ts=CK.reduce((s,k)=>s+(d[k]||0),0);const cg=(d.units_sold||0)*(d.cost_per_unit||22);const g=ts-cg;const v=(d.packaging||0)+(d.marketplace_fees||0)+(d.courier||0);const c1=g-v;const c2=c1-(d.marketing||0);const o=OK.reduce((s,k)=>s+(d[k]||0),0);return{month:MONTHS[i],sales:ts,cogs:cg,gp:g,cm1:c1,cm2:c2,ebitda:c2-o,units:d.units_sold||0,...Object.fromEntries(CK.map(k=>[k,d[k]||0]))};};
  const tD=MONTHS.map((_,i)=>gMDC(i)).filter(d=>d.sales>0);
  const chD=CK.map((k,i)=>({name:SC[k],value:dt[k]||0,color:CC[i]})).filter(d=>d.value>0);
  const pS=mi>0&&ad[mi-1]?CK.reduce((s,k)=>s+(ad[mi-1][k]||0),0):0;const moM=pS>0?(tS-pS)/pS:null;

  if(ld)return React.createElement("div",{style:{padding:40,textAlign:"center",color:"#888"}},"Loading...");

  const CSS=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
input[type=number]{-moz-appearance:textfield}
.tb{padding:8px 14px;border:none;cursor:pointer;font-size:12px;font-weight:600;border-radius:8px 8px 0 0;white-space:nowrap;transition:all .15s}
.ta{background:${P.navy};color:#fff}.ti{background:#e8ecf1;color:#666}.ti:hover{background:#dde3eb}
.mb{width:46px;padding:5px 0;border:1px solid #ddd;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;text-align:center;background:#fff}
.mb:hover{border-color:${P.acc}}.ms{background:${P.navy};color:#fff;border-color:${P.navy}}.mh{border-color:${P.teal};background:#f0faf5}
.gb{padding:12px 32px;background:${P.navy};color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}
.gb:hover{background:${P.acc}}
.rb{padding:10px 28px;background:${P.teal};color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}
.rb:disabled{opacity:.4;cursor:not-allowed}
.db{width:22px;height:22px;border-radius:50%;border:1px solid #ddd;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;color:#c00}
.db:hover{background:#fee;border-color:#c00}
.il{display:flex;gap:8px;align-items:center;padding:8px 12px;background:#f8f9fb;border-radius:8px;margin-bottom:6px;border:1px solid #eee}
.it{width:100%;border-collapse:separate;border-spacing:0;font-size:12px}
.it th{background:#f0f4fa;padding:8px 12px;text-align:left;font-weight:600;color:#555;border-bottom:2px solid #e2e2e2;font-size:11px;text-transform:uppercase}
.it td{padding:8px 12px;border-bottom:1px solid #f0f0f0}.it tr:hover td{background:#fafbfc}
.wb{padding:6px 14px;border:1px solid #ddd;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;background:#fff}
.ws{background:${P.navy};color:#fff;border-color:${P.navy}}
.st{padding:6px 16px;border:none;cursor:pointer;font-size:12px;font-weight:600;border-radius:6px}
.sa{background:${P.acc};color:#fff}.si{background:#e8ecf1;color:#666}
.cc{border-radius:12px;padding:20px;cursor:pointer;border:2px solid transparent;transition:all .2s;text-align:center}
.cc:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.08)}
.cs{border-color:currentColor;box-shadow:0 4px 16px rgba(0,0,0,.12)}
.mp{padding:8px 10px;border:1px solid #d8d8d8;border-radius:6px;font-size:12px;background:#fff;width:100%}
.mm{border-color:${P.teal};background:#f0faf5}
.pt{width:100%;border-collapse:collapse;font-size:11px}.pt th{background:#f0f4fa;padding:6px 10px;text-align:left;font-weight:600;border-bottom:2px solid #ddd;position:sticky;top:0}.pt td{padding:5px 10px;border-bottom:1px solid #f0f0f0}
.sg{color:${P.teal};font-weight:600}.sb{color:${P.red};font-weight:600}
.sv{padding:10px 24px;background:#fff;color:${P.navy};border:2px solid ${P.navy};border-radius:8px;font-size:13px;font-weight:700;cursor:pointer}.sv:hover{background:${P.navy};color:#fff}`;

  const tabs=[{id:"upload",l:"Upload sales data"},{id:"sales",l:"Sales operations"},{id:"input",l:"MIS input"},{id:"dashboard",l:"Dashboard"},{id:"pl",l:"P&L"},{id:"trends",l:"Trends"}];

  return(
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",maxWidth:"100%",color:P.navy}}>
      <style>{CSS}</style>
      {toast&&<Tst message={toast} type={tType} onClose={()=>sToast(null)}/>}
      <div style={{background:P.navy,padding:"14px 20px",borderRadius:"12px 12px 0 0",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div><div style={{color:"#fff",fontSize:17,fontWeight:700}}>Plant Essentials — MIS Portal</div><div style={{color:"#8da4c4",fontSize:11,marginTop:2}}>Upload → Auto-map → Generate invoices → Dashboard</div></div>
        <select value={fy} onChange={e=>sFy(e.target.value)} style={{padding:"6px 12px",borderRadius:6,border:"1px solid #4a6a8f",background:"#1a3050",color:"#fff",fontSize:12,fontWeight:600}}>{FY_OPTIONS.map(f=><option key={f} value={f}>{f}</option>)}</select>
      </div>
      <div style={{display:"flex",gap:0,background:"#e8ecf1",borderBottom:"2px solid "+P.navy,overflowX:"auto"}}>{tabs.map(t=><button key={t.id} className={`tb ${vw===t.id?"ta":"ti"}`} onClick={()=>sVw(t.id)}>{t.l}</button>)}</div>
      <div style={{background:"#f5f7fa",padding:"16px 20px",minHeight:400}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          <span style={{fontSize:12,fontWeight:600,color:"#888",marginRight:4}}>Month:</span>
          {MONTHS.map((m,i)=>{const has=inv.some(iv=>{const d=new Date(iv.date);const c=gCM(i);const s=parseInt(fy.split(" ")[1].split("-")[0]);return d.getMonth()+1===c&&d.getFullYear()===(c>=4?s:s+1);});return <button key={m} className={`mb ${i===mi?"ms":has?"mh":""}`} onClick={()=>sMi(i)}>{m}{has&&i!==mi&&<div style={{width:4,height:4,borderRadius:"50%",background:P.teal,margin:"2px auto 0"}}/>}</button>;})}
        </div>

{vw==="upload"&&<div>
{uStep==="select"&&<div>
  <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Upload channel sales data</div>
  <div style={{fontSize:12,color:"#888",marginBottom:16}}>Select channel, upload Excel, map columns, auto-generate invoices.</div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14,marginBottom:20}}>
    {UCHAN.map(ch=><div key={ch.id} className={`cc ${uChan?.id===ch.id?"cs":""}`} style={{background:ch.bg,color:ch.color}} onClick={()=>sUChan(ch)}>
      <div style={{fontSize:32,marginBottom:6}}>{ch.icon}</div><div style={{fontSize:14,fontWeight:700}}>{ch.name}</div><div style={{fontSize:11,marginTop:4,opacity:.7}}>{SC[ch.channel]}</div>
      {sMaps[ch.id]&&<div style={{fontSize:10,marginTop:6,background:"rgba(0,0,0,.08)",padding:"2px 8px",borderRadius:4,display:"inline-block"}}>Mapping saved</div>}
    </div>)}
  </div>
  {uChan&&<div style={{background:"#fff",borderRadius:10,padding:20,border:"1px solid #e2e2e2"}}>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}><span style={{fontSize:24}}>{uChan.icon}</span><div><div style={{fontSize:15,fontWeight:700}}>Upload {uChan.name} report</div><div style={{fontSize:12,color:"#888"}}>.xlsx, .xls, .csv</div></div></div>
    <div style={{border:"2px dashed #ccc",borderRadius:10,padding:32,textAlign:"center",background:"#fafbfc",cursor:"pointer"}} onClick={()=>fRef.current?.click()}>
      <div style={{fontSize:28,marginBottom:8}}>{"\uD83D\uDCC4"}</div><div style={{fontSize:14,fontWeight:600}}>Drop file here or click to browse</div>
    </div>
    <input ref={fRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{display:"none"}}/>
  </div>}
</div>}

{uStep==="map"&&<div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e2e2",overflow:"hidden"}}>
  <div style={{background:`linear-gradient(135deg,${P.navy},${P.blue})`,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <div><div style={{color:"#fff",fontSize:15,fontWeight:700}}>Map columns — {uChan?.name}</div><div style={{color:"#8da4c4",fontSize:11}}>{fName} • {rD.length} rows</div></div>
    <button onClick={resetUp} style={{padding:"6px 14px",border:"1px solid #4a6a8f",borderRadius:6,background:"transparent",color:"#8da4c4",fontSize:12,fontWeight:600,cursor:"pointer"}}>{"\u2190"} Back</button>
  </div>
  <div style={{padding:20}}>
    <div style={{fontSize:12,color:"#666",marginBottom:14}}>Map Excel columns to fields. <span style={{color:P.red}}>*</span> = required. Auto-detected mappings are pre-filled.</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
      {SFIELDS.map(f=><div key={f.key} style={{display:"flex",flexDirection:"column",gap:3}}>
        <label style={{fontSize:11,fontWeight:600,color:"#555"}}>{f.label}{f.req&&<span style={{color:P.red}}> *</span>}</label>
        <select className={`mp ${cMap[f.key]?"mm":""}`} value={cMap[f.key]||""} onChange={e=>sCMap(p=>({...p,[f.key]:e.target.value||undefined}))}>
          <option value="">— Not mapped —</option>{rH.map(h=><option key={h} value={h}>{h}</option>)}
        </select>
      </div>)}
    </div>
    <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Preview (first 3 rows)</div>
    <div style={{overflowX:"auto",maxHeight:140,border:"1px solid #eee",borderRadius:8,marginBottom:16}}>
      <table className="pt"><thead><tr>{rH.slice(0,8).map(h=><th key={h} style={{fontSize:10,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
      <tbody>{rD.slice(0,3).map((r,i)=><tr key={i}>{rH.slice(0,8).map(h=><td key={h} style={{maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{String(r[h]||"").substring(0,25)}</td>)}</tr>)}</tbody></table>
    </div>
    <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
      <button onClick={resetUp} style={{padding:"10px 24px",border:"1px solid #ddd",borderRadius:8,background:"#fff",cursor:"pointer",fontSize:13,fontWeight:600}}>Cancel</button>
      <button onClick={applyMap} className="gb">Apply & preview {"\u2192"}</button>
    </div>
  </div>
</div>}

{uStep==="preview"&&<div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e2e2",overflow:"hidden"}}>
  <div style={{background:`linear-gradient(135deg,${P.navy},${P.blue})`,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <div><div style={{color:"#fff",fontSize:15,fontWeight:700}}>Review — {uChan?.name}</div><div style={{color:"#8da4c4",fontSize:11}}>{pRows.length} items | {pRows.filter(r=>skuOv[r.idx]||r.sku).length} valid SKU | {(()=>{const dates=pRows.filter(r=>r.date).map(r=>r.date).sort();if(!dates.length)return"No dates detected";const first=dates[0],last=dates[dates.length-1];const fd=new Date(first),ld=new Date(last);const fmtD=d=>d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});const months=new Set(dates.map(d=>{const x=new Date(d);return x.toLocaleDateString("en-IN",{month:"short",year:"numeric"});}));return `${fmtD(fd)} to ${fmtD(ld)} (${months.size} month${months.size>1?"s":""})`;})()}</div></div>
    <div style={{display:"flex",gap:8}}><button onClick={()=>sUStep("map")} style={{padding:"6px 14px",border:"1px solid #4a6a8f",borderRadius:6,background:"transparent",color:"#8da4c4",fontSize:12,fontWeight:600,cursor:"pointer"}}>{"\u2190"} Re-map</button><button onClick={resetUp} style={{padding:"6px 14px",border:"1px solid #4a6a8f",borderRadius:6,background:"transparent",color:"#8da4c4",fontSize:12,fontWeight:600,cursor:"pointer"}}>{"\u2717"} Cancel</button></div>
  </div>
  <div style={{padding:20}}>
    <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
      <KPI label="Rows" value={pRows.length}/><KPI label="Valid SKU" value={pRows.filter(r=>skuOv[r.idx]||r.sku).length} color={P.teal}/><KPI label="High conf (90%+)" value={pRows.filter(r=>(skuOv[r.idx]||r.sku)&&(skuOv[r.idx]?100:r.conf)>=90).length} color={P.teal}/><KPI label="Low conf (<70%)" value={pRows.filter(r=>r.sku&&!skuOv[r.idx]&&r.conf<70).length} color={pRows.some(r=>r.sku&&!skuOv[r.idx]&&r.conf<70)?P.amb:P.teal}/><KPI label="Unmatched" value={pRows.filter(r=>!(skuOv[r.idx]||r.sku)).length} color={pRows.some(r=>!(skuOv[r.idx]||r.sku))?P.red:P.teal}/><KPI label="Revenue" value={fmt(pRows.reduce((s,r)=>s+r.total,0))}/>
    </div>
    <div style={{overflowX:"auto",maxHeight:340,border:"1px solid #eee",borderRadius:8,marginBottom:16}}>
      <table className="pt"><thead><tr><th>Date</th><th>Product</th><th>SKU</th><th>Customer</th><th style={{textAlign:"right"}}>Qty</th><th style={{textAlign:"right"}}>Rate</th><th style={{textAlign:"right"}}>GST</th><th style={{textAlign:"right"}}>Total</th></tr></thead>
      <tbody>{pRows.map((r,i)=>{const fs=skuOv[r.idx]||r.sku;return <tr key={i} style={{background:fs?"transparent":"#fff5f5"}}>
        <td style={{fontSize:11,whiteSpace:"nowrap"}}>{r.date||<span className="sb">Invalid</span>}</td>
        <td style={{fontSize:11,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={r.skuRaw}>{r.skuRaw}</td>
        <td>{fs?<span style={{display:"flex",alignItems:"center",gap:4}}><span className="sg">{fs}</span>{!skuOv[r.idx]&&r.conf<90&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:r.conf>=70?"#fff9e6":r.conf>=50?"#fef3f2":"#fdecea",color:r.conf>=70?"#854F0B":r.conf>=50?"#993C1D":"#A32D2D"}}>{r.conf}%</span>}{!skuOv[r.idx]&&<select value={fs} onChange={e=>sSkuOv(p=>({...p,[r.idx]:e.target.value}))} style={{padding:"2px 4px",border:"1px solid #ddd",borderRadius:3,fontSize:10,background:"#fafafa",marginLeft:2,color:"#888"}}>
          {DSKUS.map(s=><option key={s} value={s}>{s}</option>)}</select>}</span>:<select value="" onChange={e=>sSkuOv(p=>({...p,[r.idx]:e.target.value}))} style={{padding:"4px",border:"1px solid #f0a0a0",borderRadius:4,fontSize:11,background:"#fff5f5"}}>
          <option value="">Select...</option>{DSKUS.map(s=><option key={s} value={s}>{s}</option>)}</select>}</td>
        <td style={{fontSize:11,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:r.custName?"#333":"#ccc"}}>{r.custName||"—"}</td>
        <td style={{textAlign:"right",fontFamily:"'JetBrains Mono',monospace"}}>{r.qty}</td>
        <td style={{textAlign:"right",fontFamily:"'JetBrains Mono',monospace"}}>{"\u20B9"}{r.unitPrice.toFixed(2)}</td>
        <td style={{textAlign:"right",fontFamily:"'JetBrains Mono',monospace"}}>{r.gst>0?"\u20B9"+r.gst.toFixed(2):"-"}</td>
        <td style={{textAlign:"right",fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{"\u20B9"}{fN(r.total)}</td>
      </tr>;})}</tbody></table>
    </div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",background:"#f0f6ff",borderRadius:10,border:"1px solid #d0e0f4",flexWrap:"wrap",gap:12}}>
      <div style={{fontSize:12,color:"#666"}}>Grouped by date. Unmapped SKUs skipped.</div>
      <button onClick={genInv} className="rb" style={{fontSize:15,padding:"12px 32px"}}>Generate invoices</button>
    </div>
  </div>
</div>}

{uStep==="done"&&<div style={{textAlign:"center",padding:40,background:"#fff",borderRadius:10,border:"1px solid #e2e2e2"}}>
  <div style={{fontSize:48,marginBottom:12}}>{"\u2705"}</div><div style={{fontSize:18,fontWeight:700,marginBottom:6}}>Invoices generated!</div>
  <div style={{fontSize:13,color:"#666",marginBottom:6}}>{uChan?.name} data processed.</div>
  <div style={{fontSize:13,color:P.teal,fontWeight:600,marginBottom:20}}>Auto-detected period: {MONTHS[mi]} {fy} — view switched automatically</div>
  <div style={{display:"flex",gap:12,justifyContent:"center"}}>
    <button onClick={resetUp} className="sv">Upload another</button>
    <button onClick={()=>{resetUp();sVw("sales");sSvm("ledger");}} className="gb">View invoices {"\u2192"}</button>
    <button onClick={()=>{resetUp();sVw("sales");sSvm("report");}} style={{padding:"10px 24px",background:P.teal,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>Weekly report {"\u2192"}</button>
  </div>
</div>}
</div>}

{vw==="sales"&&<div>
  <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center"}}>
    <button className={`st ${svm==="create"?"sa":"si"}`} onClick={()=>sSvm("create")}>Raise invoice</button>
    <button className={`st ${svm==="ledger"?"sa":"si"}`} onClick={()=>sSvm("ledger")}>Ledger</button>
    <button className={`st ${svm==="report"?"sa":"si"}`} onClick={()=>sSvm("report")}>Weekly report</button>
    {mInv.length>0&&<span style={{fontSize:12,color:P.teal,fontWeight:600,marginLeft:8}}>{mInv.length} inv — {"\u20B9"}{fN(mInv.reduce((s,i)=>s+i.subtotal,0))}</span>}
  </div>

  {svm==="create"&&<div style={{position:"relative"}}>
    <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e2e2",overflow:"hidden"}}>
      <div style={{background:`linear-gradient(135deg,${P.navy},${P.blue})`,padding:"14px 20px",display:"flex",justifyContent:"space-between"}}><div><div style={{color:"#fff",fontSize:15,fontWeight:700}}>New invoice</div></div><div style={{color:"#fff",fontSize:14,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>{nxId}</div></div>
      <div style={{padding:20}}>
        <div style={{display:"flex",gap:16,marginBottom:20,flexWrap:"wrap"}}>
          <div style={{flex:"1 1 200px"}}><label style={{fontSize:11,fontWeight:600,color:"#666"}}>Date</label><input type="date" value={iDate} onChange={e=>hDC(e.target.value)} style={{display:"block",padding:"10px",border:"1px solid #d8d8d8",borderRadius:8,fontSize:13,width:"100%",boxSizing:"border-box",marginTop:4}}/></div>
          <div style={{flex:"1 1 250px"}}><label style={{fontSize:11,fontWeight:600,color:"#666"}}>Channel</label><select value={iCust} onChange={e=>{if(e.target.value==="__add__")sShAC(true);else sICust(e.target.value);}} style={{display:"block",padding:"10px",border:"1px solid #d8d8d8",borderRadius:8,fontSize:13,width:"100%",background:"#fff",marginTop:4}}>{allC.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}<option value="__add__">+ Add new...</option></select></div>
        </div>
        <label style={{fontSize:11,fontWeight:600,color:"#666",marginBottom:8,display:"block"}}>Line items</label>
        {iItems.map((it,idx)=><div key={idx} className="il">
          <div style={{flex:"1 1 140px"}}><span style={{fontSize:10,color:"#999"}}>SKU</span><select value={it.sku} onChange={e=>{const n=[...iItems];n[idx]={...n[idx],sku:e.target.value};sIItems(n);}} style={{display:"block",padding:"8px",border:"1px solid #e2e2e2",borderRadius:6,fontSize:13,width:"100%",background:"#fff"}}>{DSKUS.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
          <div style={{flex:"0 0 90px"}}><span style={{fontSize:10,color:"#999"}}>Qty</span><input type="number" value={it.qty||""} onChange={e=>{const n=[...iItems];n[idx]={...n[idx],qty:parseInt(e.target.value)||0};sIItems(n);}} style={{display:"block",padding:"8px",border:"1px solid #e2e2e2",borderRadius:6,fontSize:13,width:"100%"}}/></div>
          <div style={{flex:"0 0 100px"}}><span style={{fontSize:10,color:"#999"}}>Price/unit</span><input type="number" value={it.price||""} onChange={e=>{const n=[...iItems];n[idx]={...n[idx],price:parseFloat(e.target.value)||0};sIItems(n);}} style={{display:"block",padding:"8px",border:"1px solid #e2e2e2",borderRadius:6,fontSize:13,width:"100%"}}/></div>
          <div style={{flex:"1 1 120px"}}><span style={{fontSize:10,color:"#999"}}>Customer name</span><input value={it.custName||""} onChange={e=>{const n=[...iItems];n[idx]={...n[idx],custName:e.target.value};sIItems(n);}} placeholder="Optional" style={{display:"block",padding:"8px",border:"1px solid #e2e2e2",borderRadius:6,fontSize:13,width:"100%",boxSizing:"border-box"}}/></div>
          <div style={{flex:"0 0 90px",textAlign:"right"}}><span style={{fontSize:10,color:"#999"}}>Total</span><div style={{fontSize:14,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",padding:"8px 0"}}>{"\u20B9"}{fN(iLT(it))}</div></div>
          {iItems.length>1&&<button className="db" onClick={()=>{const n=[...iItems];n.splice(idx,1);sIItems(n);}}>✕</button>}
        </div>)}
        <button onClick={()=>sIItems([...iItems,{sku:"Millet",qty:0,price:0}])} style={{padding:"6px 14px",background:"#f0f4fa",border:"1px dashed #bbb",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",color:P.acc,marginBottom:16}}>+ Add item</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",background:"#f0f6ff",borderRadius:10,flexWrap:"wrap",gap:12}}>
          <div><span style={{fontSize:12,color:"#666"}}>Units: </span><b>{fN(iUnits)}</b><span style={{fontSize:12,color:"#666",marginLeft:12}}>COGS: </span><b style={{color:P.red}}>{"\u20B9"}{fN(iUnits*22)}</b></div>
          <div style={{display:"flex",alignItems:"center",gap:16}}><div><div style={{fontSize:12,color:"#666"}}>Total</div><div style={{fontSize:24,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{"\u20B9"}{fN(iSub)}</div></div><button className="rb" disabled={iSub<=0} onClick={raiseInv}>Raise invoice</button></div>
        </div>
      </div>
    </div>
    {shAC&&<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(15,27,45,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,borderRadius:10,minHeight:400}}><div style={{background:"#fff",borderRadius:12,padding:24,width:340}}><div style={{fontSize:15,fontWeight:700,marginBottom:16}}>Add channel</div><div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:600,color:"#666"}}>Channel name</label><input value={nCN} onChange={e=>sNCN(e.target.value)} placeholder="e.g. Zepto, BigBasket..." style={{width:"100%",padding:10,border:"1px solid #d8d8d8",borderRadius:8,fontSize:13,marginTop:4,boxSizing:"border-box"}}/></div><div style={{marginBottom:16}}><label style={{fontSize:11,fontWeight:600,color:"#666"}}>Channel type</label><select value={nCC} onChange={e=>sNCC(e.target.value)} style={{width:"100%",padding:10,border:"1px solid #d8d8d8",borderRadius:8,fontSize:13,marginTop:4,background:"#fff"}}>{CK.map(k=><option key={k} value={k}>{CL[k]}</option>)}</select></div><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>sShAC(false)} style={{padding:"8px 20px",border:"1px solid #ddd",borderRadius:6,background:"#fff",cursor:"pointer",fontSize:13,fontWeight:600}}>Cancel</button><button onClick={addCust} style={{padding:"8px 20px",border:"none",borderRadius:6,background:P.acc,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600}}>Add</button></div></div></div>}
  </div>}

  {svm==="ledger"&&<div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e2e2",overflow:"hidden"}}>
    <div style={{padding:"12px 18px",background:"#f0f4fa",display:"flex",justifyContent:"space-between"}}><b>{MONTHS[mi]} invoices</b><span style={{fontSize:12,color:"#888"}}>{mInv.length} | {"\u20B9"}{fN(mInv.reduce((s,i)=>s+i.subtotal,0))}</span></div>
    {!mInv.length?<div style={{padding:40,textAlign:"center",color:"#999"}}><div style={{fontSize:28,marginBottom:8}}>{"\uD83D\uDCCB"}</div>No invoices for {MONTHS[mi]}</div>:
    <table className="it"><thead><tr><th>Invoice</th><th>Date</th><th>Channel</th><th>SKUs</th><th style={{textAlign:"right"}}>Units</th><th style={{textAlign:"right"}}>Amount</th><th style={{width:40}}></th></tr></thead>
    <tbody>{[...mInv].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(iv=><tr key={iv.id}>
      <td><span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600,fontSize:12,color:P.acc}}>{iv.id}</span>{iv.source&&<div><Bg text={iv.source} color="#888" bg="#f0f0f0"/></div>}</td>
      <td style={{fontSize:12}}>{new Date(iv.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</td>
      <td><b style={{fontSize:12}}>{iv.channel||iv.customer}</b><div><Bg text={SC[iv.channelType||iv.channel]||iv.channelType||iv.channel} color="#2A5F8F" bg="#e6f1fb"/></div></td>
      <td><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{iv.items.map((it,i)=><Bg key={i} text={`${it.sku} \u00D7${it.qty}`} color={SKUC[it.sku]||"#555"} bg={(SKUC[it.sku]||"#888")+"18"}/>)}</div></td>
      <td style={{textAlign:"right",fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{fN(iv.units)}</td>
      <td style={{textAlign:"right",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{"\u20B9"}{fN(iv.subtotal)}</td>
      <td><button className="db" onClick={()=>delInv(iv.id)}>{"\u2715"}</button></td>
    </tr>)}</tbody></table>}
  </div>}

  {svm==="report"&&<div>
    <div style={{display:"flex",gap:8,marginBottom:16}}><span style={{fontSize:12,fontWeight:600,color:"#888"}}>Filter:</span>{[{v:0,l:"All"},{v:1,l:"W1"},{v:2,l:"W2"},{v:3,l:"W3"},{v:4,l:"W4"}].map(w=><button key={w.v} className={`wb ${sw===w.v?"ws":""}`} onClick={()=>sSw(w.v)}>{w.l}</button>)}</div>
    <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}><KPI label="Revenue" value={fmt(tWR)} sub={`${tWO} orders`}/><KPI label="Units" value={fN(tWU)} sub={`COGS \u20B9${fN(tWU*22)}`}/><KPI label="AOV" value={fmt(tWO?Math.round(tWR/tWO):0)}/><KPI label="GP" value={fmt(tWR-tWU*22)} color={tWR-tWU*22>=0?P.teal:P.red}/></div>
    {!mInv.length?<div style={{textAlign:"center",padding:40,color:"#999",background:"#fff",borderRadius:10}}><div style={{fontSize:32,marginBottom:8}}>{"\uD83D\uDCCA"}</div>No data for {MONTHS[mi]}</div>:
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div style={{background:"#fff",borderRadius:10,padding:16,border:"1px solid #eee"}}><div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Weekly revenue</div><ResponsiveContainer width="100%" height={200}><BarChart data={wkD}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="week" tick={{fontSize:12}}/><YAxis tick={{fontSize:11}} tickFormatter={v=>fmt(v)}/><Tooltip formatter={v=>"\u20B9"+Math.round(v).toLocaleString("en-IN")}/><Bar dataKey="rev" fill={P.acc} radius={[4,4,0,0]} name="Revenue"/></BarChart></ResponsiveContainer></div>
      <div style={{background:"#fff",borderRadius:10,padding:16,border:"1px solid #eee"}}><div style={{fontSize:13,fontWeight:600,marginBottom:10}}>SKU mix</div>{skD.length?<><ResponsiveContainer width="100%" height={170}><PieChart><Pie data={skD} dataKey="rev" nameKey="sku" cx="50%" cy="50%" outerRadius={65} innerRadius={35} paddingAngle={2} stroke="none">{skD.map((d,i)=><Cell key={i} fill={SKUC[d.sku]||CC[i%4]}/>)}</Pie><Tooltip formatter={v=>"\u20B9"+Math.round(v).toLocaleString("en-IN")}/></PieChart></ResponsiveContainer><div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>{skD.map((d,i)=><span key={i} style={{fontSize:11,display:"flex",alignItems:"center",gap:4,color:"#666"}}><span style={{width:8,height:8,borderRadius:2,background:SKUC[d.sku]||CC[i%4],display:"inline-block"}}/>{d.sku} {tWR?Math.round(d.rev/tWR*100):0}%</span>)}</div></>:<div style={{padding:40,color:"#ccc",textAlign:"center"}}>No data</div>}</div>
      <div style={{background:"#fff",borderRadius:10,border:"1px solid #eee",overflow:"hidden"}}><div style={{padding:"10px 16px",background:"#f0f4fa",fontSize:13,fontWeight:600}}>SKU table</div><table className="it"><thead><tr><th>SKU</th><th style={{textAlign:"right"}}>Qty</th><th style={{textAlign:"right"}}>Revenue</th><th style={{textAlign:"right"}}>%</th></tr></thead><tbody>{skD.map((d,i)=><tr key={i}><td style={{fontWeight:600}}>{d.sku}</td><td style={{textAlign:"right",fontFamily:"'JetBrains Mono',monospace"}}>{fN(d.qty)}</td><td style={{textAlign:"right",fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{"\u20B9"}{fN(d.rev)}</td><td style={{textAlign:"right"}}>{tWR?Math.round(d.rev/tWR*100):0}%</td></tr>)}</tbody></table></div>
      <div style={{background:"#fff",borderRadius:10,border:"1px solid #eee",overflow:"hidden"}}><div style={{padding:"10px 16px",background:"#f0f4fa",fontSize:13,fontWeight:600}}>Channels</div><table className="it"><thead><tr><th>Channel</th><th style={{textAlign:"right"}}>Orders</th><th style={{textAlign:"right"}}>Revenue</th></tr></thead><tbody>{csD.map((d,i)=><tr key={i}><td><b style={{fontSize:12}}>{d.name}</b><div><Bg text={SC[d.channelType]||d.channelType||""} color="#2A5F8F" bg="#e6f1fb"/></div></td><td style={{textAlign:"right",fontFamily:"'JetBrains Mono',monospace"}}>{d.ord}</td><td style={{textAlign:"right",fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{"\u20B9"}{fN(d.rev)}</td></tr>)}</tbody></table></div>
      <div style={{background:"#fff",borderRadius:10,border:"1px solid #eee",overflow:"hidden"}}><div style={{padding:"10px 16px",background:"#f0f4fa",fontSize:13,fontWeight:600}}>Top customers</div><table className="it"><thead><tr><th>Customer</th><th style={{textAlign:"right"}}>Units</th><th style={{textAlign:"right"}}>Revenue</th><th style={{textAlign:"right"}}>%</th></tr></thead><tbody>{topCusts.slice(0,15).map((d,i)=><tr key={i}><td style={{fontWeight:600,fontSize:12}}>{d.name}</td><td style={{textAlign:"right",fontFamily:"'JetBrains Mono',monospace"}}>{fN(d.units)}</td><td style={{textAlign:"right",fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{"\u20B9"}{fN(d.rev)}</td><td style={{textAlign:"right"}}>{tWR?Math.round(d.rev/tWR*100):0}%</td></tr>)}</tbody></table></div>
    </div>}
  </div>}
</div>}

{vw==="input"&&<div>
  <Sec title="Revenue by channel" icon={"\uD83D\uDCCA"}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{CK.map(k=><Fld key={k} label={CL[k]} value={dt[k]} onChange={v=>upd(k,v)}/>)}</div><div style={{marginTop:12,padding:"10px 14px",background:"#f0f6ff",borderRadius:8,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:600,color:P.acc}}>Total revenue</span><span style={{fontSize:18,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{"\u20B9"}{fN(tS)}</span></div></Sec>
  <Sec title="Units & inventory" icon={"\uD83D\uDCE6"}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}><Fld label="Units sold" value={dt.units_sold} onChange={v=>upd("units_sold",v)} prefix="#" highlight/><Fld label="Cost/unit" value={dt.cost_per_unit} onChange={v=>upd("cost_per_unit",v)}/><div style={{display:"flex",flexDirection:"column",gap:3,justifyContent:"flex-end"}}><div style={{fontSize:11,color:"#666"}}>COGS</div><div style={{padding:"8px 12px",background:"#fef3f2",borderRadius:6,fontSize:14,fontWeight:700,color:P.red,fontFamily:"'JetBrains Mono',monospace"}}>{"\u20B9"}{fN(cogs)}</div></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginTop:12}}><Fld label="Opening stock" value={dt.opening_stock} onChange={v=>upd("opening_stock",v)}/><Fld label="Purchases" value={dt.purchases} onChange={v=>upd("purchases",v)}/><Fld label="Closing stock" value={dt.closing_stock} onChange={v=>upd("closing_stock",v)}/></div></Sec>
  <Sec title="Variable costs" icon={"\uD83D\uDE9A"}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}><Fld label="Packaging" value={dt.packaging} onChange={v=>upd("packaging",v)}/><Fld label="Marketplace fees" value={dt.marketplace_fees} onChange={v=>upd("marketplace_fees",v)}/><Fld label="Courier" value={dt.courier} onChange={v=>upd("courier",v)}/></div></Sec>
  <Sec title="Marketing" icon={"\uD83D\uDCE3"}><div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}><Fld label="Marketing & advertising" value={dt.marketing} onChange={v=>upd("marketing",v)} highlight/><div style={{display:"flex",flexDirection:"column",gap:3,justifyContent:"flex-end"}}><div style={{fontSize:11,color:"#666"}}>ROAS</div><div style={{padding:"8px 12px",background:roas<5?"#fef3f2":"#e8f5e9",borderRadius:6,fontSize:14,fontWeight:700,color:roas<5?P.red:P.grn,fontFamily:"'JetBrains Mono',monospace"}}>{roas.toFixed(1)}x</div></div></div></Sec>
  <Sec title="Operating expenses" icon={"\uD83C\uDFE2"} open={false}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>{OK.map(k=><Fld key={k} label={OL[k]} value={dt[k]} onChange={v=>upd(k,v)}/>)}</div><div style={{marginTop:12,padding:"10px 14px",background:"#fef3f2",borderRadius:8,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:600,color:P.red}}>Total OpEx</span><span style={{fontSize:18,fontWeight:700,color:P.red,fontFamily:"'JetBrains Mono',monospace"}}>{"\u20B9"}{fN(tOp)}</span></div></Sec>
  <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:20}}><button className="sv" onClick={saveDt}>{sv?"Saving...":"Save "+MONTHS[mi]}</button><button className="gb" onClick={()=>{saveDt();sVw("dashboard");}}>Dashboard {"\u2192"}</button></div>
</div>}

{vw==="dashboard"&&<div>
  <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>{MONTHS[mi]} — Dashboard</div>
  <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}><KPI label="Revenue" value={fmt(tS)} sub={moM!=null?(moM>=0?"+":"")+pc(moM)+" MoM":null}/><KPI label="Units" value={fN(dt.units_sold)} sub={"COGS \u20B9"+fN(cogs)}/><KPI label="GP%" value={pc(tS?gp/tS:0)} color={P.teal}/><KPI label="CM2" value={pc(tS?cm2/tS:0)} sub={"ROAS "+roas.toFixed(1)+"x"}/><KPI label="EBITDA" value={fmt(ebitda)} color={ebitda<0?P.red:P.teal} sub={pc(tS?ebitda/tS:0)+" margin"}/></div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
    <div style={{background:"#fff",borderRadius:10,padding:16,border:"1px solid #eee"}}><div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Channel mix</div><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={chD} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={2} stroke="none">{chD.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip formatter={v=>"\u20B9"+Math.round(v).toLocaleString("en-IN")}/></PieChart></ResponsiveContainer><div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>{chD.map((d,i)=><span key={i} style={{fontSize:11,display:"flex",alignItems:"center",gap:4,color:"#666"}}><span style={{width:8,height:8,borderRadius:2,background:d.color,display:"inline-block"}}/>{d.name} {tS?Math.round(d.value/tS*100):0}%</span>)}</div></div>
    <div style={{background:"#fff",borderRadius:10,padding:16,border:"1px solid #eee"}}><div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Unit economics</div>{[{l:"Rev/unit",v:dt.units_sold?tS/dt.units_sold:0,c:"#3266ad",b:"#e6f1fb"},{l:"COGS/unit",v:dt.cost_per_unit||22,c:P.red,b:"#fef3f2"},{l:"GP/unit",v:dt.units_sold?gp/dt.units_sold:0,c:P.teal,b:"#e8f5e9"},{l:"CM1/unit",v:dt.units_sold?cm1/dt.units_sold:0,c:P.amb,b:"#fef6e6"},{l:"EBITDA/unit",v:dt.units_sold?ebitda/dt.units_sold:0,c:ebitda<0?P.red:P.teal,b:ebitda<0?"#fef3f2":"#e8f5e9"}].map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",background:r.b,borderRadius:6,marginBottom:4}}><span style={{fontSize:12,color:r.c,fontWeight:500}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.c,fontFamily:"'JetBrains Mono',monospace"}}>{r.v<0?"(\u20B9"+Math.abs(r.v).toFixed(2)+")":"\u20B9"+r.v.toFixed(2)}</span></div>)}</div>
  </div>
</div>}

{vw==="pl"&&<div style={{background:"#fff",borderRadius:10,border:"1px solid #eee",overflow:"hidden"}}>
  <div style={{background:P.navy,padding:"12px 18px",display:"flex",justifyContent:"space-between"}}><span style={{color:"#fff",fontSize:14,fontWeight:700}}>P&L — {MONTHS[mi]} {fy}</span></div>
  <div style={{display:"flex",padding:"8px 14px",background:"#f0f4fa",fontSize:12,fontWeight:600,color:"#666"}}><span style={{flex:1}}>Particulars</span><span style={{width:110,textAlign:"right"}}>Amount</span><span style={{width:70,textAlign:"right"}}>%</span></div>
  <PLR label="REVENUE" value={tS} rev={tS} bold bg="#e6f1fb"/>{CK.map(k=><PLR key={k} label={CL[k]} value={dt[k]} rev={tS} indent={1}/>)}<div style={{height:6,background:"#f8f9fb"}}/>
  <PLR label="COGS" value={-cogs} rev={tS} bold bg="#fef3f2"/><div style={{height:6,background:"#f8f9fb"}}/>
  <PLR label="GROSS PROFIT" value={gp} rev={tS} bold bg="#e8f5e9"/><div style={{height:4,background:"#f8f9fb"}}/>
  <PLR label="Packaging" value={-dt.packaging} rev={tS} indent={1}/><PLR label="Marketplace" value={-dt.marketplace_fees} rev={tS} indent={1}/><PLR label="Courier" value={-dt.courier} rev={tS} indent={1}/>
  <PLR label="CM1" value={cm1} rev={tS} bold bg="#fff9e6"/><div style={{height:4,background:"#f8f9fb"}}/>
  <PLR label="Marketing" value={-dt.marketing} rev={tS} indent={1}/><PLR label="CM2" value={cm2} rev={tS} bold bg="#fff9e6"/><div style={{height:4,background:"#f8f9fb"}}/>
  {OK.filter(k=>(dt[k]||0)>0).map(k=><PLR key={k} label={OL[k]} value={-dt[k]} rev={tS} indent={1}/>)}
  <PLR label="Total OpEx" value={-tOp} rev={tS} bold bg="#fef3f2"/><div style={{height:6,background:"#f8f9fb"}}/>
  <PLR label="EBITDA" value={ebitda} rev={tS} bold bg={ebitda>=0?"#e8f5e9":"#fef3f2"}/>
</div>}

{vw==="trends"&&tD.length>0&&<div>
  <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>Trends ({tD.length} months)</div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
    <div style={{background:"#fff",borderRadius:10,padding:16,border:"1px solid #eee"}}><div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Revenue & EBITDA</div><ResponsiveContainer width="100%" height={220}><ComposedChart data={tD}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="month" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}} tickFormatter={v=>Math.round(v/1e3)+"K"}/><Tooltip formatter={v=>"\u20B9"+Math.round(v).toLocaleString("en-IN")}/><Bar dataKey="sales" fill="#3266ad" name="Revenue" radius={[3,3,0,0]}/><Line dataKey="ebitda" stroke={P.red} strokeWidth={2} dot={{r:3}} name="EBITDA"/></ComposedChart></ResponsiveContainer></div>
    <div style={{background:"#fff",borderRadius:10,padding:16,border:"1px solid #eee"}}><div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Channel mix</div><ResponsiveContainer width="100%" height={220}><BarChart data={tD}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="month" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}} tickFormatter={v=>Math.round(v/1e3)+"K"}/><Tooltip formatter={v=>"\u20B9"+Math.round(v).toLocaleString("en-IN")}/>{CK.map((k,i)=><Bar key={k} dataKey={k} stackId="s" fill={CC[i]} name={SC[k]}/>)}</BarChart></ResponsiveContainer></div>
  </div>
</div>}
{vw==="trends"&&!tD.length&&<div style={{textAlign:"center",padding:60,color:"#999"}}><div style={{fontSize:32,marginBottom:8}}>{"\uD83D\uDCC8"}</div><div style={{fontSize:14,fontWeight:600}}>No data yet</div></div>}

      </div>
      <div style={{background:P.navy,padding:"10px 20px",borderRadius:"0 0 12px 12px",display:"flex",justifyContent:"space-between"}}><span style={{color:"#6688aa",fontSize:11}}>Plant Essentials — Investor MIS</span><span style={{color:"#6688aa",fontSize:11}}>{inv.length} invoices stored{cc.length>0?` | ${cc.length} custom channels`:""} | Data persists across sessions</span></div>
    </div>
  );
}
