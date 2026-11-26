// 刷新重置统一由桌面的 game-config.js 控制；打开相册不清空存档。

const PASSWORD="12345678";
let activePasswordRequest=null;

const STATE_KEY="photo_folder_state";
const directories = window.EXPLORER_FOLDERS;
let currentDirectory = null;

directories.forEach(directory => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "folder-nav";
    button.dataset.directory = directory.id;
    button.textContent = `📁 ${directory.name}`;
    button.onclick = () => openDirectory(directory.id);
    document.getElementById("folderNavigation").appendChild(button);
});

function openDirectory(id) {
    currentDirectory = directories.find(directory => directory.id === id) || null;
    showFiles();
}

function renderDirectoryPath() {
    document.getElementById("folderTitle").textContent = currentDirectory?.name || "文件夹";
    document.getElementById("folderHeading").textContent = currentDirectory?.id === "photos" ? "照片" : currentDirectory?.name || "文件夹";
    document.getElementById("folderUp").disabled = !currentDirectory;
    document.getElementById("folderPathSeparator").hidden = !currentDirectory;
    document.getElementById("folderPathName").hidden = !currentDirectory;
    document.getElementById("folderPathName").textContent = currentDirectory?.name || "";
    document.querySelectorAll(".folder-nav").forEach(button => {
        const active = button.dataset.directory === (currentDirectory?.id || "");
        button.classList.toggle("folder-current", active);
        if (active) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
    });
}

let state=
JSON.parse(
localStorage.getItem(STATE_KEY)
)
||
{
    status:"normal"
};
function save(){

localStorage.setItem(
STATE_KEY,
JSON.stringify(state)
);

}
function gameConfirm(text){

return new Promise((resolve)=>{


let box=document.getElementById("confirmBox");

let message=document.getElementById("confirmText");


message.innerText=text;


box.classList.remove("hidden");



document.getElementById("confirmYes").onclick=function(){

    box.classList.add("hidden");

    resolve(true);

};



document.getElementById("confirmNo").onclick=function(){

    box.classList.add("hidden");

    resolve(false);

};


});

}
function openFolder(){
let folderWindow=document.getElementById("window");
folderWindow.classList.remove("window-closing");
folderWindow.classList.remove("hidden");
showFiles();
}
function showFiles(){
let box=
document.getElementById("files");
box.innerHTML="";
renderDirectoryPath();
document.getElementById("folderStatus").textContent = "0 个项目";

if (!currentDirectory) {
    directories.forEach(directory => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "file directory-entry";
        const icon = document.createElement("span");
        icon.className = "directory-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "📁";
        const name = document.createElement("span");
        name.className = "file-name";
        name.textContent = directory.name;
        const kind = document.createElement("span");
        kind.className = "file-kind";
        kind.textContent = "文件夹";
        button.append(icon, name, kind);
        button.onclick = () => openDirectory(directory.id);
        box.appendChild(button);
    });
    document.getElementById("folderStatus").textContent = `${directories.length} 个文件夹`;
    return;
}

const files = GameFiles.listFiles(currentDirectory.id);
if (!files.length) {
    const empty = document.createElement("p");
    empty.className = "folder-empty";
    empty.textContent = "此文件夹为空";
    box.appendChild(empty);
}
files.forEach(createFile);
}

function openConfiguredFile(file){
    file = GameFiles.resolve(file);
    if(file.invalidFormat){
        showPreviewError("文件格式错误，无法预览");
        return;
    }
    if(!GameFiles.canPreview(file)){
        showPreviewError("无法预览");
        return;
    }
    if(file.id === "photo-past") return openPast();
    if(file.id === "photo-future") return openFuture();
    if(file.src === "figure/map.jpg"){
        state.mapOpened=true;
        save();
    }
    openPhoto(file.src,false);
}

function showPreviewError(text){
    document.getElementById("filePreviewErrorTitle").textContent = text;
    document.getElementById("filePreviewError").showModal();
}

function createFile(file){
    const button = document.createElement("button");
    button.type = "button";
    button.className = "file";
    button.dataset.fileId = file.id;
    const icon = document.createElement("span");
    icon.className = "file-preview";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = file.locked ? "🔒" : "▧";
    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = GameFiles.displayName(file);
    const kind = document.createElement("span");
    kind.className = "file-kind";
    kind.textContent = GameFiles.typeLabel(file);
    button.append(icon, name, kind);
    button.onclick = () => openConfiguredFile(file);
    button.oncontextmenu = event => {
        event.preventDefault();
        if(file.locked){
            hideFileMenu();
            return;
        }
        showFileMenu(event, file);
    };
    document.getElementById("files").appendChild(button);
    document.getElementById("folderStatus").textContent = document.getElementById("files").children.length + " 个项目";
}

let contextFile = null;
const fileMenu = document.getElementById("fileContextMenu");
const renameDialog = document.getElementById("renameFileDialog");
const renameInput = document.getElementById("renameFileInput");
function hideFileMenu(){ fileMenu.hidden = true; }
function showFileMenu(event, file){
    contextFile = file;
    fileMenu.hidden = false;
    fileMenu.style.left = Math.max(0, Math.min(event.clientX, innerWidth - fileMenu.offsetWidth - 8)) + "px";
    fileMenu.style.top = Math.max(0, Math.min(event.clientY, innerHeight - fileMenu.offsetHeight - 8)) + "px";
    document.getElementById("renameFileButton").focus();
}
document.addEventListener("click", hideFileMenu);
document.addEventListener("keydown", event => { if(event.key === "Escape") hideFileMenu(); });
window.addEventListener("blur", hideFileMenu);
document.getElementById("renameFileButton").onclick = () => {
    if(!contextFile) return;
    hideFileMenu();
    if(GameFiles.resolve(contextFile).locked){
        showPreviewError("这个文件无法更改名称");
        return;
    }
    renameInput.value = GameFiles.resolve(contextFile).name;
    document.getElementById("renameFileError").textContent = "";
    renameDialog.showModal();
    renameInput.focus();
    renameInput.select();
};
document.getElementById("renameFileCancel").onclick = () => renameDialog.close();
document.getElementById("renameFileForm").onsubmit = event => {
    event.preventDefault();
    try {
        GameFiles.rename(contextFile, renameInput.value);
        renameDialog.close();
        showFiles();
    } catch(error){
        document.getElementById("renameFileError").textContent = error.message;
    }
};
const extensionToggle = document.getElementById("showFileExtensions");
extensionToggle.checked = GameFiles.showExtensions();
extensionToggle.onchange = () => {
    GameFiles.setShowExtensions(extensionToggle.checked);
    showFiles();
};
window.addEventListener("storage", event => {
    if([GameFiles.stateKey, GameFiles.settingsKey].includes(event.key)){
        extensionToggle.checked = GameFiles.showExtensions();
        showFiles();
    }
});

async function openPast(){
let password=await requestPassword();

if(password===null){

return;

}
let confirmOpen = await gameConfirm(
"休对故人思故国。你又没法回到过去"
);

if(confirmOpen){

openPhoto(
"figure/past.png",
true
);

}

}

function requestPassword(){
if(activePasswordRequest) return activePasswordRequest;

activePasswordRequest=new Promise((resolve)=>{
    const box=document.getElementById("passwordBox");
    const form=document.getElementById("passwordForm");
    const input=document.getElementById("folderPassword");
    const toggle=document.getElementById("togglePassword");
    const cancel=document.getElementById("cancelPassword");
    const error=document.getElementById("passwordError");
    let settled=false;

    input.value="";
    input.type="password";
    toggle.setAttribute("aria-label","显示密码");
    toggle.setAttribute("aria-pressed","false");
    error.textContent="";
    box.classList.remove("hidden");
    requestAnimationFrame(()=>input.focus());

    const finish=(value)=>{
        if(settled) return;
        settled=true;
        box.classList.add("hidden");
        form.removeEventListener("submit",submitPassword);
        input.removeEventListener("input",limitPassword);
        toggle.removeEventListener("click",toggleVisibility);
        cancel.removeEventListener("click",cancelPassword);
        box.removeEventListener("click",cancelFromBackdrop);
        document.removeEventListener("keydown",cancelFromKeyboard);
        resolve(value);
    };
    const submitPassword=(event)=>{
        event.preventDefault();
        const password=input.value.slice(0,8);
        if(password!==PASSWORD){
            error.textContent="密码错误，请重试";
            input.focus();
            input.select();
            return;
        }
        finish(password);
    };
    const limitPassword=()=>{
        input.value=input.value.slice(0,8);
        error.textContent="";
    };
    const toggleVisibility=()=>{
        const showing=input.type==="text";
        input.type=showing ? "password" : "text";
        toggle.setAttribute("aria-label",showing ? "显示密码" : "隐藏密码");
        toggle.setAttribute("aria-pressed",String(!showing));
        input.focus();
        input.setSelectionRange(input.value.length,input.value.length);
    };
    const cancelPassword=()=>finish(null);
    const cancelFromBackdrop=(event)=>{
        if(event.target===box) finish(null);
    };
    const cancelFromKeyboard=(event)=>{
        if(event.key==="Escape") finish(null);
    };

    form.addEventListener("submit",submitPassword);
    input.addEventListener("input",limitPassword);
    toggle.addEventListener("click",toggleVisibility);
    cancel.addEventListener("click",cancelPassword);
    box.addEventListener("click",cancelFromBackdrop);
    document.addEventListener("keydown",cancelFromKeyboard);
});

activePasswordRequest.then(()=>{
    activePasswordRequest=null;
});

return activePasswordRequest;
}

function openPhoto(src, autoBurn=false){
let viewer=
document.getElementById("viewer");
let img=
document.getElementById("photo");
let closeBtn=
document.getElementById("closeBtn");

img.src=src;

viewer.classList.remove("viewer-closing");
viewer.classList.add("show");

// past 不显示关闭按钮
if(autoBurn){

    closeBtn.style.display="none";
    setTimeout(()=>{

        burn();

    },1000);
}

else{

    closeBtn.style.display="block";

}

}

function burnEdgeNoise(x,time){

return (
    Math.sin(x * 0.055 + time * 0.012) * .55 +
    Math.sin(x * 0.14 - time * 0.019) * .3 +
    Math.sin(x * 0.31 + time * 0.027) * .15
);

}

function drawBurnLine(
    ctx,
    width,
    height,
    front,
    time,
    roughness,
    offset,
    color,
    lineWidth
){

ctx.save();
ctx.beginPath();

let drawing=false;
let sampleStep=Math.max(1,width/180);

for(let x=0;x<=width;x+=sampleStep){

    let y=front-x+burnEdgeNoise(x,time)*roughness+offset;

    if(y>=-25 && y<=height+25){

        if(!drawing){
            ctx.moveTo(x,y);
            drawing=true;
        }else{
            ctx.lineTo(x,y);
        }

    }

}

ctx.strokeStyle=color;
ctx.lineWidth=lineWidth;
ctx.lineCap="round";
ctx.lineJoin="round";
ctx.stroke();
ctx.restore();

}

function spawnAsh(particles,width,height,front,time,roughness,count){

let minX=Math.max(0,front-height);
let maxX=Math.min(width,front);

if(maxX<=minX){
    return;
}

for(let i=0;i<count && particles.length<120;i++){

    let x=minX+Math.random()*(maxX-minX);
    let y=front-x+burnEdgeNoise(x,time)*roughness;
    let isSmoke=Math.random()<.35;

    particles.push({
        kind:isSmoke ? "smoke" : "ash",
        x:x,
        y:y,
        vx:(Math.random()-.38)*(isSmoke ? .48 : .62),
        vy:isSmoke
            ? -.28-Math.random()*.48
            : -.45-Math.random()*.85,
        spin:(Math.random()-.5)*.1,
        angle:Math.random()*Math.PI,
        size:isSmoke
            ? 3+Math.random()*4.5
            : 3+Math.random()*3,
        age:0,
        life:isSmoke
            ? 1250+Math.random()*1150
            : 900+Math.random()*1200,
        shade:isSmoke
            ? 145+Math.floor(Math.random()*45)
            : 190+Math.floor(Math.random()*55)
    });

}

}

function drawAsh(ctx,particles,delta){

for(let i=particles.length-1;i>=0;i--){

    let particle=particles[i];
    particle.age+=delta;

    if(particle.age>=particle.life){
        particles.splice(i,1);
        continue;
    }

    particle.x+=particle.vx*(delta/16.67);
    particle.y+=particle.vy*(delta/16.67);
    particle.vx+=.0025*(delta/16.67);
    particle.angle+=particle.spin*(delta/16.67);

    let alpha=1-particle.age/particle.life;

    ctx.save();
    ctx.translate(particle.x,particle.y);

    if(particle.kind==="smoke"){

        let growth=1+particle.age/particle.life*1.8;
        let radius=particle.size*growth;
        // 用两层半透明圆模拟烟雾，避免每个粒子逐帧创建径向渐变。
        ctx.fillStyle=`rgba(${particle.shade},${particle.shade},${particle.shade},${alpha*.08})`;
        ctx.beginPath();
        ctx.arc(0,0,radius,0,Math.PI*2);
        ctx.fill();
        ctx.fillStyle=`rgba(${particle.shade},${particle.shade},${particle.shade},${alpha*.14})`;
        ctx.beginPath();
        ctx.arc(0,0,radius*.55,0,Math.PI*2);
        ctx.fill();

    }else{

        ctx.rotate(particle.angle);
        // 浅灰碎片在黑底上更清晰，后段再逐渐淡出。
        ctx.fillStyle=`rgba(${particle.shade},${particle.shade},${particle.shade},${Math.sqrt(alpha)*.95})`;
        ctx.fillRect(
            -particle.size/2,
            -particle.size*.35,
            particle.size,
            particle.size*.7
        );

    }

    ctx.restore();

}

}

function playBurnEffect(img){

return new Promise((resolve)=>{

    let viewer=document.getElementById("viewer");
    let rect=img.getBoundingClientRect();
    // 显示尺寸统一向上取整：允许覆盖范围略多于图片，但不留下亚像素残边。
    let width=Math.max(1,Math.ceil(rect.width));
    let height=Math.max(1,Math.ceil(rect.height));
    let roughness=Math.max(.8,Math.min(3,Math.min(width,height)*.035));
    let effectPadding=70;
    let canvasWidth=width+effectPadding*2;
    let canvasHeight=height+effectPadding*2;
    // 单倍分辨率的 Canvas 2D 即可呈现火焰，避免高 DPI 屏幕增加数倍绘制量。
    let pixelRatio=1;
    let canvas=document.createElement("canvas");
    let ctx=canvas.getContext("2d");

    canvas.className="burn-canvas";
    canvas.width=Math.ceil(canvasWidth*pixelRatio);
    canvas.height=Math.ceil(canvasHeight*pixelRatio);
    canvas.style.width=`${canvasWidth}px`;
    canvas.style.height=`${canvasHeight}px`;
    canvas.style.left=`${rect.left-effectPadding}px`;
    canvas.style.top=`${rect.top-effectPadding}px`;
    viewer.appendChild(canvas);

    ctx.scale(pixelRatio,pixelRatio);
    ctx.translate(effectPadding,effectPadding);
    img.classList.add("burning");

    // 使用固定的屏幕推进速度，大图会按相同速度自然燃烧更久。
    const burnSpeed=90;
    const burnDistance=width+height+48;
    const duration=burnDistance/burnSpeed*1000;
    const ashDriftDuration=900;
    const particles=[];
    let startTime=null;
    let previousTime=null;
    let ashAccumulator=0;
    const frameInterval=1000/30;

    function animate(now){

        if(startTime===null){
            startTime=now;
            previousTime=now;
        }

        let elapsed=now-startTime;
        // 时间仍按实际经过的毫秒推进，低帧率设备上不会拖慢剧情。
        if(now-previousTime<frameInterval && elapsed>0){
            requestAnimationFrame(animate);
            return;
        }
        let delta=Math.min(now-previousTime,100);
        let progress=Math.min(elapsed/duration,1);
        let front=-24+progress*burnDistance;

        previousTime=now;
        ctx.clearRect(
            -effectPadding,
            -effectPadding,
            canvasWidth,
            canvasHeight
        );
        ctx.globalCompositeOperation="source-over";
        ctx.drawImage(img,0,0,width,height);

        // 擦除燃烧前沿左上方的区域，边缘加入波动避免像直线裁切。
        ctx.globalCompositeOperation="destination-out";

        // 一次填充完成烧蚀区域，替代每帧数百次矩形绘制。
        let eraseStep=Math.max(2,width/120);
        ctx.beginPath();
        ctx.moveTo(0,0);
        for(let sample=0;sample<=120;sample++){
            let x=Math.min(width,sample*eraseStep);
            let burnedHeight=front-x+burnEdgeNoise(x,elapsed)*roughness;
            ctx.lineTo(x,Math.max(0,Math.min(height,burnedHeight)));
            if(x===width){
                break;
            }
        }
        ctx.lineTo(width,0);
        ctx.closePath();
        ctx.fill();

        // 到达终点后精确清空整张照片，防止最右侧或最下侧留下亚像素残边。
        if(progress>=1){
            ctx.clearRect(0,0,width,height);
        }

        ctx.globalCompositeOperation="source-over";

        // 火线只轻微越出照片边缘，外围其余留白供烟灰飘散。
        const flameOverflow=2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(
            -flameOverflow,
            -flameOverflow,
            width+flameOverflow*2,
            height+flameOverflow*2
        );
        ctx.clip();

        // 绘制焦黑烧蚀边和明亮的燃烧线。
        drawBurnLine(
            ctx,width,height,front,elapsed,roughness,
            2.3,"rgba(34,16,10,.92)",4.6
        );
        drawBurnLine(
            ctx,width,height,front,elapsed,roughness,
            .45,"rgba(137,31,4,.92)",3
        );

        drawBurnLine(
            ctx,width,height,front,elapsed,roughness,
            -.65,"rgba(255,205,92,.96)",1.15
        );

        ctx.restore();

        if(progress<.98){
            // 最初 3% 不产烟灰，随后渐增，到 30% 达到原有密度。
            let ashRamp=Math.pow(Math.max(0,Math.min(1,(progress-.03)/.27)),1.4);
            // 累积不足一个粒子的份额，避免起燃阶段每帧也至少生成一个。
            ashAccumulator+=60*ashRamp*delta/1000;
            let ashCount=Math.floor(ashAccumulator);
            ashAccumulator-=ashCount;
            if(ashCount>0){
                spawnAsh(particles,width,height,front,elapsed,roughness,ashCount);
            }
        }

        drawAsh(ctx,particles,delta);

        if(elapsed<duration+ashDriftDuration){
            requestAnimationFrame(animate);
            return;
        }

        canvas.remove();
        img.classList.remove("burning");
        resolve();

    }

    requestAnimationFrame(animate);

});

}

async function burn(){

let img=document.getElementById("photo");

if(!img.complete || !img.naturalWidth){

    await new Promise((resolve)=>{
        img.addEventListener("load",resolve,{once:true});
        img.addEventListener("error",resolve,{once:true});
    });

}

await playBurnEffect(img);

document
.getElementById("viewer")
.classList.remove("show");

state.status="future";
save();
showFiles();

alert(
"莫踌躇"
);

}

function openFuture(){
openPhoto(
"figure/future.png",
false
);
}
function closeViewer(){
let viewer=document.getElementById("viewer");
let photo=document.getElementById("photo");

if(!viewer.classList.contains("show") || viewer.classList.contains("viewer-closing")){
    return;
}

viewer.classList.add("viewer-closing");

setTimeout(()=>{
    viewer.classList.remove("show");
    viewer.classList.remove("viewer-closing");
    photo.src="";
},280);
}
function closeFolder(){

let folderWindow=document.getElementById("window");

if(folderWindow.classList.contains("hidden") || folderWindow.classList.contains("window-closing")){
    return;
}

folderWindow.classList.add("window-closing");

setTimeout(()=>{
    folderWindow.classList.add("hidden");
    folderWindow.classList.remove("window-closing");
    if (window.GameApp) GameApp.home();
},240);

}
