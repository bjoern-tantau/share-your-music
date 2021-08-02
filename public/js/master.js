import PlaylistPlayer from './PlaylistPlayer.js';

const host = 'ws://' + window.ws_hostname + ':' + window.ws_port + '/master';
const socket = new WebSocket(host);

const query = new URLSearchParams(window.location.search);

socket.addEventListener('open', e => {
    const data = {
        method: 'setId',
        id: query.get('id')
    };
    socket.send(JSON.stringify(data));
});

const audio = new PlaylistPlayer();
audio.controls = true;
audio.loopPlaylist = true;
document.querySelector('.player').appendChild(audio);
if (localStorage.getItem('volume')) {
    audio.volume = localStorage.getItem('volume');
}
audio.addEventListener('volumechange', e => {
    localStorage.setItem('volume', audio.volume);
});

const queue = [];
let position = 0;

function nowPlaying(event, sendTo) {
    const data = {
        method: 'setNowPlaying',
        src: audio.src,
        paused: audio.paused,
        currentTime: audio.currentTime,
        sendTo: sendTo
    };
    socket.send(JSON.stringify(data));
}

socket.addEventListener('message', e => {
    const data = JSON.parse(e.data);
    switch (data.method) {
        case 'getNowPlaying':
            nowPlaying(e, data.from);
            break;
        default:
            console.log(data);
            break;
    }
});

const events = [
    'play',
    'pause',
    'seeked'
];
events.forEach(eventName => {
    audio.addEventListener(eventName, nowPlaying);
    audio.addEventListener(eventName, e => {
        document.querySelectorAll('li > a').forEach(a => {
            if (a.href.endsWith('.m3u')) {
                return;
            }
            const li = a.parentNode;
            li.classList.remove('play');
            li.classList.remove('pause');
            li.classList.remove('seeked');
            if (a.href == audio.src) {
                li.classList.add(eventName);
            }
        });
    });
});
audio.addEventListener('playlistChanged', e => {
    document.querySelectorAll('li > a').forEach(a => {
        if (!a.href.endsWith('.m3u')) {
            return;
        }
        const li = a.parentNode;
        li.classList.remove('play');
        li.classList.remove('pause');
        li.classList.remove('seeked');
        if (a.href == audio.playlistUrl) {
            li.classList.add('play');
        }
    });
});

document.querySelectorAll('.playlists > ul > li > a').forEach(a => {
    a.addEventListener('click', event => {
        event.preventDefault();
        audio.setPlaylist(a.href)
                .then(player => player.play());
    });

    a.parentNode.querySelectorAll('li ul li a').forEach(musicLink => {
        musicLink.addEventListener('click', event => {
            event.preventDefault();
            audio.setPlaylist(a.href)
                    .then(player => {
                        player.src = musicLink.href;
                        player.play();
                    });
        });
    });
});

document.querySelector('#files').addEventListener('change', e => {
    const files = Array.from(e.target.files);
    const promises = [];
    const percentages = [];
    function updateProgress() {
        const progress = document.querySelector('.upload progress');
        progress.value = percentages.reduce((acc, cur) => {
            return acc + cur;
        });
        progress.max = percentages.length * 100;
    }
    files.forEach((file, index) => {
        promises.push(new Promise((resolve, reject) => {
            percentages[index] = 0;

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/upload.php', true);
            xhr.addEventListener('readystatechange', e => {
                if (xhr.readyState === 4) {
                    resolve(xhr);
                    updateProgress();
                }
            });
            xhr.upload.addEventListener('progress', e => {
                if (e.lengthComputable) {
                    percentages[index] = Math.round((e.loaded * 100) / e.total);
                    updateProgress();
                }
            });
            xhr.upload.addEventListener('load', e => {
                percentages[index] = 100;
                updateProgress();
            });
            const formData = new FormData();
            formData.append('fullpath', file.webkitRelativePath);
            formData.append('file', file);
            formData.append('id', query.get('id'));
            xhr.send(formData);
        }));
    });
    Promise.all(promises)
            .then(values => {
                window.location.reload();
            });
});

document.querySelectorAll('li.dir').forEach(li => {
    li.addEventListener('click', e => {
        e.stopPropagation();
        li.classList.toggle('open');
    });
});

document.querySelectorAll('.files a').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        audio.src = a.href;
        audio.play();
        audio.addEventListener('playlistReady', e => {
            audio.play();
        });
    });
});