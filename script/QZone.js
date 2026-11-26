// =====================
// QQ空间
// =====================

const qzoneFeed = document.querySelector(".qzone-feed");
const qzoneClose = document.querySelector(".qzone-close");
const profileAvatar = document.querySelector(".qzone-profile-avatar img");
profileAvatar.addEventListener("error", () => { profileAvatar.hidden = true; });
if (profileAvatar.complete && !profileAvatar.naturalWidth) profileAvatar.hidden = true;

const qzonePage = document.querySelector(".qzone-page");
const navigationItems = document.querySelectorAll(".qzone-nav-item");
let currentView = "feed";

function selectQZoneView(view) {
    currentView = view;
    navigationItems.forEach(item => {
        const selected = item.dataset.view === view;
        item.classList.toggle("is-active", selected);
        if (selected) item.setAttribute("aria-current", "page");
        else item.removeAttribute("aria-current");
    });
    qzoneFeed.hidden = view !== "feed";
    qzonePage.hidden = view === "feed";
    qzonePage.replaceChildren();
    if (view === "profile") {
        qzonePage.appendChild(createTextElement("h2", "", "XLPJ"));
        qzonePage.appendChild(createTextElement("p", "", "俺は運命と戦う、そして勝ってみせる。"));
    } else if (view === "album") {
        qzonePage.appendChild(createTextElement("h2", "", "相册"));
        const album = document.createElement("div");
        album.className = "qzone-album";
        qzoneFeed.querySelectorAll(".qzone-image").forEach(source => {
            const photo = source.cloneNode(true);
            photo.addEventListener("click", () => imagePreview.open(photo));
            photo.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    imagePreview.open(photo);
                }
            });
            album.appendChild(photo);
        });
        qzonePage.appendChild(album.children.length ? album : createTextElement("p", "qzone-loading", "暂无照片"));
    }
}

navigationItems.forEach(item => item.addEventListener("click", () => selectQZoneView(item.dataset.view)));
let imagePreviewTrigger = null;

function createImagePreview() {
    const preview = document.createElement("div");
    preview.className = "qzone-image-preview";
    preview.hidden = true;
    preview.setAttribute("role", "dialog");
    preview.setAttribute("aria-modal", "true");
    preview.setAttribute("aria-label", "查看图片");

    const image = document.createElement("img");
    image.className = "qzone-image-preview-content";

    const closeButton = document.createElement("button");
    closeButton.className = "qzone-image-preview-close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "关闭图片");
    closeButton.textContent = "×";

    preview.appendChild(image);
    preview.appendChild(closeButton);
    document.body.appendChild(preview);

    function closePreview() {
        if (preview.hidden) return;
        preview.hidden = true;
        image.removeAttribute("src");
        image.alt = "";
        document.body.classList.remove("qzone-preview-open");
        if (imagePreviewTrigger) imagePreviewTrigger.focus();
        imagePreviewTrigger = null;
    }

    closeButton.addEventListener("click", closePreview);
    preview.addEventListener("click", event => {
        if (event.target === preview) closePreview();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !preview.hidden) closePreview();
    });

    return {
        open(sourceImage) {
            imagePreviewTrigger = sourceImage;
            image.src = sourceImage.currentSrc || sourceImage.src;
            image.alt = sourceImage.alt;
            preview.hidden = false;
            document.body.classList.add("qzone-preview-open");
            closeButton.focus();
        }
    };
}

const imagePreview = createImagePreview();

function openQZone() {
    const qzone = document.querySelector(".qzone-window");
    if (qzone) {
        qzone.style.display = "flex";
    }
}

function closeQZone() {
    const qzone = document.querySelector(".qzone-window");
    if (qzone) {
        qzone.style.display = "none";
    }
}

if (qzoneClose) {
    qzoneClose.addEventListener("click", function () {
        GameApp.openPage("QQ.html");
    });
}

function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
}

function createPostText(text) {
    const element = document.createElement("div");
    element.className = "qzone-text";
    const mentionPattern = /@[\w\u3400-\u9fff]+/g;
    let lastIndex = 0;

    for (const match of text.matchAll(mentionPattern)) {
        element.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        element.appendChild(createTextElement("span", "qzone-mention", match[0]));
        lastIndex = match.index + match[0].length;
    }

    element.appendChild(document.createTextNode(text.slice(lastIndex)));
    return element;
}

function createArticleCard(article) {
    const card = document.createElement("a");
    card.className = "wechat-card";
    card.href = article.href;
    card.addEventListener("click", event => {
        const url = new URL(article.href, location.href);
        if (url.origin === location.origin) {
            event.preventDefault();
            GameApp.openPage(article.href);
        }
    });
    card.setAttribute("aria-label", `阅读文章：${article.title}`);

    const info = document.createElement("div");
    info.className = "wechat-info";
    info.appendChild(createTextElement("div", "wechat-title", article.title));
    info.appendChild(createTextElement("div", "wechat-summary", article.summary));
    info.appendChild(createTextElement("div", "wechat-source", article.source));

    const read = document.createElement("span");
    read.className = "wechat-read";
    read.appendChild(document.createTextNode("阅读全文 "));

    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "›";
    read.appendChild(arrow);

    card.appendChild(info);
    card.appendChild(read);
    return card;
}

function createActions(actions) {
    const actionBox = document.createElement("div");
    actionBox.className = "qzone-actions";

    const likeText = actions.likes == null ? "点赞" : `点赞(${actions.likes})`;
    const commentText = actions.comments == null ? "评论" : `评论(${actions.comments})`;

    actionBox.appendChild(createTextElement("button", "", likeText));
    actionBox.appendChild(createTextElement("button", "", commentText));
    return actionBox;
}

function createComments(comments) {
    const commentBox = document.createElement("div");
    commentBox.className = "qzone-comments";

    comments.forEach(comment => {
        if (comment.type === "omitted") {
            commentBox.appendChild(
                createTextElement("div", "comment-item comment-omitted", comment.text)
            );
            return;
        }

        const item = document.createElement("div");
        item.className = comment.reply ? "comment-item reply" : "comment-item";
        item.appendChild(createTextElement("span", "comment-name", `${comment.author}:`));
        item.appendChild(document.createTextNode(" "));
        item.appendChild(createTextElement("span", "comment-text", comment.text));
        commentBox.appendChild(item);
    });

    return commentBox;
}

function createPost(post) {
    const postElement = document.createElement("article");
    postElement.className = "qzone-post";
    postElement.dataset.time = post.time;

    const avatar = document.createElement("img");
    avatar.className = "qzone-avatar";
    avatar.src = post.avatar;
    avatar.alt = "";

    const avatarFrame = document.createElement("div");
    avatarFrame.className = "qzone-avatar-frame";
    avatarFrame.appendChild(avatar);

    const header = document.createElement("header");
    header.className = "qzone-post-header";
    const identity = document.createElement("div");
    identity.className = "qzone-identity";
    identity.appendChild(createTextElement("div", "qzone-name", post.author));
    identity.appendChild(createTextElement("time", "qzone-time", post.time));
    header.appendChild(avatarFrame);
    header.appendChild(identity);

    const content = document.createElement("div");
    content.className = "qzone-content";

    const text = createPostText(post.text);
    if (post.link) {
        text.appendChild(document.createTextNode(" "));
        const link = createTextElement("a", "qq-link", post.link.label);
        link.href = post.link.href;
        link.addEventListener("click", event => {
            const url = new URL(post.link.href, location.href);
            if (url.origin === location.origin) {
                event.preventDefault();
                GameApp.openPage(post.link.href);
            }
        });
        text.appendChild(link);
    }
    content.appendChild(text);

    if (post.image) {
        const postImage = document.createElement("img");
        postImage.className = "qzone-image";
        postImage.src = post.image.src;
        postImage.alt = post.image.alt || "动态配图";
        postImage.tabIndex = 0;
        postImage.setAttribute("role", "button");
        postImage.setAttribute("aria-label", `查看大图：${postImage.alt}`);
        postImage.addEventListener("click", () => imagePreview.open(postImage));
        postImage.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                imagePreview.open(postImage);
            }
        });
        content.appendChild(postImage);
    }

    if (post.article) {
        content.appendChild(createArticleCard(post.article));
    }

    if (post.actions) {
        content.appendChild(createActions(post.actions));
    }

    if (post.commentList && post.commentList.length > 0) {
        content.appendChild(createComments(post.commentList));
    }

    postElement.appendChild(header);
    postElement.appendChild(content);
    return postElement;
}

function renderPosts(posts) {
    const newestFirstPosts = [...posts].sort((first, second) =>
        second.time.localeCompare(first.time)
    );

    qzoneFeed.innerHTML = "";
    newestFirstPosts.forEach(post => {
        qzoneFeed.appendChild(createPost(post));
    });
    qzoneFeed.scrollTop = 0;
    if (currentView !== "feed") selectQZoneView(currentView);
}

function showLoadError() {
    qzoneFeed.innerHTML = "";
    qzoneFeed.appendChild(
        createTextElement("div", "qzone-loading qzone-error", "动态加载失败，请稍后重试。")
    );
}

fetch("qzonedata/posts.json")
    .then(response => {
        if (!response.ok) {
            throw new Error("QZone 动态数据不存在");
        }
        return response.json();
    })
    .then(data => renderPosts(data.posts || []))
    .catch(error => {
        console.error(error);
        showLoadError();
    });
