let database = [];

let clues = [];

let secrets = [];
const searchContainer =
document.getElementById("searchContainer");


const input =
document.getElementById("searchInput");


const clueBox =
document.getElementById("clueBox");


const result =
document.getElementById("result");


const searchTitle =
document.getElementById("searchTitle");


let moveToTopPromise = null;

let searchRequestId = 0;


//读取JSON

fetch("searchdata/data.json")

.then(response => response.json())

.then(data => {


    database = data.contents;

    clues = data.clues;

    secrets = data.secrets || [];


});





//点击搜索框显示线索

input.addEventListener(
"focus",
showClues
);





//输入时隐藏线索

input.addEventListener(
"input",
()=>{


    clueBox.style.display="none";


});





//点击搜索区域外部时隐藏搜索历史

document.addEventListener(
"click",
event=>{


    if(!searchContainer.contains(event.target)){

        clueBox.style.display="none";

    }


}
);





//显示固定线索

function showClues(){


    clueBox.innerHTML="";


    clues.forEach(clue=>{


        let div =
        document.createElement("div");


        div.className="clue-item";


        div.innerText=clue;



        div.onclick=function(){


            input.value=clue;


            clueBox.style.display="none";


            searchContent();


        };



        clueBox.appendChild(div);



    });



    clueBox.style.display="block";


}






//等待搜索框移动到顶部

function moveSearchToTop(){


    if(moveToTopPromise){

        return moveToTopPromise;

    }


    if(searchContainer.classList.contains("top")){

        return Promise.resolve();

    }


    moveToTopPromise = new Promise(resolve=>{


        let finished=false;


        function finishMove(){


            if(finished){

                return;

            }


            finished=true;

            searchContainer.removeEventListener(
                "transitionend",
                handleTransitionEnd
            );

            moveToTopPromise=null;

            resolve();


        }


        function handleTransitionEnd(event){


            if(
                event.target===searchContainer &&
                event.propertyName==="top"
            ){

                finishMove();

            }


        }


        searchContainer.addEventListener(
            "transitionend",
            handleTransitionEnd
        );


        searchContainer.classList.add("top");


        // 避免浏览器未触发 transitionend 时一直等待
        setTimeout(finishMove,450);


    });


    return moveToTopPromise;


}




//搜索

async function searchContent(){


    let keyword =
    input.value.trim();



    if(keyword===""){

        return;

    }


    let results=[];

    const secret = secrets.find(item=>item.keyword===keyword);

    const currentRequestId=++searchRequestId;


if(!secret){


database.forEach(item=>{


    if(
        item.keyword.includes(keyword)
    ){

        results =
        results.concat(item.results);

    }


});


}



    // 搜索后隐藏标题
    searchTitle.style.display="none";


    // 搜索后隐藏线索
    clueBox.style.display="none";


    // 移动期间不提前显示搜索结果
    result.innerHTML="";


    // 先等待搜索框移动到顶部，再显示结果
    await moveSearchToTop();


    // 只显示最后一次搜索的内容
    if(currentRequestId===searchRequestId){

        showResult(results,secret);

    }


}






//显示结果

function showResult(results,secret=null){


    result.innerHTML="";



    if(results.length===0){


        let noResult =
        document.createElement("div");


        noResult.className="no-result";


        if(secret){


            noResult.classList.add("has-secret");


            let trigger =
            document.createElement("span");


            trigger.className="secret-trigger";


            let message =
            document.createElement("span");


            message.className="no-result-message";

            message.innerText="没有找到相关内容";


            let password =
            document.createElement("span");


            password.className="secret-password";

            password.innerText=secret.password;


            trigger.appendChild(message);

            trigger.appendChild(password);

            noResult.appendChild(trigger);


        }
        else{


            noResult.innerText="没有找到相关内容";


        }


        result.appendChild(noResult);


        return;


    }




    results.forEach(item=>{


    let div =
    document.createElement("div");


    div.className="result-card";


    div.innerHTML=`

    <h3>${item.title}</h3>

    <p>
    ${item.description}
    </p>

    `;



    div.onclick=function(){


    if(item.url.startsWith("http")){


    window.open(
    item.url,
    "_blank"
    );


    }
    else{


    if (item.url === "pages/chat_red.html") {
        GameApp.openPage("QQ.html");
        window.parent.document.querySelector('iframe[title="QQ · Penguin"]').contentWindow.openChat({ type: "private", id: "dragon" });
    } else {
        GameApp.openPage(item.url);
    }


    }


    };



    result.appendChild(div);



    });



}
