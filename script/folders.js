// 文件夹列表。添加新文件夹时，在数组中增加一项即可。
// 普通文件夹暂时留空；之后可在 files 中加入 { name: "示例.png", src: "figure/示例.png" }。
// photofolder 的内容由原有相册剧情控制。
window.EXPLORER_FOLDERS = [
    { id: "photos", name: "photofolder", files: [
        { id: "photo-present", name: "present.png", src: "figure/present.png" },
        { id: "photo-past", name: "████.png", src: "figure/past.png", locked: true },
        { id: "photo-future", name: "future.png", src: "figure/future.png" }
    ] },
    { id: "documents", name: "文档", files: [] },
    { id: "downloads", name: "下载", files: [] },
    { id: "notes", name: "笔记", files: [] },
    { id: "work", name: "工作资料", files: [] },
    { id: "projects", name: "项目", files: [] },
    { id: "backup", name: "备份", files: [
        { id: "qq-message-backup-001", name: "deer_cache.dat", preview: false,
          importType: "qq-messages", dataSrc: "chatdata/qq-backup-001.json" }
    ] },
    {
        id: "other",
        name: "地图",
        files: [
            { id: "map-image", name: "地图.jpg", src: "figure/map.jpg" }
        ]
    }
];

// 文件身份与名称分开保存；修改后缀不会改变图片或数据库的实际内容。
window.GameFiles = (() => {
    const stateKey = "gameFileState";
    const settingsKey = "gameFileSettings";
    const commonExtensions = new Set("db sqlite sqlite3 dat bak txt log ini cfg conf png jpg jpeg gif bmp webp ico svg pdf doc docx xls xlsx ppt pptx csv tsv json xml html htm css js sql zip rar 7z gz tar mp3 wav ogg flac mp4 avi mov mkv exe dll".split(" "));
    const read = key => {
        try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
    };
    const extension = name => name.match(/\.([^.]+)$/)?.[1]?.toLowerCase() || "";
    function resolve(file) {
        const original = window.EXPLORER_FOLDERS.flatMap(folder => folder.files).find(item => item.id === file.id) || file;
        return { ...original, ...read(stateKey)[original.id] };
    }
    function listFiles(directoryId) {
        const folder = window.EXPLORER_FOLDERS.find(item => item.id === directoryId);
        let files = folder?.files || [];
        if (directoryId === "photos") {
            const future = read("photo_folder_state").status === "future";
            files = files.filter(file => future ? file.id === "photo-future" : file.id !== "photo-future");
        }
        return files.map(resolve);
    }
    function rename(file, requestedName) {
        if (resolve(file).locked) throw new Error("这个文件无法更改名称");
        const name = requestedName.trim();
        if (!name || name.length > 180 || /[<>:"/\\|?*\x00-\x1f]/.test(name) || /[. ]$/.test(name) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) {
            throw new Error("文件名无效，请重新输入");
        }
        const supported = commonExtensions.has(extension(name));
        const finalName = supported ? name : `${name.replace(/\.[^.]+$/, "")}.txt`;
        const folder = window.EXPLORER_FOLDERS.find(item => item.files.some(item => item.id === file.id));
        if (!folder) throw new Error("文件不存在");
        if (folder.files.some(item => item.id !== file.id && resolve(item).name.toLowerCase() === finalName.toLowerCase())) {
            throw new Error("此文件夹中已存在同名文件");
        }
        const saved = read(stateKey);
        saved[file.id] = { name: finalName, invalidFormat: !supported };
        localStorage.setItem(stateKey, JSON.stringify(saved));
        return resolve(file);
    }
    const showExtensions = () => read(settingsKey).showExtensions === true;
    return {
        stateKey, settingsKey, resolve, listFiles, rename, extension, showExtensions,
        displayName: file => showExtensions() ? file.name : file.name.replace(/\.[^.]+$/, ""),
        setShowExtensions: value => localStorage.setItem(settingsKey, JSON.stringify({ showExtensions: value })),
        canImport: file => file.importType === "qq-messages" && !file.invalidFormat && extension(file.name) === "db",
        canPreview: file => !file.invalidFormat && file.preview !== false && !!file.src && extension(file.name) === extension(file.src),
        typeLabel: file => `${extension(file.name).toUpperCase()} ${/^(png|jpg|jpeg|gif|bmp|webp|ico|svg)$/.test(extension(file.name)) ? "图片" : "文件"}`
    };
})();
