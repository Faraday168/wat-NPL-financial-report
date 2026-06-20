
import { firebaseConfig } from '../assets/js/firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, getDocs, deleteDoc, serverTimestamp, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app);
const $=id=>document.getElementById(id);
const v=id=>($(id)?.value||'').trim();
const parseNum=id=>Number(v(id).replace(/,/g,''))||0;
const formatNum=x=>Number(String(x??0).replace(/,/g,'')).toLocaleString('th-TH',{maximumFractionDigits:2});
const msg=t=>{$('status').textContent=t};
const projectFields=['title','description','budget','spent','percentOverride','image1','image2','status','projectUpdatedAtText'];
const moneyFields=['bank1Amount','bank2Amount','cashAmount','budget','spent','percentOverride'];

function attachCommaFormat(id){
  const el=$(id); if(!el) return;
  el.addEventListener('blur',()=>{const raw=el.value.replace(/,/g,'').trim(); if(raw!=='' && !isNaN(Number(raw))) el.value=formatNum(raw);});
  el.addEventListener('focus',()=>{el.value=el.value.replace(/,/g,'');});
}
moneyFields.forEach(attachCommaFormat);

onAuthStateChanged(auth,async user=>{ $('loginBox').style.display=user?'none':'block'; $('adminBox').style.display=user?'block':'none'; if(user){ msg('เข้าสู่ระบบแล้ว'); await loadAll(); }});
$('loginForm').onsubmit=e=>{e.preventDefault(); signInWithEmailAndPassword(auth,v('email'),v('password')).catch(e=>msg('เข้าไม่ได้: '+e.message));};
$('logoutBtn').onclick=()=>signOut(auth);
['abbotImage','qrImage','image1','image2'].forEach(id=>$(id)?.addEventListener('input',()=>preview(id,id+'Preview')));
function preview(inputId,imgId){const url=v(inputId),img=$(imgId); if(url){img.src=url;img.style.display='block'}else img.style.display='none'}
async function loadDoc(path,ids){try{const s=await getDoc(doc(db,...path)); if(!s.exists())return; const x=s.data(); ids.forEach(id=>{if($(id)) $(id).value=x[id]??''}); moneyFields.forEach(id=>{if($(id)&&$(id).value)$(id).value=formatNum($(id).value)});}catch(e){msg('โหลดข้อมูลไม่ได้: '+e.message)}}
async function loadAll(){await loadDoc(['settings','site'],['templeName','address','phone','facebookUrl','abbotImage','abbotCaption']);await loadDoc(['finance','balances'],['bank1Name','bank1Amount','bank2Name','bank2Amount','cashAmount','balanceUpdatedAtText']);await loadDoc(['finance','donate'],['qrImage','accountName','accountNumber','bankName','note']);['abbotImage','qrImage'].forEach(id=>preview(id,id+'Preview'));await loadProjects()}
$('saveSettings').onclick=async()=>{try{await setDoc(doc(db,'settings','site'),{templeName:v('templeName'),address:v('address'),phone:v('phone'),facebookUrl:v('facebookUrl'),abbotImage:v('abbotImage'),abbotCaption:v('abbotCaption'),updatedAt:serverTimestamp()},{merge:true});msg('บันทึกข้อมูลวัดแล้ว เปิดหน้าเว็บจริงแล้วกด Ctrl+F5')}catch(e){msg('บันทึกข้อมูลวัดไม่ได้: '+e.message)}};
$('saveBalances').onclick=async()=>{try{await setDoc(doc(db,'finance','balances'),{bank1Name:v('bank1Name'),bank1Amount:parseNum('bank1Amount'),bank2Name:v('bank2Name'),bank2Amount:parseNum('bank2Amount'),cashAmount:parseNum('cashAmount'),balanceUpdatedAtText:v('balanceUpdatedAtText'),updatedAt:serverTimestamp()},{merge:true});msg('บันทึกยอดเงินแล้ว เปิดหน้าเว็บจริงแล้วกด Ctrl+F5')}catch(e){msg('บันทึกยอดเงินไม่ได้: '+e.message)}};
$('saveDonate').onclick=async()=>{try{await setDoc(doc(db,'finance','donate'),{qrImage:v('qrImage'),accountName:v('accountName'),accountNumber:v('accountNumber'),bankName:v('bankName'),note:v('note'),updatedAt:serverTimestamp()},{merge:true});msg('บันทึกข้อมูลบริจาคแล้ว เปิดหน้าเว็บจริงแล้วกด Ctrl+F5')}catch(e){msg('บันทึกข้อมูลบริจาคไม่ได้: '+e.message)}};
$('saveProject').onclick=async()=>{try{const data={title:v('title'),description:v('description'),budget:parseNum('budget'),spent:parseNum('spent'),percentOverride:v('percentOverride').replace(/,/g,''),image1:v('image1'),image2:v('image2'),status:v('status'),projectUpdatedAtText:v('projectUpdatedAtText'),updatedAt:serverTimestamp()};const id=v('projectId');if(id){await setDoc(doc(db,'projects',id),data,{merge:true});msg('แก้ไขโครงการแล้ว เปิดหน้าเว็บจริงแล้วกด Ctrl+F5')}else{await addDoc(collection(db,'projects'),{...data,createdAt:serverTimestamp()});msg('เพิ่มโครงการแล้ว เปิดหน้าเว็บจริงแล้วกด Ctrl+F5')}clearProject();await loadProjects()}catch(e){msg('บันทึกโครงการไม่ได้: '+e.message)}};
$('clearProject').onclick=clearProject;
function clearProject(){ $('projectId').value=''; projectFields.forEach(id=>$(id).value=''); $('image1Preview').style.display='none'; $('image2Preview').style.display='none'; $('projectMode').textContent='โหมด: เพิ่มโครงการใหม่'; }
async function loadProjects(){let snap;try{snap=await getDocs(query(collection(db,'projects'),orderBy('createdAt','desc')))}catch(e){snap=await getDocs(collection(db,'projects'))}$('projectList').innerHTML=snap.docs.map(d=>{const x=d.data();const pct=String(x.percentOverride??'').trim()!==''?Number(x.percentOverride||0):(Number(x.budget)?Number(x.spent||0)/Number(x.budget)*100:0);return`<div class="item">${x.image1?`<img src="${x.image1}" onerror="this.style.display='none'">`:''}<b>${x.title||d.id}</b><p>งบประมาณ ${formatNum(x.budget)} / ใช้ไป ${formatNum(x.spent)} / ${pct.toFixed(1)}%</p><p>${x.projectUpdatedAtText||''}</p><div class="tools"><button class="btn small" onclick="editProject('${d.id}')">แก้ไข</button><button class="btn small danger" onclick="deleteProject('${d.id}')">ลบ</button></div></div>`}).join('')||'<div class="item">ยังไม่มีโครงการ</div>'}
window.editProject=async id=>{try{const s=await getDoc(doc(db,'projects',id));if(!s.exists())return;const x=s.data();$('projectId').value=id;projectFields.forEach(k=>$(k).value=x[k]??'');['budget','spent','percentOverride'].forEach(k=>{if($(k).value)$(k).value=formatNum($(k).value)});preview('image1','image1Preview');preview('image2','image2Preview');$('projectMode').textContent='โหมด: แก้ไขโครงการ';window.scrollTo({top:document.getElementById('projectForm').offsetTop-30,behavior:'smooth'})}catch(e){msg('เปิดรายการไม่ได้: '+e.message)}};
window.deleteProject=async id=>{if(confirm('ลบโครงการนี้?')){try{await deleteDoc(doc(db,'projects',id));msg('ลบโครงการแล้ว');loadProjects()}catch(e){msg('ลบไม่ได้: '+e.message)}}};
$('seedProjects').onclick=async()=>{try{const samples=[{title:'โครงการสร้างพระอุโบสถ',description:'พื้นที่ศักดิ์สิทธิ์สำหรับประกอบศาสนพิธีและเป็นศูนย์รวมจิตใจของชุมชน',budget:500000,spent:125000,percentOverride:'',status:'กำลังดำเนินการ',projectUpdatedAtText:'ข้อมูลตัวอย่าง'},{title:'โครงการสร้างกุฏิสงฆ์',description:'ปรับปรุงที่พักสงฆ์ให้เหมาะแก่การปฏิบัติธรรมและการจำพรรษา',budget:250000,spent:75000,percentOverride:'',status:'กำลังดำเนินการ',projectUpdatedAtText:'ข้อมูลตัวอย่าง'},{title:'กองทุนภัตตาหารและค่าน้ำค่าไฟ',description:'ดูแลภัตตาหารและสาธารณูปโภคประจำวัด เพื่อให้กิจของสงฆ์ดำเนินไปได้อย่างเรียบร้อย',budget:120000,spent:30000,percentOverride:'',status:'เปิดรับสนับสนุน',projectUpdatedAtText:'ข้อมูลตัวอย่าง'}];for(const p of samples)await addDoc(collection(db,'projects'),{...p,image1:'',image2:'',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});msg('สร้างโครงการตัวอย่างแล้ว');loadProjects()}catch(e){msg('สร้างตัวอย่างไม่ได้: '+e.message)}};
