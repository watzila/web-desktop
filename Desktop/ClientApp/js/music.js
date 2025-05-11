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
        this.playStatus = false;
        this.music = model.data;
        this.duration = 0;//影片總時長（秒）
        this.durationText = "00:00";
        this.currentTime = 0;
        this.updateInterval;
        this.index = this.music.length > 0 ? 0 : - 1;//當前音樂索引

        this.init();
    }

    init() {
        this.setEvent(this.listBTN, "click", () => {
            this.playlistPanel.classList.toggle("closed");
        });

        //this.setEvent(this.addFileBTN, "click", () => {

        //});

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
                                if (!res || !res.title) throw new Error(JSON.stringify({ title: data.path, msg: "✖無法取得影片資訊" }));

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
                const index = this.music.findIndex(a => a.path == e.currentTarget.dataset.path);
                this.index = index;
                const id = this.parseYoutubeUrl(this.music[index].path);
                this.play(id);
            });
        });

        Array.from(this.playlistPanel.getElementsByClassName("removeMusicBTN")).forEach(btn => {
            this.setEvent(btn, "click", (e) => {
                e.stopPropagation();
                this.delete(e.currentTarget.value);

                const index = this.music.findIndex(a => a.id == e.currentTarget.value);
                this.music.splice(index, 1);
                e.currentTarget.closest("li").remove();
            });
        });


        //this.playerInit();
    }

    /**
     * 初始化youtube player
     */
    playerInit(id = null) {
        if (this.music.length == 0 || (this.music.length > 0 && this.music[this.index].source != "youtube") || this.player) {
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
                "onReady": (e) => this.onPlayerReady(e),
                "onStateChange": (e) => this.onPlayerStateChange(e)
            }
        });
    }

    /**
     * 初始化播放器顯示
     */
    displayInit() {
        this.videoTitle.innerText = this.player.videoTitle;
        this.volumeSlider.value = this.player.getVolume();
        this.duration = this.player.getDuration();
        this.timeSlider.max = this.duration;
        this.durationText = this.formatTime(this.duration);
        this.totalTimeText.innerText = this.durationText;
        this.videoIMG.title = this.player.videoTitle;
        this.updateProgress();
        //console.log(this.player);
    }

    play(id) {
        this.videoIMG.src = this.getIMG(id);
        if (this.player) {
            this.player.loadVideoById(id);
            setTimeout(() => this.displayInit(id), 2000);
        } else {
            this.playerInit(id);
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
     * 播放器準備就緒時觸發
     * @param {Object} e 播放器事件物件
     */
    onPlayerReady(e) {
        this.videoIMG.src = this.getIMG();
        this.displayInit();

        this.setEvent(this.playBTN, "click", () => {
            if (this.playStatus) {
                this.player.pauseVideo();
            } else {
                this.player.seekTo(this.currentTime, true);
                this.player.playVideo();
            }
        });

        this.setEvent(this.nextBTN, "click", () => {
            if (this.index + 1 < this.music.length) {
                this.index += 1;
                const id = this.parseYoutubeUrl(this.music[this.index].path);
                this.play(id);
            }
        });

        this.setEvent(this.prevBTN, "click", () => {
            if (this.index - 1 >= 0) {
                this.index -= 1;
                const id = this.parseYoutubeUrl(this.music[this.index].path);
                this.play(id);
            }
        });

        this.setEvent(this.muteBTN, "click", () => {
            if (this.player.isMuted()) {
                this.player.unMute();
                this.muteBTN.innerText = "🔊"; // 音量圖示
            } else {
                this.player.mute();
                this.muteBTN.innerText = "🔇"; // 靜音圖示
            }
        });

        this.setEvent(this.volumeSlider, "input", (e) => {
            this.player.setVolume(e.target.value);
        });

        this.setEvent(this.timeSlider, "input", (e) => {
            clearInterval(this.updateInterval);

            e.target.onmouseup = () => {
                this.currentTime = e.target.value;
                this.currentTimeText.innerText = this.formatTime(e.target.value);

                if (this.playStatus) {
                    this.player.seekTo(e.target.value, true);
                }
            };
        });
    }

    /**
     * 播放器狀態改變時觸發
     * @param {Object} e 播放器事件物件
     */
    onPlayerStateChange(e) {
        switch (e.data) {
            case YT.PlayerState.ENDED:
                clearInterval(this.updateInterval);
                this.timeSlider.value = this.duration;
                this.currentTimeText.innerText = this.durationText;
                break;

            case YT.PlayerState.PLAYING:
                this.updateInterval = setInterval(() => this.updateProgress(), 500);
                this.playStatus = true;
                this.playBTN.innerText = "⏸️";
                this.playBTN.title = "暫停";
                break;

            case YT.PlayerState.PAUSED:
                clearInterval(this.updateInterval);
                this.playStatus = false;
                this.playBTN.innerText = "▶️";
                this.playBTN.title = "播放";
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
        this.currentTime = this.player.getCurrentTime();

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
                spanEle.setAttribute("data-path", data.path);
                spanEle.innerText = data.name;
                const removeBTNEle = document.createElement("button");
                removeBTNEle.setAttribute("class", "removeMusicBTN");
                removeBTNEle.setAttribute("data-source", data.source);
                removeBTNEle.value = data.id;
                removeBTNEle.innerHTML = "<b>&#128473;</b>";

                this.setEvent(spanEle, "click", (e) => {
                    e.stopPropagation();
                    const index = this.music.findIndex(a => a.path == e.currentTarget.dataset.path);
                    this.index = index;
                    const id = this.parseYoutubeUrl(this.music[index].path);
                    this.play(id);
                });

                this.setEvent(removeBTNEle, "click", (e) => {
                    e.stopPropagation();
                    this.delete(e.currentTarget.value);

                    const index = this.music.findIndex(a => a.id == e.currentTarget.value);
                    this.music.splice(index, 1);
                    e.currentTarget.closest("li").remove();
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
     * @param {string} id 音樂 ID
     */
    delete(id) {
        Ajax.conn({
            type: "post", url: "/api/Music/Delete", data: { id: id }, contentType: "application/json"
        }).catch(error => {
            eventBus.emit("error", error.message);
        });
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
        const p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
        const urlMatch = url.match(p)
        if (urlMatch) {
            id = urlMatch[1];
        }

        return id;
    }
}

export default Music;