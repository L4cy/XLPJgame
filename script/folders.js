// 文件夹列表。添加新文件夹时，在数组中增加一项即可。
// 普通文件夹暂时留空；之后可在 files 中加入 { name: "示例.png", src: "figure/示例.png" }。
// photofolder 的内容由原有相册剧情控制。
window.EXPLORER_FOLDERS = [
    { id: "photos", name: "photofolder", files: [] },
    { id: "documents", name: "文档", files: [] },
    { id: "downloads", name: "下载", files: [] },
    { id: "notes", name: "笔记", files: [] },
    { id: "work", name: "工作资料", files: [] },
    { id: "projects", name: "项目", files: [] },
    { id: "backup", name: "备份", files: [] },
    {
        id: "other",
        name: "地图",
        files: [
            { name: "地图", type: "JPG", src: "figure/map.jpg" }
        ]
    }
];
