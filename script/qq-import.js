// 游戏内文件选择器：共用资源管理器目录，不访问玩家电脑上的文件。
(() => {
    const byId = id => document.getElementById(id);
    const dialog = byId("qq-import-dialog");
    const menu = byId("qq-tools-menu");
    const tools = byId("qq-tools");
    const submit = byId("qq-import-submit");
    const status = byId("qq-import-status");
    const directories = window.EXPLORER_FOLDERS;
    // 导入窗口显示完整名称；普通资源管理器在渲染时隐藏扩展名。
    const displayFileName = file => file.name;
    const importError = file => GameFiles.extension(file.name) !== "db"
        ? "文件格式错误"
        : GameFiles.canImport(file) ? "" : "文件内容损坏";
    let directory = null;
    let selected = null;
    let importing = false;
    let completed = false;

    function closeMenu() {
        menu.hidden = true;
        tools.setAttribute("aria-expanded", "false");
    }
    tools.onclick = () => {
        menu.hidden = !menu.hidden;
        tools.setAttribute("aria-expanded", String(!menu.hidden));
    };
    document.addEventListener("click", event => {
        if (!event.target.closest(".qq-tools-wrap")) closeMenu();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeMenu();
    });
    byId("qq-zone").onclick = () => {
        saveChatProgress();
        GameApp.openPage("QZone.html");
    };
    function feedback(text, error = false) {
        status.textContent = text;
        status.classList.toggle("is-error", error);
    }
    function showStage(stage) {
        ["start", "picker", "progress"].forEach(name => {
            byId(`qq-import-${name}`).hidden = name !== stage;
        });
    }
    byId("qq-import").onclick = () => {
        closeMenu();
        selected = null;
        directory = null;
        completed = false;
        submit.textContent = "导入";
        submit.disabled = true;
        byId("qq-import-filename").textContent = "未选择文件";
        feedback("");
        showStage("start");
        dialog.showModal();
    };
    function closeDialog() {
        if (!importing) dialog.close();
    }
    byId("qq-import-close").onclick = closeDialog;
    byId("qq-import-cancel").onclick = closeDialog;
    dialog.addEventListener("cancel", event => {
        if (importing) event.preventDefault();
    });
    byId("qq-import-browse").onclick = () => {
        showStage("picker");
        renderFiles();
    };
    byId("qq-file-home").onclick = () => openDirectory(null);
    byId("qq-file-up").onclick = () => openDirectory(null);
    function openDirectory(next) {
        directory = next;
        selected = null;
        submit.disabled = true;
        feedback("");
        renderFiles();
    }
    function makeButton(label, action) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.onclick = action;
        return button;
    }
    directories.forEach(folder => {
        byId("qq-file-folders").appendChild(makeButton(`📁 ${folder.name}`, () => openDirectory(folder)));
    });
    function renderFiles() {
        if(selected) selected = GameFiles.resolve(selected);
        const list = byId("qq-file-list");
        list.replaceChildren();
        byId("qq-file-path").textContent = directory ? `› ${directory.name}` : "";
        byId("qq-file-up").disabled = !directory;
        byId("qq-file-selection").textContent = selected ? displayFileName(selected) : "未选择文件";
        if (!directory) {
            directories.forEach(folder => list.appendChild(makeButton(`📁 ${folder.name}`, () => openDirectory(folder))));
            return;
        }
        const files = GameFiles.listFiles(directory.id);
        files.forEach(file => {
            const button = makeButton(`▧ ${displayFileName(file)}`, () => {
                selected = file;
                submit.disabled = false;
                const error = importError(file);
                feedback(error, !!error);
                renderFiles();
            });
            button.setAttribute("aria-pressed", String(selected?.id === file.id));
            list.appendChild(button);
        });
        if (!files.length) list.textContent = "此文件夹为空";
    }
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    window.addEventListener("storage", event => {
        if ([GameFiles.stateKey, "photo_folder_state"].includes(event.key) && !importing) {
            renderFiles();
            if (selected) {
                const error = importError(selected);
                feedback(error, !!error);
            }
        }
    });
    submit.onclick = async () => {
        if (completed) return closeDialog();
        if (!selected || importing) return;
        selected = GameFiles.resolve(selected);
        const error = importError(selected);
        if (error) {
            feedback(error, true);
            return;
        }
        importing = true;
        submit.disabled = true;
        byId("qq-import-close").disabled = true;
        byId("qq-import-cancel").disabled = true;
        byId("qq-import-filename").textContent = displayFileName(selected);
        feedback("");
        byId("qq-import-bar").value = 0;
        byId("qq-import-percent").textContent = "0%";
        showStage("progress");
        try {
            const response = await fetch(selected.dataSrc);
            if (!response.ok) throw new Error("读取备份失败，请重试");
            let backup;
            try {
                backup = await response.json();
            } catch {
                throw new Error("文件内容损坏");
            }
            if (!backup || backup.format !== "game-qq-backup-v1" || !Array.isArray(backup.conversations) ||
                !backup.conversations.every(chat => chat && typeof chat.id === "string" &&
                    /^[a-z0-9-]+$/.test(chat.id) && Array.isArray(chat.messages) &&
                    chat.messages.every(message => message && message.id != null && typeof message.text === "string"))) {
                throw new Error("文件内容损坏");
            }
            // 先加载并校验所有会话，成功后一次性合并，避免部分导入。
            const targets = await Promise.all(backup.conversations.map(chat => loadChat(chat.id)));
            for (let value = 10; value <= 100; value += 10) {
                await wait(160);
                byId("qq-import-bar").value = value;
                byId("qq-import-percent").textContent = `${value}%`;
            }
            const merged = targets.map((chat, index) => {
                // 旧测试备份沿用相同消息 ID；重新导入时用正式原稿替换占位内容。
                const isPlaceholder = message => chat.id === "deer" && (
                    (message.id === "deer_history_1" && message.sender === "player" && message.text === "111") ||
                    (message.id === "deer_history_2" && message.sender === "deer" && message.text === "222")
                );
                const existing = new Map(chat.messages.filter(message => message.id != null && !isPlaceholder(message)).map(message => [message.id, message]));
                const ids = new Set();
                const history = backup.conversations[index].messages.filter(message => {
                    if (ids.has(message.id)) return false;
                    ids.add(message.id);
                    return true;
                }).map(message => existing.get(message.id) || { ...message, unread: false });
                return { chat, messages: [...history, ...chat.messages.filter(message => !ids.has(message.id))] };
            });
            const nextCache = { ...chatCache };
            merged.forEach(({ chat, messages }) => { nextCache[chat.id] = { ...chat, messages }; });
            localStorage.setItem("gameChatSave", JSON.stringify(nextCache));
            merged.forEach(({ chat, messages }) => { chat.messages = messages; });
            if (currentChatData) renderChat();
            feedback("导入成功");
            completed = true;
            submit.textContent = "完成";
        } catch (error) {
            showStage("picker");
            renderFiles();
            feedback(error.message || "导入失败，请重试", true);
        } finally {
            importing = false;
            submit.disabled = false;
            byId("qq-import-close").disabled = false;
            byId("qq-import-cancel").disabled = false;
        }
    };
})();
