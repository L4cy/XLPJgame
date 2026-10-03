class WindowManager {

    constructor(){
        this.history = [];
        this.current = null;
    }
    open(page){

        // 如果当前有页面，把它压入栈
        if(this.current){
            this.history.push(this.current);  
            // 隐藏当前页面
            this.current.hide();
        }

        // 显示新页面
        this.current = page;
        this.current.show();

        console.log("当前页面:", this.current.name);
        console.log("返回栈:", this.history);
    }

    back(){
        // 关闭当前页面
        if(this.current){
            this.current.hide();
        }
        // 栈里面取最后一个
        if(this.history.length > 0){

            const previousPage = this.history.pop();
            this.current = previousPage;
            // 显示之前页面
            this.current.show();
        }
        console.log("返回后:", this.current.name);
    }
}
const windowManager = new WindowManager();