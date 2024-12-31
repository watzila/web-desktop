class Music {
    constructor(obj) {
        this.volumeBTN = obj.target.getElementById(obj.volumeBTN);
        this.playBTN = obj.target.getElementById(obj.playBTN);
        this.pauseBTN = obj.target.getElementById(obj.pauseBTN);
        this.muteBTN = obj.target.getElementById(obj.muteBTN);
        this.player;
        this.musicUrl = [];

        this.init();
    }

    init() {
        player = new YT.Player('', {
            height: '0',
            width: '0',
            videoId: this.musicUrl[0], // 替換為你想播放的影片 ID
            playerVars: {
                autoplay: 1,
                controls: 0
            }
        });

        console.log(this.player);
    }

    play() {
        this.player.videoId = "";
    }

    addEvent() {

    }

}