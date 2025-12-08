import BaseComponent from "./BaseComponent.js";
import Ajax from "./component/ajax.js";
import eventBus from "./component/eventBus.js";

class Music extends BaseComponent {
    constructor(id, model) {
        super(id);
        this.volumeSlider = this.iframe.querySelector(".volumeSlider");
        this.playBTN = this.iframe.querySelector(".playBTN");
        this.prevBTN = this.iframe.querySelector(".prevBTN");
        this.nextBTN = this.iframe.querySelector(".nextBTN");
        this.muteBTN = this.iframe.querySelector(".muteBTN");
        this.listBTN = this.iframe.querySelector("#listBTN");
        this.videoTitle = this.iframe.querySelector(".videoTitle h3");
        this.videoIMG = this.iframe.querySelector(".ytVideoIMG>img");
        this.timeSlider = this.iframe.querySelector(".timeSlider");
        this.currentTimeText = this.iframe.querySelector(".currentTimeText");
        this.totalTimeText = this.iframe.querySelector(".totalTimeText");
        this.playlistPanel = this.iframe.querySelector("#playlistPanel");
        this.addFileBTN = this.iframe.querySelector("#addFileBTN");
        this.addYouTubeBTN = this.iframe.querySelector("#addYouTubeBTN");
        this.urlDialog = this.iframe.querySelector("#addUrl");
        this.player;
        this.audioPlayer = new Audio(); // 檔案音檔播放器
        this.playStatus = false;
        this.music = model.data;
        this.duration = 0;//影片總時長（秒）
        this.durationText = "00:00";
        this.currentTime = 0;
        this.updateInterval;
        this.index = - 1;//當前音樂索引
        this.source;//當前音樂來源

        this.init();
    }

    init() {
        this.setEvent(this.listBTN, "click", () => {
            this.playlistPanel.classList.toggle("closed");
        });

        this.setEvent(this.addFileBTN, "click", async () => {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: "Music",
                    accept: { "audio/*": [] }
                }]
            });

            this.add({ name: fileHandle.name, handle: fileHandle, source: "file" });
        });

        this.setEvent(this.addYouTubeBTN, "click", () => {
            this.urlDialog.querySelector("input[type=text]").value = "";
            this.urlDialog.show();
        });

        this.setEvent(this.urlDialog.querySelector("form"), "submit", async () => {
            const textEle = this.urlDialog.querySelector("input[name=url]");
            let data = { path: textEle.value, source: "youtube" }

            try {
                switch (data.source) {
                    case "youtube":
                        await Ajax.conn({
                            type: "get", url: "https://noembed.com/embed", data: { dataType: "json", url: data.path }, fn: (res) => {
                                if (!res || !res.title) {
                                    eventBus.emit("error", JSON.stringify({ title: data.path, msg: "✖無法取得影片資訊" }));
                                    return;
                                }

                                data.name = res.title;
                            }
                        }).catch(error => {
                            eventBus.emit("error", error.message);
                        });
                        break;
                }

                this.add(data);
            } catch (error) {
                eventBus.emit("error", error.message);
            }
        });

        this.playlistPanel.querySelectorAll(".playlist>li>span").forEach(btn => {
            this.setEvent(btn, "click", (e) => {
                e.stopPropagation();
                const index = this.music.findIndex(a => a.id == e.currentTarget.dataset.id);
                this.index = index;
                this.source = this.music[index].source;
                const id = this.parseYoutubeUrl(this.music[index].path);
                this.play(id);
            });
        });

        Array.from(this.playlistPanel.getElementsByClassName("removeMusicBTN")).forEach(btn => {
            this.setEvent(btn, "click", (e) => {
                e.stopPropagation();
                this.delete(e);
            });
        });

        this.setEvent(this.audioPlayer, "loadedmetadata", () => {
            this.duration = parseInt(this.audioPlayer.duration);
            this.displayInit();
        });

        this.setEvent(this.audioPlayer, "timeupdate", () => {
            if (!this.audioPlayer.paused && !this.audioPlayer.ended) {
                this.playStatus = true;
                this.currentTime = this.audioPlayer.currentTime;
                this.updateProgress();
            } else {
                this.playStatus = false;
            }
        });

        this.setEvent(this.audioPlayer, "ended", () => {
            this.playStatus = false;
            this.playBTN.innerText = "▶️";
            this.playBTN.title = "播放";
        });

        this.PanelEvent();
    }

    /**
     * 初始化youtube player
     */
    ytPlayerInit(id = null) {
        if (this.player || this.music.length == 0 || (this.music.length > 0 && this.source != "youtube")) {
            return;
        }

        id = id || this.parseYoutubeUrl(this.music[this.index].path);
        const youtubeIframe = this.iframe.querySelector(".yt");
        this.player = new YT.Player(youtubeIframe, {
            height: '0',
            width: '0',
            videoId: id,
            playerVars: {
                modestbranding: 1,
                disablekb: 1,
                enablejsapi: 1, // 啟用 API 控制
                controls: 0,
            },
            events: {
                "onReady": (e) => this.displayInit(e),
                "onStateChange": (e) => this.onPlayerStateChange(e)
            }
        });
    }

    /**
     * 初始化控制面板顯示
     */
    displayInit() {
        switch (this.source) {
            case "youtube":
                this.videoTitle.innerText = this.player.videoTitle;
                this.volumeSlider.value = this.player.getVolume();
                this.duration = this.player.getDuration();
                this.videoIMG.title = this.player.videoTitle;
                break;
            case "file":
                this.videoTitle.innerText = this.music[this.index].name;
                this.videoIMG.title = this.videoTitle.innerText;
                this.currentTime = 0;
                break;
            default:
                this.duration = 0;
                break;
        }
        
        this.timeSlider.max = this.duration;
        this.durationText = this.formatTime(this.duration);
        this.totalTimeText.innerText = this.durationText;
        this.updateProgress();
    }

    play(id) {
        switch (this.source) {
            case "youtube":
                if (this.audioPlayer.src) {
                    this.audioPlayer.pause();
                    this.audioPlayer.dispatchEvent(new Event("ended"));
                }
                this.videoIMG.src = this.getIMG(id);
                if (this.player) {
                    this.player.cueVideoById(id);
                    setTimeout(() => this.displayInit(id), 2000);
                } else {
                    this.ytPlayerInit(id);
                }
                break;
            case "file":
                if (this.player && this.updateInterval) {
                    this.player.pauseVideo();
                    clearInterval(this.updateInterval);
                }
                this.videoIMG.src = "images/YTVideo.jpg"

                this.music[this.index].handle.queryPermission({ mode: "read" }).then(async (perm) => {
                    if (perm !== "granted") {
                        // 如未授權，請求權限
                        const req = await this.music[this.index].handle.requestPermission({ mode: "read" });
                        if (req !== "granted") {
                            eventBus.emit("error", "未授權無法讀取檔案");
                            return;
                        }
                    }

                    // 取得檔案 + 播放
                    const file = await this.music[this.index].handle.getFile();
                    const url = URL.createObjectURL(file);

                    // 儲存為實例變量以便控制
                    this.audioPlayer.src = url;
                });
                break;
        }
    }

    /**
     * 取得 YouTube 影片預覽圖
     * @param {number} num 預覽圖編號
     * @returns {string} YouTube 影片預覽圖網址
     */
    getIMG(id = null, num = 0) {
        id = id || this.parseYoutubeUrl(this.music[this.index].path);
        return `https://img.youtube.com/vi/${id}/${num}.jpg`;
    }

    /**
     * 控制面板事件
     */
    PanelEvent() {
        this.setEvent(this.playBTN, "click", () => {
            switch (this.source) {
                case "youtube":
                    if (this.playStatus) {
                        this.player.pauseVideo();
                    } else {
                        this.player.seekTo(this.currentTime, true);
                        this.player.playVideo();
                    }
                    break;
                case "file":
                    if (this.playStatus) {
                        this.audioPlayer.pause();
                    } else {
                        this.audioPlayer.play();
                    }
                    break;
                default:
                    return;
            }
            if (this.playStatus) {
                this.playBTN.innerText = "▶️";
                this.playBTN.title = "播放";
            } else {
                this.playBTN.innerText = "⏸️";
                this.playBTN.title = "暫停";
            }
        });

        this.setEvent(this.nextBTN, "click", () => {
            if (this.index + 1 < this.music.length) {
                this.index += 1;
                this.source = this.music[this.index].source;
                const id = this.parseYoutubeUrl(this.music[this.index].path);
                this.play(id);
                this.playBTN.innerText = "▶️";
                this.playBTN.title = "播放";
            }
        });

        this.setEvent(this.prevBTN, "click", () => {
            if (this.index - 1 >= 0) {
                this.index -= 1;
                this.source = this.music[this.index].source;
                const id = this.parseYoutubeUrl(this.music[this.index].path);
                this.play(id);
                this.playBTN.innerText = "▶️";
                this.playBTN.title = "播放";
            }
        });

        this.setEvent(this.muteBTN, "click", () => {
            switch (this.source) {
                case "youtube":
                    if (this.player.isMuted()) {
                        this.player.unMute();
                        this.muteBTN.innerText = "🔊"; // 音量圖示
                    } else {
                        this.player.mute();
                        this.muteBTN.innerText = "🔇"; // 靜音圖示
                    }
                    break;
                case "file":
                    this.audioPlayer.muted = !this.audioPlayer.muted;
                    if (this.audioPlayer.muted) {
                        this.muteBTN.innerText = "🔇"; // 靜音圖示
                    } else {
                        this.muteBTN.innerText = "🔊"; // 音量圖示
                    }
                    break;
            }
        });

        this.setEvent(this.volumeSlider, "input", (e) => {
            switch (this.source) {
                case "youtube":
                    this.player.setVolume(e.target.value);
                    break;
                case "file":
                    this.audioPlayer.volume = e.target.value / 100;
                    break;
            }
        });

        this.setEvent(this.timeSlider, "input", (e) => {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }

            e.target.onmouseup = () => {
                this.currentTime = e.target.value;
                this.currentTimeText.innerText = this.formatTime(e.target.value);

                if (this.playStatus) {
                    switch (this.source) {
                        case "youtube":
                            this.player.seekTo(e.target.value, true);
                            break;
                        case "file":
                            this.audioPlayer.currentTime = e.target.value;
                            break;
                    }
                }
            };
        });
    }

    /**
     * yt播放器狀態改變時觸發
     * @param {Object} e 播放器事件物件
     */
    onPlayerStateChange(e) {
        switch (e.data) {
            case YT.PlayerState.ENDED:
                clearInterval(this.updateInterval);
                this.timeSlider.value = this.duration;
                this.currentTimeText.innerText = this.durationText;
                this.playStatus = false;
                this.playBTN.innerText = "▶️";
                this.playBTN.title = "播放";
                break;

            case YT.PlayerState.PLAYING:
                this.updateInterval = setInterval(() => this.updateProgress(), 500);
                this.playStatus = true;                
                break;

            case YT.PlayerState.PAUSED:
                clearInterval(this.updateInterval);
                this.playStatus = false;                
                break;

            //case YT.PlayerState.BUFFERING:
            //    break;

            //case YT.PlayerState.CUED:
            //    break;

            default:
                clearInterval(this.updateInterval);
                break;
        }
    }

    /**
     * 更新播放進度
     */
    updateProgress() {
        switch (this.source) {
            case "youtube":
                this.currentTime = this.player.getCurrentTime();
                break;
        }

        this.timeSlider.value = this.currentTime;
        this.currentTimeText.innerText = this.formatTime(this.currentTime);
    }

    /**
     * 新增音樂
     * @param {object} data
     */
    add(data) {
        Ajax.conn({
            type: "post", url: "/api/Music/Add", data: data, fn: (res) => {
                if (!res) return;
                data.id = res.returnData;
                this.music.push(data);

                const liEle = document.createElement("li");
                const spanEle = document.createElement("span");
                spanEle.setAttribute("data-id", data.id);
                spanEle.innerText = data.name;
                const removeBTNEle = document.createElement("button");
                removeBTNEle.setAttribute("class", "removeMusicBTN");
                removeBTNEle.setAttribute("data-source", data.source);
                removeBTNEle.value = data.id;
                removeBTNEle.innerHTML = "<b>&#128473;</b>";

                this.setEvent(spanEle, "click", (e) => {
                    e.stopPropagation();
                    const index = this.music.findIndex(a => a.id == e.currentTarget.dataset.id);
                    this.index = index;
                    this.source = this.music[index].source;
                    const id = this.parseYoutubeUrl(this.music[index].path);
                    this.play(id);
                });

                this.setEvent(removeBTNEle, "click", (e) => {
                    e.stopPropagation();
                    this.delete(e);
                });
                liEle.appendChild(spanEle);
                liEle.appendChild(removeBTNEle);
                this.playlistPanel.querySelector(".playlist").appendChild(liEle);

            }, contentType: "application/json"
        }).catch(error => {
            eventBus.emit("error", error.message);
        });
    }

    /**
     * 刪除音樂
     * @param {object} e
     */
    delete(e) {
        Ajax.conn({
            type: "post", url: "/api/Music/Delete", data: { id: e.currentTarget.value }, contentType: "application/json"
        }).catch(error => {
            eventBus.emit("error", error.message);
        });

        const index = this.music.findIndex(a => a.id == e.currentTarget.value);
        if (this.index > index) {
            this.index--;
        }
        this.music.splice(index, 1);
        e.currentTarget.closest("li").remove();
    }

    /**
     * 格式化時間
     * @param {number} seconds 秒數
     * @returns {string} 時間字串
     */
    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }

    destroy() {
        if (this.player?.destroy) this.player.destroy();
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer = null;
        }
        clearInterval(this.updateInterval);
        super.destroy();
    }

    /**
     * 取得 YouTube 影片 ID
     * @param {string} url YouTube 影片網址
     * @returns {string} YouTube 影片 ID
     */
    parseYoutubeUrl(url) {
        let id = "";
        if (url == undefined) {
            return id;
        }
        const p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
        const urlMatch = url.match(p)
        if (urlMatch) {
            id = urlMatch[1];
        }

        return id;
    }
}

export default Music;