
class Music {
    constructor(ele) {
        this.volumeSlider = ele.getElementById("volumeSlider");
        this.playBTN = ele.getElementById("playBTN");
        this.muteBTN = ele.getElementById("muteBtn");
        this.player;
        this.playStatus = false;
        this.musicUrl = ['xyltN9Io8Hk'];

        this.init();
    }

    init() {
        player = new YT.Player('', {
            height: '0',
            width: '0',
            videoId: this.musicUrl[0], // 替換為你想播放的影片 ID
            playerVars: {
                controls: 0
            }
        });

        this.addEvent();
        console.log(this.player);
    }

    play(id) {
        this.player.loadVideoById(id);
    }

    addEvent() {
        this.playBTN.onclick = () => {
            if (this.playStatus) {
                this.playStatus = false;
                this.player.pauseVideo();
            } else {
                this.playStatus = true;
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

