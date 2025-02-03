class Music {
    constructor(id) {
        this.iframeId = id;
        this.volumeSlider = document.querySelector(`#${this.iframeId} #volumeSlider`);
        this.playBTN = document.querySelector(`#${this.iframeId} #playBTN`);
        this.muteBTN = document.querySelector(`#${this.iframeId} #muteBtn`);
        this.player;
        this.playStatus = false;
        this.musicUrl = ['5aH-Uw_-Tmc'];

        this.init();
    }

    init() {
        const yt = document.querySelector(`#${this.iframeId} #yt`);
        yt.id = this.iframeId + 'YT';
        this.player = new YT.Player(this.iframeId + 'YT', {
            height: '0',
            width: '0',
            videoId: this.musicUrl[0],
            playerVars: {
                enablejsapi: 1, // 啟用 API 控制
                autoplay: 0,
                controls: 0
            },
            events: {
                "onReady": (e) =>  this.onPlayerReady(e)
            }
        });

        console.log(this.player);
    }

    play(id) {
        this.player.loadVideoById(id);
    }

    onPlayerReady(e) {
        this.volumeSlider.value = this.player.getVolume();

        this.playBTN.onclick = () => {
            if (this.playStatus) {
                this.playStatus = false;
                this.playBTN.innerText = "播放";
                this.player.pauseVideo();
            } else {
                this.playStatus = true;
                this.playBTN.innerText = "暫停";
                this.player.playVideo();
            }
        };

        this.muteBTN.onclick = () => {
            this.player.isMuted() ? this.player.unMute() : this.player.mute();
        };

        this.volumeSlider.oninput = (e) => {
            this.player.setVolume(e.target.value);
        };
    }

}

export default Music;