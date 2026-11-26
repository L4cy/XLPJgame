(() => {
    const FOLDER_PASSWORD = "TsqNGngc";
    const FOLDER_UNLOCKED_KEY = "folder_unlocked";
    const apps = {
        qq: { title: "Penguin", page: "QQ.html" },
        photos: { title: "文件夹", page: "testphoto.html" },
        search: { title: "搜索 · 线索搜索", page: "search.html" },
        qzone: { title: "Penguin空间", page: "QZone.html" },
        aes: { title: "AES 工具", page: "AES.html" },
        article: { title: "AES 介绍", page: "AES_intro.html" },
        cipherboard: { title: "密文板 · 雪原留下的两句话", page: "searchPage/cipherboard_intro.html" },
        dbformat: { title: "db文件格式转化", page: "searchPage/db_format_intro.html" }
    };
    const frames = new Map();
    let current = null;
    let activeFolderPasswordRequest = null;
    let folderUnlocked = localStorage.getItem(FOLDER_UNLOCKED_KEY) === "true";
    const appWindow = document.getElementById("app-window");
    function ensureFrame(id) {
        if (frames.has(id)) {
            const frame = frames.get(id);
            // 兼容应用内部旧链接曾覆盖 iframe 的情况，恢复该窗口应有的页面。
            const expected = new URL(apps[id].page, location.href);
            try {
                const actual = frame.contentWindow.location;
                if (actual.href !== "about:blank" && actual.pathname !== expected.pathname) frame.src = apps[id].page;
            } catch {
                frame.src = apps[id].page;
            }
            return frame;
        }
        const frame = document.createElement("iframe");
        frame.className = "app-frame";
        frame.title = apps[id].title;
        frame.hidden = true;
        frame.src = apps[id].page;
        frames.set(id, frame);
        document.getElementById("app-frames").appendChild(frame);
        return frame;
    }
    function showApp(id) {
        if (!apps[id]) return;
        const frame = ensureFrame(id);
        current = id;
        frames.forEach((frame, key) => { frame.hidden = key !== id; });
        appWindow.hidden = false;
        if (id === "photos" && typeof frame.contentWindow.openFolder === "function") frame.contentWindow.openFolder();
        if (id === "qq") {
            const scrollToLatestMessage = () => {
                frame.contentWindow.scrollChatToBottom?.();
            };

            if (frame.contentDocument?.readyState === "complete") {
                requestAnimationFrame(scrollToLatestMessage);
            } else {
                frame.addEventListener("load", scrollToLatestMessage, { once: true });
            }
        }
        appWindow.setAttribute("aria-label", apps[id].title);
        document.querySelectorAll(".taskbar [data-app]").forEach(button => button.classList.toggle("active", button.dataset.app === id));
    }
    function open(id) {
        if (!apps[id]) return;
        if (id !== "photos" || current === "photos" || folderUnlocked) {
            showApp(id);
            return;
        }
        requestFolderPassword().then(granted => {
            if (granted) showApp(id);
        });
    }
    function requestFolderPassword() {
        if (activeFolderPasswordRequest) return activeFolderPasswordRequest;

        activeFolderPasswordRequest = new Promise(resolve => {
            const dialog = document.getElementById("folder-password-dialog");
            const form = document.getElementById("folder-password-form");
            const input = document.getElementById("desktop-folder-password");
            const toggle = document.getElementById("desktop-password-toggle");
            const cancelButton = document.getElementById("folder-password-cancel");
            const error = document.getElementById("folder-password-error");
            let settled = false;

            input.value = "";
            input.type = "password";
            toggle.setAttribute("aria-label", "显示密码");
            toggle.setAttribute("aria-pressed", "false");
            error.textContent = "";

            const finish = granted => {
                if (settled) return;
                settled = true;
                if (dialog.open) dialog.close();
                form.removeEventListener("submit", submitPassword);
                input.removeEventListener("input", limitPassword);
                toggle.removeEventListener("click", toggleVisibility);
                cancelButton.removeEventListener("click", cancelPassword);
                dialog.removeEventListener("cancel", cancelPassword);
                resolve(granted);
            };
            const submitPassword = event => {
                event.preventDefault();
                const password = input.value.slice(0, 8);
                if (password !== FOLDER_PASSWORD) {
                    error.textContent = "密码错误，请重试";
                    input.focus();
                    input.select();
                    return;
                }
                folderUnlocked = true;
                localStorage.setItem(FOLDER_UNLOCKED_KEY, "true");
                finish(true);
            };
            const limitPassword = () => {
                input.value = input.value.slice(0, 8);
                error.textContent = "";
            };
            const toggleVisibility = () => {
                const showing = input.type === "text";
                input.type = showing ? "password" : "text";
                toggle.setAttribute("aria-label", showing ? "显示密码" : "隐藏密码");
                toggle.setAttribute("aria-pressed", String(!showing));
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            };
            const cancelPassword = event => {
                event?.preventDefault();
                finish(false);
            };

            form.addEventListener("submit", submitPassword);
            input.addEventListener("input", limitPassword);
            toggle.addEventListener("click", toggleVisibility);
            cancelButton.addEventListener("click", cancelPassword);
            dialog.addEventListener("cancel", cancelPassword);
            dialog.showModal();
            input.focus();
        });

        activeFolderPasswordRequest.then(() => {
            activeFolderPasswordRequest = null;
        });
        return activeFolderPasswordRequest;
    }
    function home() {
        current = null;
        appWindow.hidden = true;
        frames.forEach(frame => { frame.hidden = true; });
        document.querySelectorAll(".taskbar [data-app]").forEach(button => button.classList.remove("active"));
        document.getElementById("show-desktop").focus();
    }
    function openPage(page) {
        const url = new URL(page, location.href);
        const id = Object.keys(apps).find(key => new URL(apps[key].page, location.href).pathname === url.pathname);
        if (url.origin !== location.origin || !id) return;
        if (id === "aes") {
            window.open(url.href, "_blank", "noopener");
            return;
        }
        open(id);
    }
    function showReplyToast(sender, message) {
        let container = document.querySelector(".qq-toast-container");
        if (!container) {
            container = document.createElement("div");
            container.className = "qq-toast-container";
            container.setAttribute("aria-live", "polite");
            document.body.appendChild(container);
        }
        const toast = document.createElement("div");
        toast.className = "qq-toast";
        const title = document.createElement("div");
        title.className = "qq-toast-title";
        title.textContent = `${sender} 回复了你`;
        const text = document.createElement("div");
        text.className = "qq-toast-message";
        text.textContent = message;
        toast.append(title, text);
        container.appendChild(toast);
        setTimeout(() => {
            toast.remove();
            if (!container.children.length) container.remove();
        }, 2000);
    }
    window.Desktop = { open, home, openPage, showReplyToast, isQQVisible: () => current === "qq" };
    document.querySelectorAll("[data-app]").forEach(button => button.addEventListener("click", () => open(button.dataset.app)));
    document.getElementById("show-desktop").addEventListener("click", home);

    const resetProgressButton = document.getElementById("reset-progress");
    const resetConfirm = document.getElementById("reset-confirm");
    const departureButton = document.getElementById("departure-button");
    const departureConfirm = document.getElementById("departure-confirm");
    const departureConfirmTitle = document.getElementById("departure-confirm-title");
    const departureLockedView = document.getElementById("departure-locked-view");
    const departureLockedExit = departureLockedView.querySelector(".departure-confirm-exit");
    const departureChoiceView = document.getElementById("departure-choice-view");
    const departureSuccessView = document.getElementById("departure-success-view");
    const departureChoices = document.getElementById("departure-choices");
    const departureFeedback = document.getElementById("departure-feedback");

    "ABCDEFGHIJKL".split("").forEach(choice => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "departure-choice";
        button.textContent = choice;
        button.addEventListener("click", () => {
            if (choice === "J") {
                departureConfirmTitle.textContent = "成功";
                departureChoiceView.hidden = true;
                departureSuccessView.hidden = false;
                departureSuccessView.querySelector("button").focus();
                return;
            }

            departureFeedback.textContent = "或许再回忆一下...";
            button.focus();
        });
        departureChoices.appendChild(button);
    });

    resetProgressButton.addEventListener("click", () => {
        resetConfirm.returnValue = "";
        resetConfirm.showModal();
    });

    resetConfirm.addEventListener("close", () => {
        if (resetConfirm.returnValue !== "confirm") return;

        window.GAME_PROGRESS_KEYS.forEach(key => {
            localStorage.removeItem(key);
        });

        location.replace(new URL("second.html", location.href));
    });

    departureButton.addEventListener("click", () => {
        let hasOpenedMap = false;
        try {
            const photoState = JSON.parse(localStorage.getItem("photo_folder_state") || "{}");
            hasOpenedMap = photoState.mapOpened === true;
        } catch {
            hasOpenedMap = false;
        }

        departureConfirm.classList.toggle("departure-map-mode", hasOpenedMap);
        departureLockedView.hidden = hasOpenedMap;
        departureChoiceView.hidden = !hasOpenedMap;
        departureSuccessView.hidden = true;
        departureFeedback.textContent = "";
        departureConfirmTitle.textContent = hasOpenedMap ? "请选择红龙的住处" : "尚未找到关键线索";
        departureLockedExit.textContent = "继续寻找";
        departureConfirm.showModal();
        if (hasOpenedMap) departureChoices.querySelector("button").focus();
    });

    function updateStatus() {
        document.getElementById("desktop-clock").textContent = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) + "\n" + new Date().toLocaleDateString("zh-CN");
        const read = JSON.parse(localStorage.getItem("readStatus") || "{}");
        document.getElementById("qq-unread").hidden = !Object.values(read).some(value => value === false);
    }
    updateStatus();
    setInterval(updateStatus, 1000);
    // QQ 始终保留在后台，关闭窗口不会取消回复计时器。
    ensureFrame("qq");
    const requested = new URLSearchParams(location.search).get("app");
    if (apps[requested]) open(requested);
})();
