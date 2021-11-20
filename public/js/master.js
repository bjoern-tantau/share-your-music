import PlaylistPlayer from './PlaylistPlayer.js';
import SortableList from './SortableList.js';

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
audio.repeat = 'all';
audio.shuffle();
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

document.querySelectorAll('li.playlist').forEach(li => {
    li.addEventListener('click', e => {
        e.stopPropagation();
        li.classList.toggle('open');
    });
});

document.querySelectorAll('.playlists > ul > li > a').forEach(a => {
    a.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        audio.setPlaylist(a.href)
                .then(player => player.play());
    });

    a.parentNode.querySelectorAll('li ul li a').forEach(musicLink => {
        musicLink.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
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

document.querySelectorAll('.files a.file').forEach(a => {
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

document.querySelectorAll('.files button.delete').forEach(button => {
    button.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const a = button.parentNode.querySelector('a');
        const url = new URL(a.href);
        if (confirm('Do you really want to delete "' + a.textContent.trim() + '"?')) {
            fetch(url.href, {
                headers: {
                    'Authorization': 'MasterId ' + query.get('id')
                },
                method: 'DELETE'
            })
                    .then(response => {
                        if (response.status >= 200 && response.status < 400) {
                            button.parentNode.remove();
                        }
                    });
        }
    });
});

document.querySelectorAll('input.filter').forEach(input => {
    input.addEventListener('input', e => {
        input.parentNode.querySelectorAll('li').forEach(li => {
            if (!input.value) {
                li.classList.remove('hidden');
                li.classList.remove('open');
                return;
            }
            li.classList.add('hidden');
            li.classList.remove('open');
            if (li.textContent.toLowerCase().includes(input.value.toLowerCase())) {
                li.classList.remove('hidden');
                li.classList.add('open');
            }
        });
    });
});

document.querySelectorAll('li.playlist').forEach(li => {
    const playlistLink = li.querySelector('a');
    const list = new SortableList(li.querySelector('ul'));
    list.addEventListener('sorted', e => {
        const newList = [];
        list.ul.querySelectorAll('a').forEach(a => {
            const url = new URL(a.href);
            newList.push(decodeURI(url.pathname));
        });
        fetch(playlistLink.href, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'MasterId ' + query.get('id')
            },
            method: 'PUT',
            body: JSON.stringify(newList)
        })
                .then(response => response.json())
                .then(list => {
                    if (playlistLink.href == audio.playlistUrl) {
                        audio.setPlaylistItems(list);
                        audio.setPositionToCurrentlyPlaying();
                    }
                })
                ;
    });
});