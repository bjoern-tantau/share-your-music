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
        const button = super.shadowRoot.querySelector('.repeat');
        switch (this.repeat) {
            case 'none':
                button.innerHTML = '&#x1F501;';
                button.classList.add('none');
                break;
            case 'all':
                button.innerHTML = '&#x1F501;';
                button.classList.remove('none');
                break;
            case 'one':
                button.innerHTML = '&#x1F502;';
                button.classList.remove('none');
                break;
        }
        this.dispatchEvent(new Event('repeatChanged'));
    }
}
customElements.define("playlist-player", PlaylistPlayer);

export default PlaylistPlayer;