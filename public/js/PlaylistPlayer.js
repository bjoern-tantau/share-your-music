import AudioPlayer from './AudioPlayer.js';

class PlaylistPlayer extends AudioPlayer {
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

        const style = document.createElement('style');
        style.textContent = `
        .repeat.none {
            text-decoration: line-through red;
        }
`;
        super.shadowRoot.appendChild(style);

        const nowPlaying = document.createElement('div');
        nowPlaying.className = 'now-playing-playlist';
        super.shadowRoot.querySelector('.now-playing').before(nowPlaying);
        this.addEventListener('playlistChanged', e => {
            const src = this.playlistUrl;
            nowPlaying.textContent = decodeURI(src.substr(src.lastIndexOf('/') + 1));
        });

        const controls = super.shadowRoot.querySelector('#controls');

        const previous = document.createElement('button');
        previous.className = 'previous';
        previous.innerHTML = '&#x23EE;';
        previous.addEventListener('click', event => {
            this.previous();
        });
        controls.appendChild(previous);
        const next = document.createElement('button');
        next.className = 'next';
        next.innerHTML = '&#x23ED;';
        next.addEventListener('click', event => {
            this.next();
        });
        controls.appendChild(next);

        const repeat = document.createElement('button');
        repeat.className = 'repeat';
        repeat.addEventListener('click', event => {
            this.changeRepeat();
        });
        controls.appendChild(repeat);
        this.repeat = 'none';

        this.addEventListener('repeatChanged', event => {
            switch (this.repeat) {
                case 'none':
                    repeat.innerHTML = '&#x1F501;';
                    repeat.classList.add('none');
                    break;
                case 'all':
                    repeat.innerHTML = '&#x1F501;';
                    repeat.classList.remove('none');
                    break;
                case 'one':
                    repeat.innerHTML = '&#x1F502;';
                    repeat.classList.remove('none');
                    break;
            }
        });

        const shuffle = document.createElement('button');
        shuffle.className = 'shuffle';
        shuffle.innerHTML = '&#x21C9;';
        shuffle.addEventListener('click', event => this.shuffle());
        this.addEventListener('shuffleChanged', event => {
            if (this.isShuffled) {
                shuffle.innerHTML = '&#x1F500;';
            } else {
                shuffle.innerHTML = '&#x21C9;';
            }
        });
        controls.appendChild(shuffle);
        this.isShuffled = false;
        this.unshuffledPlaylist = this.playlist = [];
    }

    previous() {
        this.currentTime = 0;
        if (this.playlist.length && this.repeat !== 'one') {
            this.currentPosition--;
            if (this.currentPosition < 0) {
                if (this.repeat === 'none') {
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
        if (this.repeat === 'one') {
            this.currentTime = 0;
            this.play();
        } else if (this.playlist.length) {
            this.currentPosition++;
            if (this.currentPosition >= this.playlist.length) {
                if (this.repeat === 'none') {
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
                    this.setPlaylistItems(list);
                    this.src = this.playlist[this.currentPosition];
                    this.dispatchEvent(new Event('playlistReady'));
                    return this;
                })
                ;
    }

    setPlaylistItems(items)
    {
        this.currentPosition = 0;
        this.playlist = [];
        items.forEach(item => {
            const url = new URL(window.location.href);
            url.pathname = item;
            url.search = '';
            this.playlist.push(url.href);
        });
        this.unshuffledPlaylist = this.playlist.slice(0);
        if (this.isShuffled) {
            // mark it as unshuffled so that it will be shuffled again
            this.isShuffled = false;
            this.shuffle();
        }
        return this;
    }

    emptyPlaylist() {
        this.playlistUrl = null;
        this.currentPosition = null;
        this.playlist = [];
        this.dispatchEvent(new Event('playlistEmptied'));
        this.dispatchEvent(new Event('playlistChanged'));
        return this;
    }

    shuffle() {
        if (this.isShuffled) {
            this.playlist = this.unshuffledPlaylist.slice(0);
        } else {
            this.unshuffledPlaylist = this.playlist.slice(0);
            let currentIndex = this.playlist.length;
            let randomIndex;

            // While there remain elements to shuffle...
            while (0 !== currentIndex) {

                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;

                // And swap it with the current element.
                [this.playlist[currentIndex], this.playlist[randomIndex]] = [
                    this.playlist[randomIndex], this.playlist[currentIndex]];
            }
        }
        this.isShuffled = !this.isShuffled;
        this.setPositionToCurrentlyPlaying();
        this.dispatchEvent(new Event('shuffleChanged'));
        return this.isShuffled;
    }

    setPositionToCurrentlyPlaying() {
        this.currentPosition = 0;
        if (this.playlist.indexOf(this.src) >= 0) {
            this.currentPosition = this.playlist.indexOf(this.src);
        }
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

    changeRepeat(repeat) {
        const validStatus = ['none', 'all', 'one'];
        if (!validStatus.includes(repeat)) {
            switch (this.repeat) {
                case 'none':
                    repeat = 'all';
                    break;
                case 'all':
                    repeat = 'one';
                    break;
                case 'one':
                    repeat = 'none';
                    break;
            }
        }
        this.repeat = repeat;
    }

    get repeat() {
        return this._repeat;
    }
    set repeat(value) {
        const validStatus = ['none', 'all', 'one'];
        if (!validStatus.includes(value)) {
            throw "Only none, all and one are valid values for repeat.";
        }
        this._repeat = value;
        this.dispatchEvent(new Event('repeatChanged'));
    }
}
customElements.define("playlist-player", PlaylistPlayer);

export default PlaylistPlayer;