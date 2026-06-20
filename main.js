
function updateClock(){
  const now = new Date();
  const el = document.getElementById("digitalClock");
  if(el){
    el.innerHTML = now.toLocaleTimeString('th-TH') + "<br>" + now.toLocaleDateString('th-TH');
  }
}
setInterval(updateClock,1000);
updateClock();
