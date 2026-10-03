// 刷新重置统一由桌面的 game-config.js 控制。

// ============================
// 当前聊天状态
// ============================

let currentConversation = {
    type: null,
    id: null
};
let currentChatData = null;

let chatCache = JSON.parse(localStorage.getItem("gameChatSave") || "{}");
const chatLoads = new Map();
let unreadStatus = {};
let readStatus = 
JSON.parse(
    localStorage.getItem("readStatus")
)
||
{};
let gameChatSave =
JSON.parse(
    localStorage.getItem("gameChatSave")
)
||
{};
let selectedChoice = null;
let currentChoiceGroup = null;
// ============================
// DOM
// ============================

const qqItems = document.querySelectorAll(".qq-item");

const memberPanel = document.querySelector(
    ".qq-member-panel"
);

const chatTitle = document.querySelector(
    ".qq-chat-title"
);

const chatPanel = document.querySelector(
    ".qq-chat"
);

const input = document.querySelector(
    "#chat-input"
);

const choiceBox = document.querySelector(
    ".qq-choice"
);

const sendBtn = document.querySelector(
    "#send-btn"
);
const inputBar = document.querySelector(
    ".qq-input"
);

// ============================
// 新回复弹窗
// ============================

function showReplyToast(senderName, messageText){
    if (window.GameApp) {
        GameApp.showReplyToast(senderName, messageText);
        return;
    }

    let toastContainer = document.querySelector(
        ".qq-toast-container"
    );

    if(!toastContainer){

        toastContainer = document.createElement("div");
        toastContainer.className = "qq-toast-container";
        toastContainer.setAttribute("aria-live", "polite");
        toastContainer.setAttribute("aria-atomic", "true");
        document.body.appendChild(toastContainer);

    }

    const toast = document.createElement("div");
    toast.className = "qq-toast";

    const title = document.createElement("div");
    title.className = "qq-toast-title";
    title.textContent = `${senderName} 回复了你`;

    const message = document.createElement("div");
    message.className = "qq-toast-message";
    message.textContent = messageText;

    toast.appendChild(title);
    toast.appendChild(message);
    toastContainer.appendChild(toast);

    setTimeout(()=>{

        toast.remove();

        if(!toastContainer.children.length){
            toastContainer.remove();
        }

    },2000);

}
// ============================
// 点击左侧聊天列表
// ============================

qqItems.forEach(item=>{

    item.addEventListener("click",()=>{

        qqItems.forEach(i=>{
            i.classList.remove("active");
        });

        item.classList.add("active");

        let type=item.dataset.type;

        if(type==="qzone"){

            localStorage.setItem(
                "gameChatSave",
                JSON.stringify(chatCache)
            );


            GameApp.openPage("QZone.html");

            return;

        }

        let id=item.dataset.id;

        clearUnreadDot(id);

        openChat({

            type:type==="group"
            ?"group"
            :"private",

            id:id

        });

    });

});

// QQ 首次打开时只展示默认会话，不自动标记已读。
// 玩家实际点击当前聊天区域后，立即清除该会话的未读红点。
chatPanel.addEventListener("click",()=>{
    if(!currentConversation.id){
        return;
    }

    clearUnreadDot(currentConversation.id);
});
// ============================
// 统一打开聊天
// ============================

function openChat(conversation){
    selectedChoice = null;
    input.value = "";
    choiceBox.style.display = "none";
    currentConversation = conversation;
    // 如果之前加载过，直接使用缓存

    if(chatCache[conversation.id]){

    currentChatData =
        chatCache[conversation.id];

    checkUnreadDot(conversation.id);

    finishOpenChat(conversation);

    return;

}
    loadChat(conversation.id)
    .then(data=>{

        chatCache[conversation.id]=data;


        if (currentConversation.id !== conversation.id) return;
        currentChatData=data;


        checkUnreadDot(conversation.id);


        finishOpenChat(conversation);

    })

    .catch(err=>{

        console.error(err);

    });
}
function finishOpenChat(conversation){ 

    chatTitle.innerText = 
        currentChatData.name; 

    if(!currentChatData.currentChoiceGroup){ 

        currentChatData.currentChoiceGroup = 
            "choice_start"; 

    } 

    if(conversation.type==="private"){ 
        memberPanel.style.display="none"; 
    } 

    if(conversation.type==="group"){ 
        memberPanel.style.display="block"; 
    } 

    renderChat(); 
}

// ============================
// 渲染聊天记录
// ============================
function renderChat(){ 
    let area=document.querySelector(
        ".qq-message-area"
    );

    area.innerHTML="";

    if(!currentChatData){
        return;
    }

    const displayedTimes = new Set();

    currentChatData.messages.forEach(msg=>{
        if(msg.visible===false){
            return;
        }

        const displayedTime = formatChatTime(msg.time);

        const timeGroup = msg.timeGroup || displayedTime;

        if(displayedTime && !displayedTimes.has(timeGroup)){
            createTimeDivider(displayedTime);
            displayedTimes.add(timeGroup);
        }

        createMessage(msg);
    });
    renderChoices();
    updateComposerState();
    scrollChatToBottom();
}

function updateComposerState(){
    const veConversationComplete =
        currentChatData &&
        currentChatData.id === "ve" &&
        currentChatData.currentChoiceGroup === "__complete__" &&
        !currentChatData.pendingReply;

    input.disabled = veConversationComplete;
    sendBtn.disabled = veConversationComplete;
    inputBar.classList.toggle("is-disabled", veConversationComplete);
    input.placeholder = veConversationComplete ? "对话已结束" : "输入消息";

    if(veConversationComplete){
        selectedChoice = null;
        input.value = "";
        choiceBox.style.display = "none";
    }
}

function scrollChatToBottom(){
    const area = document.querySelector(".qq-message-area");
    if(!area) return;

    requestAnimationFrame(()=>{
        area.scrollTop = area.scrollHeight;
    });
}

window.scrollChatToBottom = scrollChatToBottom;

function formatChatTime(time){
    if(!time){
        return "";
    }

    const value = String(time).trim();
    let match = value.match(/^(\d{4})[\/年-](\d{1,2})[\/月-](\d{1,2})日?$/);

    if(!match){
        match = value.match(/^(\d{1,2})[\/-](\d{1,2})$/);

        if(match){
            return `2026/${match[1].padStart(2,"0")}/${match[2].padStart(2,"0")}`;
        }

        return value;
    }

    return `${match[1]}/${match[2].padStart(2,"0")}/${match[3].padStart(2,"0")}`;
}

function createTimeDivider(time){
    const area = document.querySelector(".qq-message-area");
    const divider = document.createElement("div");
    divider.className = "chat-time-divider";
    divider.textContent = time;
    area.appendChild(divider);
}
// ============================
// 创建消息
// ============================

function createMessage(msg){

    let area=document.querySelector(
        ".qq-message-area"
    );

    let div=document.createElement("div");

    if(msg.type==="hint"){
        div.className="chat-hint";
        div.textContent=msg.text;
        area.appendChild(div);
        return;
    }

    if(msg.sender==="player"){
        div.className="message self";
    }else{
        div.className="message other";
    }

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = msg.text;
    div.appendChild(bubble);

    area.appendChild(div);
}

// ============================
// 未读消息
// ============================
function updateUnread(id){
    let item=document.querySelector(
        `.qq-item[data-id="${id}"]`
    );
    if(!item){
        return;
    }

    let badge=item.querySelector(
        ".unread-count"
    );
    if(!badge){

        return;

    }
    let count=currentChatData.messages.filter(
        msg=>msg.unread===true
    ).length;
    if(count>0){
        badge.innerText=count;
        badge.style.display="block";
    }else{
        badge.style.display="none";
    }
}
function clearUnread(){
    if(!currentChatData){
        return;
    }

    currentChatData.messages.forEach(msg=>{
        msg.unread=false;
    });
    updateUnread(
        currentChatData.id
    );
}
// ============================
// 选项按钮
// ============================
function renderChoices(){

    choiceBox.innerHTML="";
    choiceBox.classList.remove("is-grid");

    if(!currentChatData || currentChatData.pendingReply){
        return;
    }

    let group =
        (currentChatData.choiceGroups || {})[
            currentChatData.currentChoiceGroup
        ];

    if(!group){
        return;
    }

    choiceBox.classList.toggle("is-grid", group.length > 4);

    group.forEach(choice=>{

        let button=document.createElement(
            "button"
        );

        button.innerText=choice.label || choice.text;

        button.onclick=function(e){

            e.stopPropagation();

            input.value=choice.text;

            selectedChoice=choice;

            choiceBox.style.display="none";

        };

        choiceBox.appendChild(button);

    });

    // 注意：
    // 不在这里显示

}
// 输入框点击显示选项

input.onclick=function(e){

    e.stopPropagation();

    showChoices();

};
document.addEventListener("click", function(e){

    // 如果点击的是输入框或者选项按钮
    // 不关闭

    if(
        e.target === input ||
        e.target.closest(".qq-choice")
    ){
        return;
    }

    choiceBox.style.display="none";

});
function showChoices(){

    choiceBox.innerHTML="";
    choiceBox.classList.remove("is-grid");

    if(!currentChatData || currentChatData.pendingReply){
        return;
    }

    let group =
        (currentChatData.choiceGroups || {})[
            currentChatData.currentChoiceGroup
        ];

    if(!group){
        return;
    }

    const useGrid = group.length > 4;
    choiceBox.classList.toggle("is-grid", useGrid);

    group.forEach(choice=>{

        let btn=document.createElement(
            "button"
        );

        btn.innerText=choice.label || choice.text;

        btn.onclick=function(e){

            e.stopPropagation();

            input.value=choice.text;

            selectedChoice=choice;

            choiceBox.style.display="none";

        };

        choiceBox.appendChild(btn);

    });

    choiceBox.style.display=useGrid ? "grid" : "block";

}
// ============================
// 发送选择
// ============================
sendBtn.onclick=function(){
    if(!selectedChoice){
        return;
    }
    sendChoice(selectedChoice);
    selectedChoice=null;
    input.value="";
};
function sendChoice(choice){

    if(!currentChatData || currentChatData.pendingReply){
        return;
    }

    // 防止重复点击
    choiceBox.style.display="none";

    // 玩家消息

    let playerMsg={

        sender:"player",

        text:choice.text,

        time:choice.time || "",

    };

    const reply = (currentChatData.replies || []).find(r => r.id === choice.reply);
    if (reply) {
        currentChatData.pendingReply = {
            replyId: reply.id,
            messageIndex: 0,
            dueAt: Date.now() + REPLY_DELAY_MS
        };
    } else {
        currentChatData.currentChoiceGroup = choice.next_group || "__complete__";
    }
    currentChatData.messages.push(
        playerMsg
    );
    saveChatProgress(
    currentChatData.id
);

  
    renderChat();

    if(!reply){

        return;

    }

    scheduleReply(currentChatData, currentConversation.id);

}
// ============================
// 群成员点击
// ============================
memberPanel.addEventListener(
"click",
function(e){

    let member = e.target.closest(".member");

    if(!member){
        return;
    }

    let id = member.dataset.id;
    if (!id) return;
    // 清除左侧旧高亮
    qqItems.forEach(item=>{
        item.classList.remove("active");
    });
    // 给对应联系人添加高亮
    let target = document.querySelector(
        `.qq-item[data-id="${id}"]`
    );
    if(target){
        target.classList.add("active");
    }
    clearUnreadDot(id);

    openChat({ 
        type:"private",
        id:id
    });
});
// ============================
// 未读红点
// ============================
function checkUnreadDot(id){

    let data = chatCache[id];

    if(!data){
        return;
    }

    let hasUnread =
        !readStatus[id] &&
        data.messages.some(msg=>
            msg.unread===true &&
            msg.sender!=="player"
        );

    if(hasUnread){

        addUnreadDot(id);

    }else{

        hideUnreadDot(id);
    }

}

function hideUnreadDot(id){

    let item=document.querySelector(
        `.qq-item[data-id="${id}"]`
    );

    if(!item){
        return;
    }


    let dot=item.querySelector(
        ".unread-dot"
    );


    if(dot){

        dot.style.display="none";

    }

}
function addUnreadDot(id){

    unreadStatus[id]=true;

    // 新消息到达后立即持久化为未读。
    // 页面跳转到 QZone 再返回时，红点会据此恢复；
    // 只有用户点击对应会话时，clearUnreadDot 才会将其标记为已读。
    readStatus[id]=false;

    localStorage.setItem(
        "readStatus",
        JSON.stringify(readStatus)
    );

    let item=document.querySelector(
        `.qq-item[data-id="${id}"]`
    );

    if(!item){
        return;
    }

    let dot=item.querySelector(
        ".unread-dot"
    );

    if(!dot){

        dot=document.createElement("span");

        dot.className="unread-dot";

        item.appendChild(dot);

    }

    dot.style.display="block";

}

function clearUnreadDot(id){

    unreadStatus[id]=false;

    // 记录已经读过
    readStatus[id]=true;

    localStorage.setItem(
        "readStatus",
        JSON.stringify(readStatus)
    );

    // 修改当前缓存中的状态

    if(chatCache[id]){

        chatCache[id].messages.forEach(msg=>{

            if(msg.sender!=="player"){

                msg.unread=false;

            }

        });

    }

    let item=document.querySelector(
        `.qq-item[data-id="${id}"]`
    );

    if(!item){
        return;
    }

    let dot=item.querySelector(
        ".unread-dot"
    );

    if(dot){

        dot.style.display="none";

    }

}
// ============================
// 初始化未读红点
// ============================
function initUnreadDots(){


    qqItems.forEach(item=>{


        let id=item.dataset.id;
        if (!id) return;


        loadChat(id)
        .then(data=>{


            chatCache[id]=data;



            let hasUnread =
                !readStatus[id] &&
                data.messages.some(msg=>
                    msg.unread===true &&
                    msg.sender!=="player"
                );


            if(hasUnread){

                addUnreadDot(id);

            }


        }).catch(console.error)


    });


}
initUnreadDots();
openChat({ type: "private", id: "dragon" });
function saveChatProgress(id){

    localStorage.setItem(
        "gameChatSave",
        JSON.stringify(chatCache)
    );

}

function loadChat(id) {
    if (chatLoads.has(id)) return chatLoads.get(id);
    const loading = (chatCache[id] ? Promise.resolve(chatCache[id]) :
        fetch(`chatdata/${id}.json`).then(response => {
            if (!response.ok) throw new Error("聊天数据不存在");
            return response.json();
        })).then(data => {
            data.id = id;
            data.choiceGroups ||= {};
            data.replies ||= [];
            chatCache[id] = data;
            if (data.pendingReply) scheduleReply(data, id);
            return data;
        });
    chatLoads.set(id, loading);
    return loading;
}

const REPLY_DELAY_MS = 1000;
const replyTimers = new Map();
function scheduleReply(chat, id) {
    if (!chat.pendingReply || replyTimers.has(id)) return;
    replyTimers.set(id, setTimeout(() => {
        replyTimers.delete(id);
        const pendingReply = chat.pendingReply;
        const reply = chat.replies.find(item => item.id === pendingReply?.replyId);
        if (!reply) {
            delete chat.pendingReply;
            saveChatProgress(id);
            return;
        }
        const replyMessages = Array.isArray(reply.messages)
            ? reply.messages
            : [{ sender: reply.sender, text: reply.text, time: reply.time || "" }];
        const messageIndex = Number.isInteger(pendingReply.messageIndex)
            ? pendingReply.messageIndex
            : 0;
        const message = replyMessages[messageIndex];

        if (!message) {
            delete chat.pendingReply;
            chat.currentChoiceGroup = reply.next_group || "__complete__";
            saveChatProgress(id);
            if (currentConversation.id === id) renderChat();
            return;
        }

        const visible = currentConversation.id === id && GameApp.isQQVisible();
        const isIncomingMessage = message.sender !== "player" && message.type !== "hint";

        chat.messages.push({
            ...message,
            time: message.time || "",
            unread: isIncomingMessage && !visible
        });

        const hasNextMessage = messageIndex + 1 < replyMessages.length;

        if (hasNextMessage) {
            chat.pendingReply = {
                replyId: reply.id,
                messageIndex: messageIndex + 1,
                dueAt: Date.now() + REPLY_DELAY_MS
            };
        } else {
            delete chat.pendingReply;
            chat.currentChoiceGroup = reply.next_group || "__complete__";
        }

        if (!visible && isIncomingMessage) addUnreadDot(id);
        saveChatProgress(id);
        if (isIncomingMessage) {
            showReplyToast(chat.name || "新消息", message.text);
        }
        if (currentConversation.id === id) renderChat();

        if (chat.pendingReply) {
            scheduleReply(chat, id);
        }
    }, Math.max(0, chat.pendingReply.dueAt - Date.now())));
}
