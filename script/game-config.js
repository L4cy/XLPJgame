// 开发时刷新重置进度；发布时只需将 true 改成 false。
window.GAME_CONFIG = Object.freeze({ RESET_ON_REFRESH: false });
window.GAME_PROGRESS_KEYS = Object.freeze([
    "readStatus",
    "gameChatSave",
    "photo_folder_state"
]);

// 只有整个桌面刷新才重置，切换应用、返回桌面、加载 iframe 均不重置。
if (window === window.top &&
    performance.getEntriesByType("navigation")[0]?.type === "reload" &&
    window.GAME_CONFIG.RESET_ON_REFRESH) {
    window.GAME_PROGRESS_KEYS.forEach(key => {
        localStorage.removeItem(key);
    });
}
