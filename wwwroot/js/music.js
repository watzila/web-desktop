class Music {
    constructor(id) {
        this.iframe = document.getElementById(id);
        this.volumeSlider = this.iframe.querySelector(".volumeSlider");
        this.playBTN = this.iframe.querySelector(".playBTN");
        this.muteBTN = this.iframe.querySelector(".muteBtn");
        this.videoTitle = this.iframe.querySelector(".videoTitle");
        this.timeSlider = this.iframe.querySelector(".timeSlider");
        this.timeText = this.iframe.querySelector(".timeText");
        this.player;
        this.playStatus = false;
        this.musicUrl = ['5aH-Uw_-Tmc'];
        this.duration = 0;//影片總時長（秒）
        this.durationText = "0:00";
        this.currentTime = 0;
        this.updateInterval;

        this.init();
    }

    init() {
        const yt = this.iframe.querySelector(".yt");
        this.player = new YT.Player(yt, {
            height: '200',
            width: '200',
            videoId: this.musicUrl[0],
            playerVars: {
                enablejsapi: 1, // 啟用 API 控制
                autoplay: 0,
                controls: 0
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

    onPlayerReady(e) {
        this.videoTitle.innerText = this.player.videoTitle;
        this.volumeSlider.value = this.player.getVolume();
        this.duration = this.player.getDuration();
        this.timeSlider.max = this.duration;
        this.durationText = this.formatTime(this.duration);
        this.timeText.innerText = `0:00/${this.durationText}`;

        this.playBTN.onclick = () => {
            if (this.playStatus) {
                this.playStatus = false;
                this.playBTN.innerText = "播放";
                this.player.pauseVideo();
            } else {
                this.playStatus = true;
                this.playBTN.innerText = "暫停";
                this.player.seekTo(this.currentTime, true);
            }
        };

        this.muteBTN.onclick = () => {
            this.player.isMuted() ? this.player.unMute() : this.player.mute();
        };

        this.volumeSlider.oninput = (e) => {
            this.player.setVolume(e.target.value);
        };

        this.timeSlider.oninput = (e) => {
            clearInterval(this.updateInterval);

            e.target.onmouseup = () => {
                this.currentTime = e.target.value;
                this.timeText.innerText = this.formatTime(e.target.value) + "/" + this.durationText;

                if (this.playStatus) {
                    this.player.seekTo(e.target.value, true);
                }
            }
        };
    }

    onPlayerStateChange(e) {
        if (e.data == YT.PlayerState.PLAYING) {
            this.updateInterval = setInterval(() => this.updateProgress(), 500);
        } else {
            clearInterval(this.updateInterval);
        }
    }

    updateProgress() {
        this.currentTime = this.player.getCurrentTime();

        this.timeSlider.value = this.currentTime;
        this.timeText.innerText = this.formatTime(this.currentTime) + "/" + this.durationText;
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    }
}

export default Music;