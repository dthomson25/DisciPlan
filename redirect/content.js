var newdiv = document.createElement('div'); 
newdiv.setAttribute('id','DisciPlanDiv');
var timeOpened = new Date();
newdiv.innerHTML = timeOpened.toString();
document.body.appendChild(newdiv);
