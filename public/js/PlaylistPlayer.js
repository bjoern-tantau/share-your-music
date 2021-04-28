class PlaylistPlayer extends Audio {
    constructor(url) {
        super()
        this.playlist = [];
        if (url && url.endsWith('.m3u')) {
            this.setPlaylist(url);
        } else if (url) {
            this.src = url;
        }

        this.addEventListener('ended', event => {
            this.next();
        });
    }

    previous() {
        this.currentTime = 0;
        if (this.playlist.length) {
            this.currentPosition--;
            if (this.currentPosition < 0) {
                if (!this.loopPlaylist) {
                    this.currentPosition = 0;
                    return;
                }
                this.currentPosition = this.playlist.length - 1;
            }
            this.src = this.playlist[this.currentPosition];
        }
        this.play();
    }

    next() {
        if (this.playlist.length) {
            this.currentPosition++;
            if (this.currentPosition >= this.playlist.length) {
                if (!this.loopPlaylist) {
                    this.currentPosition = this.playlist.length - 1;
                    return;
                }
                this.currentPosition = 0;
            }
            this.src = this.playlist[this.currentPosition];
            this.play();
        }
    }

    setPlaylist(url) {
        if (this.playlistUrl === url) {
            return Promise.resolve(this);
        }
        this.playlistUrl = url;
        this.dispatchEvent(new Event('playlistChanged'));
        return fetch(url)
                .then(response => response.json())
                .then(list => {
                    this.currentPosition = 0;
                    this.playlist = [];
                    list.forEach(item => {
                        const url = new URL(window.location.href);
                        url.pathname = item;
                        url.search = '';
                        this.playlist.push(url.href);
                    });
                    this.src = this.playlist[this.currentPosition];
                    this.dispatchEvent(new Event('playlistReady'));
                    return this;
                })
                ;
    }

    emptyPlaylist() {
        this.playlistUrl = null;
        this.currentPosition = null;
        this.playlist = [];
        this.dispatchEvent(new Event('playlistEmptied'));
        this.dispatchEvent(new Event('playlistChanged'));
    }

    get src() {
        return super.src;
    }

    set src(value) {
        if (value.endsWith('.m3u')) {
            this.setPlaylist(value);
            return;
        }
        super.src = value;
        if (this.playlist) {
            this.currentPosition = this.playlist.indexOf(value);
            if (this.currentPosition < 0) {
                this.emptyPlaylist();
            }
        }
    }
}

export default PlaylistPlayer;