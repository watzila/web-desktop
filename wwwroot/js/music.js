class Music {
    constructor(id) {
        this.iframe = document.getElementById(id);
        this.volumeSlider = this.iframe.querySelector(".volumeSlider");
        this.playBTN = this.iframe.querySelector(".playBTN");
        this.muteBTN = this.iframe.querySelector(".muteBTN");
        this.videoTitle = this.iframe.querySelector(".videoTitle h3");
        this.videoIMG = this.iframe.querySelector(".ytVideoIMG>img");
        this.timeSlider = this.iframe.querySelector(".timeSlider");
        this.currentTimeText = this.iframe.querySelector(".currentTimeText");
        this.totalTimeText = this.iframe.querySelector(".totalTimeText");
        this.player;
        this.playStatus = false;
        this.musicUrl = ['5aH-Uw_-Tmc'];
        this.duration = 0;//影片總時長（秒）
        this.durationText = "00:00";
        this.currentTime = 0;
        this.updateInterval;

        this.init();
    }

    init() {
        const youtubeIframe = this.iframe.querySelector(".yt");
        this.player = new YT.Player(youtubeIframe, {
            height: '200',
            width: '200',
            videoId: this.musicUrl[0],
            playerVars: {
                modestbranding: 1,
                disablekb: 1,
                enablejsapi: 1, // 啟用 API 控制
                controls: 0,
                referrerpolicy: "origin",
            },
            events: {
                "onReady": (e) => this.onPlayerReady(e),
                "onStateChange": (e) => this.onPlayerStateChange(e)
            }
        });

        console.log(this.player);
    }

    play(id) {
        this.player.loadVideoById(id);
    }

    getIMG(id,num=0) {
        return `https://img.youtube.com/vi/${id}/${num}.jpg`;
    }

    onPlayerReady(e) {
        this.videoTitle.innerText = this.player.videoTitle;
        this.volumeSlider.value = this.player.getVolume();
        this.duration = this.player.getDuration();
        this.timeSlider.max = this.duration;
        this.durationText = this.formatTime(this.duration);
        this.totalTimeText.innerText = this.durationText;
        this.videoIMG.src = this.getIMG(this.musicUrl[0]);

        this.playBTN.onclick = () => {
            if (this.playStatus) {
                this.playStatus = false;
                this.playBTN.innerText = "▶️";
                this.player.pauseVideo();
            } else {
                this.playStatus = true;
                this.playBTN.innerText = "⏸️";
                this.player.seekTo(this.currentTime, true);
                this.player.playVideo();
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
            }
        };
    }

    onPlayerStateChange(e) {
        switch (e.data) {
            case YT.PlayerState.ENDED:
                clearInterval(this.updateInterval);
                this.timeSlider.value = this.duration;
                this.currentTimeText.innerText = this.durationText;
                break;

            case YT.PlayerState.PLAYING:
                this.updateInterval = setInterval(() => this.updateProgress(), 500);
                break;

            case YT.PlayerState.PAUSED:
                clearInterval(this.updateInterval);
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

    updateProgress() {
        this.currentTime = this.player.getCurrentTime();

        this.timeSlider.value = this.currentTime;
        this.currentTimeText.innerText = this.formatTime(this.currentTime);
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
}

export default Music;