class Music {
    constructor(id) {
        this.iframe = document.getElementById(id);
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
        this.removeMusicBTNs = this.iframe.querySelectorAll(".removeMusicBTN");
        this.player;
        this.playStatus = false;
        this.musicId = ['5aH-Uw_-Tmc', 'kcxCVn5ToQc'];
        this.duration = 0;//影片總時長（秒）
        this.durationText = "00:00";
        this.currentTime = 0;
        this.updateInterval;
        this.index = 0;

        this.init();
    }

    init() {
        this.listBTN.onclick = () => {
            this.playlistPanel.classList.toggle("closed");
        };

        this.removeMusicBTNs.forEach((btn, index) => {
            btn.onclick = (e) => {
                e.target.closest("li").remove();
            };
        });

        const youtubeIframe = this.iframe.querySelector(".yt");
        this.player = new YT.Player(youtubeIframe, {
            height: '0',
            width: '0',
            videoId: this.musicId[this.index],
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
        this.player.loadVideoById(id);
        setTimeout(() => this.displayInit(id), 2000);
    }

    /**
     * 取得 YouTube 影片預覽圖
     * @param {string} id YouTube 影片 ID
     * @param {number} num 預覽圖編號
     * @returns {string} YouTube 影片預覽圖網址
     */
    getIMG(id, num = 0) {
        return `https://img.youtube.com/vi/${id}/${num}.jpg`;
    }

    /**
     * 播放器準備就緒時觸發
     * @param {Object} e 播放器事件物件
     */
    onPlayerReady(e) {
        this.videoIMG.src = this.getIMG(this.musicId[0]);
        this.displayInit();

        this.playBTN.onclick = () => {
            if (this.playStatus) {
                this.player.pauseVideo();
            } else {
                this.player.seekTo(this.currentTime, true);
                this.player.playVideo();
            }
        };

        this.nextBTN.onclick = () => {
            if (this.index + 1 < this.musicId.length) {
                this.index += 1;
                this.play(this.musicId[this.index]);
            }
        };

        this.prevBTN.onclick = () => {
            if (this.index - 1 >= 0) {
                this.index -= 1;
                this.play(this.musicId[this.index]);
            }
        };

        this.muteBTN.onclick = () => {
            if (this.player.isMuted()) {
                this.player.unMute();
                this.muteBTN.innerText = "🔊"; // 音量圖示
            } else {
                this.player.mute();
                this.muteBTN.innerText = "🔇"; // 靜音圖示
            }
        };

        this.volumeSlider.oninput = (e) => {
            this.player.setVolume(e.target.value);
        };

        this.timeSlider.oninput = (e) => {
            clearInterval(this.updateInterval);

            e.target.onmouseup = () => {
                this.currentTime = e.target.value;
                this.currentTimeText.innerText = this.formatTime(e.target.value);

                if (this.playStatus) {
                    this.player.seekTo(e.target.value, true);
                }
            };
        };
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
     * 格式化時間
     * @param {number} seconds 秒數
     * @returns {string} 時間字串
     */
    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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