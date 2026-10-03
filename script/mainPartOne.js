windowManager.open(desktop);


document
.querySelector("#wechat")
.onclick=function(){

    windowManager.open(wechat);

};


document
.querySelector("#close")
.onclick=function(){

    windowManager.back();

};