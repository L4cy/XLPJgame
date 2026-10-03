# XLPJ 失踪事件

## 该游戏目前为半成品，上传仅用于测试，请静候完结

从 `index.html` 开始，登录成功后进入 `second.html` 桌面。请通过静态 HTTP 服务访问，聊天、搜索和空间的数据使用 fetch 读取 JSON，不能直接双击 HTML 游玩。

## 桌面与存档

- 桌面包含 QQ、文件夹、search 三个入口，单击即可打开。文件夹内有 photofolder 和多个空文件夹；点击上方 ↑ 或“文件夹”路径可返回列表。
- QQ 和相册各自只保留一层窗口，点击窗口右上角的 × 返回桌面；搜索也提供 ×。底部任务栏可随时切换应用。
- 应用以保留的 iframe 运行，返回桌面只隐藏页面，不重新加载、不清空存档。QQ 在后台继续回复，右下角提示显示在外层桌面，在相册、搜索、空间和 AES 页面也能看到。
- QQ 记录、未读状态、相册剧情保存在当前站点的 localStorage；待回复和下一组选项也随存档保存。

## 发布时关闭刷新重置

目前保留开发行为：刷新整个桌面后重置游戏进度，以便重新测试剧情。打开 `script/game-config.js`，将：

```js
window.GAME_CONFIG = Object.freeze({ RESET_ON_REFRESH: true });
```

改为：

```js
window.GAME_CONFIG = Object.freeze({ RESET_ON_REFRESH: false });
```

这是唯一的刷新重置开关，不需要再修改 QQ.js 或 photofolder.js。发布后刷新或重新打开同一站点会保留存档。换浏览器、清除网站数据或更换域名/端口不会沿用原站点存档。

## 扩充文件夹

在 `script/folders.js` 修改文件夹名称或增加文件夹。普通文件夹的 `files` 数组目前为空，之后可添加 `{ name: "图片.png", src: "figure/图片.png" }` 形式的图片项；photofolder 继续使用原有相册剧情和存档。

## 图片占位

新增桌面图片使用暂不存在的 PNG 路径，上传对应文件后自动替换临时图标和渐变背景：

- `figure/desktop-wallpaper.png`：桌面壁纸
- `figure/desktop-qq.png`：QQ 图标
- `figure/desktop-photofolder.png`：相册图标
- `figure/desktop-search.png`：搜索图标

原有剧情照片与锁屏图片继续使用现有文件。QQ 头像原本引用的 `avatar/*.png` 尚未提供，可按原路径补充。
