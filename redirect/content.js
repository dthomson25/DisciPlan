var newdiv = document.createElement('div'); 
newdiv.setAttribute('id','DisciPlanDiv');
newdiv.setAttribute('style', 'display: none');
var timeOpened = new Date();
newdiv.innerHTML = timeOpened.toString();
document.body.appendChild(newdiv);
