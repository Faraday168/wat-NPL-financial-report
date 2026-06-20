
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, doc, setDoc, increment, serverTimestamp, collection, query, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
const app=initializeApp(firebaseConfig), db=getFirestore(app);
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toNum=v=>Number(String(v??0).replace(/,/g,''))||0;
const money=n=>toNum(n).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
const defaults={
 settings:{templeName:'วัดหนองไผ่ล้อม ปากช่อง',address:'300 ม.14 ต.หนองสาหร่าย อ.ปากช่อง จ.นครราชสีมา 30130',phone:'083-386-9519',facebookUrl:'https://www.facebook.com/',abbotImage:'',abbotCaption:'ใจที่โปร่งใส ทำให้บุญงดงาม',logoUrl:''},
 balances:{bank1Name:'บัญชีที่ 1 ธ.ไทยพาณิชย์',bank1Amount:0,bank2Name:'บัญชีที่ 2 ธ.กสิกรไทย',bank2Amount:0,cashAmount:0,updatedAtText:'-'},
 donate:{note:'ร่วมทำบุญได้ตามกำลังศรัทธา',qrImage1:'',accountName1:'วัดหนองไผ่ล้อม ปากช่อง',accountNumber1:'',qrPurpose1:'เพื่อสร้างเสนาสนะ และค่าไฟฟ้า (ชำระหนี้สงฆ์)',qrImage2:'',accountName2:'วัดหนองไผ่ล้อม ปากช่อง',accountNumber2:'',qrPurpose2:'เพื่อกองทุนสร้างโบสถ์'}
};
function setText(id,v){const e=$(id);if(e)e.textContent=v??''}
function showImg(id,placeholderId,url){const img=$(id),ph=$(placeholderId);if(!img)return;if(url){img.src=url;img.style.display='block';if(ph)ph.style.display='none'}else{img.removeAttribute('src');img.style.display='none';if(ph)ph.style.display='flex'}}
function showLogo(url){const wrap=$('templeLogoWrap'),img=$('templeLogo'),ph=$('templeLogoPlaceholder');if(!wrap||!img)return;wrap.style.display='flex';if(url){img.src=url;img.style.display='block';if(ph)ph.style.display='none'}else{img.removeAttribute('src');img.style.display='none';if(ph)ph.style.display='flex'}}
function applySettings(s={}){s={...defaults.settings,...s};setText('templeName',s.templeName);setText('heroTemple',s.templeName);setText('address',s.address);setText('phone',s.phone);setText('abbotCaption',s.abbotCaption);const fb=$('fbLink');if(fb)fb.href=s.facebookUrl||'#';showImg('abbotImage','abbotPlaceholder',s.abbotImage);showLogo(s.logoUrl)}
function applyBalances(b={}){b={...defaults.balances,...b};setText('updatedText',b.updatedAtText||'-');setText('bank1Name',b.bank1Name||'บัญชีที่ 1 ธ.ไทยพาณิชย์');setText('bank1Amount','฿ '+money(b.bank1Amount));setText('bank2Name',b.bank2Name||'บัญชีที่ 2 ธ.กสิกรไทย');setText('bank2Amount','฿ '+money(b.bank2Amount));setText('cashAmount','฿ '+money(b.cashAmount));setText('totalAmount','฿ '+money(toNum(b.bank1Amount)+toNum(b.bank2Amount)+toNum(b.cashAmount)))}
function applyDonate(d={}){d={...defaults.donate,...d};setText('donateNote',d.note);setText('accountName1',d.accountName1||'-');setText('accountNumber1',d.accountNumber1||'-');setText('qrPurpose1',d.qrPurpose1||defaults.donate.qrPurpose1);setText('accountName2',d.accountName2||'-');setText('accountNumber2',d.accountNumber2||'-');setText('qrPurpose2',d.qrPurpose2||defaults.donate.qrPurpose2);showImg('qrImage1','qr1Placeholder',d.qrImage1);showImg('qrImage2','qr2Placeholder',d.qrImage2)}
function imgBlock(url){return url?`<img src="${esc(url)}" onerror="this.outerHTML='<div class=&quot;placeholder&quot;>โหลดรูปไม่ได้</div>'">`:`<div class="placeholder">ยังไม่มีรูป</div>`}
function percent(p){if(p.percentOverride!==''&&p.percentOverride!==undefined&&p.percentOverride!==null)return Math.max(0,Math.min(100,toNum(p.percentOverride)));return toNum(p.budget)?Math.max(0,Math.min(100,toNum(p.spent)/toNum(p.budget)*100)):0}
function projectCard(p){const x=percent(p);return`<article class="card project"><div class="two-img">${imgBlock(p.image1)}${imgBlock(p.image2)}</div><span class="badge">${esc(p.status||'กำลังดำเนินการ')}</span><h3>${esc(p.title||'')}</h3><p class="muted">${esc(p.description||'')}</p><div class="project-meta"><b>งบประมาณ: ฿ ${money(p.budget)}</b><b>ใช้ไปแล้ว: ฿ ${money(p.spent)}</b></div><div class="progress"><div class="bar" style="width:${x}%"></div></div><p><b>ความคืบหน้า ${x.toFixed(1)}%</b></p><p class="muted">อัปเดต: ${esc(p.projectUpdatedAtText||p.updatedAtText||'-')}</p></article>`}
function listenDoc(path,fallback,cb){onSnapshot(doc(db,...path),s=>cb(s.exists()?s.data():fallback),e=>{console.warn(e);cb(fallback)})}
function listenProjects(){onSnapshot(query(collection(db,'projects'),orderBy('createdAt','desc')),snap=>{const arr=snap.docs.map(d=>({id:d.id,...d.data()}));$('projects').innerHTML=arr.length?arr.map(projectCard).join(''):'<div class="card">ยังไม่มีโครงการ ให้เพิ่มจากหน้าแอดมิน</div>'},e=>{$('projects').innerHTML='<div class="card">อ่านข้อมูลโครงการไม่ได้: '+esc(e.message)+'</div>'})}
async function viewCount(){try{if(!localStorage.getItem('viewedNPL')){await setDoc(doc(db,'stats','site'),{views:increment(1),updatedAt:serverTimestamp()},{merge:true});localStorage.setItem('viewedNPL','1')}onSnapshot(doc(db,'stats','site'),s=>{if(s.exists())setText('viewCount',Number(s.data().views||0).toLocaleString('th-TH'))})}catch(e){}}
function updateDigitalDate(){const now=new Date();const time=now.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',second:'2-digit'});const date=now.toLocaleDateString('th-TH',{weekday:'long',year:'numeric',month:'long',day:'numeric'});setText('digitalTime',time);setText('digitalDate',date)}
setInterval(updateDigitalDate,1000);updateDigitalDate();
listenDoc(['settings','site'],defaults.settings,applySettings);listenDoc(['finance','balances'],defaults.balances,applyBalances);listenDoc(['finance','donate'],defaults.donate,applyDonate);listenProjects();viewCount();
