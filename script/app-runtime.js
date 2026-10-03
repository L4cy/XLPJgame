(() => {
    const routes = { "QQ.html": "qq", "testphoto.html": "photos", "search.html": "search", "QZone.html": "qzone", "AES.html": "aes", "AES_intro.html": "article" };
    const page = location.pathname.split("/").pop();
    if (window === window.top && routes[page]) {
        location.replace(`second.html?app=${routes[page]}`);
        return;
    }
    window.GameApp = {
        home: () => window.parent.Desktop.home(),
        openPage: page => window.parent.Desktop.openPage(page),
        isQQVisible: () => window.parent.Desktop.isQQVisible(),
        showReplyToast: (sender, text) => window.parent.Desktop.showReplyToast(sender, text)
    };
    document.addEventListener("DOMContentLoaded", () => {
        if (page === "testphoto.html") {
            openFolder();
        }
        document.querySelector(".qq-close")?.addEventListener("click", () => GameApp.home());
        if (page === "search.html") {
            const close = document.createElement("button");
            close.type = "button";
            close.className = "search-close";
            close.textContent = "×";
            close.setAttribute("aria-label", "关闭搜索，返回桌面");
            close.addEventListener("click", () => GameApp.home());
            document.body.appendChild(close);
        }
    });
})();
