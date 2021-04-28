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

const player = new PlaylistPlayer();
player.controls = true;
player.loopPlaylist = true;
document.querySelector('.player').appendChild(player);
document.querySelector('.player .previous').addEventListener('click', event => {
    player.previous();
});
document.querySelector('.player .next').addEventListener('click', event => {
    player.next();
});

const queue = [];
let position = 0;

function nowPlaying(event, sendTo) {
    const data = {
        method: 'setNowPlaying',
        src: player.src,
        paused: player.paused,
        currentTime: player.currentTime,
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
    player.addEventListener(eventName, nowPlaying);
    player.addEventListener(eventName, e => {
        document.querySelectorAll('li > a').forEach(a => {
            if (a.href.endsWith('.m3u')) {
                return;
            }
            const li = a.parentNode;
            li.classList.remove('play');
            li.classList.remove('pause');
            li.classList.remove('seeked');
            if (a.href == player.src) {
                li.classList.add(eventName);
            }
        });
    });
});
player.addEventListener('playlistChanged', e => {
    document.querySelectorAll('li > a').forEach(a => {
        if (!a.href.endsWith('.m3u')) {
            return;
        }
        const li = a.parentNode;
        li.classList.remove('play');
        li.classList.remove('pause');
        li.classList.remove('seeked');
        if (a.href == player.playlistUrl) {
            li.classList.add('play');
        }
    });
});

document.querySelectorAll('.playlists > ul > li > a').forEach(a => {
    a.addEventListener('click', event => {
        event.preventDefault();
        player.setPlaylist(a.href)
                .then(player => player.play());
    });

    a.parentNode.querySelectorAll('li ul li a').forEach(musicLink => {
        musicLink.addEventListener('click', event => {
            event.preventDefault();
            player.setPlaylist(a.href)
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
    files.forEach(file => {
        promises.push(new Promise((resolve, reject) => {
            let percentage = 100;

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/upload.php', true);
            xhr.addEventListener('readystatechange', e => {
                if (xhr.readyState === 4) {
                    resolve(xhr);
                }
            });
            xhr.upload.addEventListener('progress', e => {
                if (e.lengthComputable) {
                    percentage = Math.round((e.loaded * 100) / e.total);
                }
            });
            xhr.upload.addEventListener('load', e => {
                percentage = 100;
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
        player.src = a.href;
        player.play();
        player.addEventListener('playlistReady', e => {
            player.play();
        });
    });
});