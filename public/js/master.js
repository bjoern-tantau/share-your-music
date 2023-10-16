import PlaylistPlayer from './PlaylistPlayer.js';
import SortableList from './SortableList.js';

const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const host = protocol + window.location.host + '/ws/master';
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

let lastDragged;

function setupPlaylist(playlist) {
    playlist.addEventListener('click', e => {
        e.stopPropagation();
        playlist.classList.toggle('open');
    });

    playlist.querySelectorAll('ul > li > a').forEach(a => {
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
    playlist.addEventListener('click', e => {
        if (e.target.nodeName === 'BUTTON' && e.target.classList.contains('delete')) {
            e.preventDefault();
            e.stopPropagation();
            e.target.parentNode.remove();
        }
    }, true);

    playlist.querySelectorAll('a').forEach(a => a.draggable = false);
    playlist.querySelectorAll('li').forEach(li => li.draggable = true);
    playlist.querySelectorAll('ul.music').forEach(ul => {
        ul.addEventListener('drag', e => {
            if (e.target.parentNode === ul) {
                lastDragged = e.target;
            }
        });
        ul.addEventListener('dragend', e => {
            lastDragged = null;
        });

        const list = new SortableList(ul);
        ul.addEventListener('drop', e => {
            e.preventDefault();
            if (lastDragged.parentNode != ul) {
                const newLi = lastDragged.cloneNode(true);
                let over = e.target;
                while (over && over.parentNode !== ul) {
                    over = over.parentNode;
                }
                if (over) {
                    over.before(newLi);
                } else {
                    ul.appendChild(newLi);
                }
            }
        });
    });
}

document.querySelectorAll('li.playlist').forEach(li => {
    setupPlaylist(li);
});

document.querySelector('#files').addEventListener('change', e => {
    const files = Array.from(e.target.files);
    const promises = [];
    const percentages = [];
    const xhrs = [];
    const formDatas = [];
    
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

            xhrs[index] = new XMLHttpRequest();
            
            xhrs[index].open('POST', '/upload.php', true);
            xhrs[index].addEventListener('readystatechange', e => {
                if (xhrs[index].readyState === 4) {
                    resolve(xhrs[index]);
                    updateProgress();
                    if (xhrs[index + 1]) {
                        xhrs[index + 1].send(formDatas[index + 1]);
                    }
                }
            });
            xhrs[index].upload.addEventListener('progress', e => {
                if (e.lengthComputable) {
                    percentages[index] = Math.round((e.loaded * 100) / e.total);
                    updateProgress();
                }
            });
            xhrs[index].upload.addEventListener('load', e => {
                percentages[index] = 100;
                updateProgress();
            });
            formDatas[index] = new FormData();
            formDatas[index].append('fullpath', file.webkitRelativePath);
            formDatas[index].append('file', file);
            formDatas[index].append('id', query.get('id'));
            
            if (index === 0) {
                xhrs[index].send(formDatas[index]);
            }
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
                            document.querySelectorAll('a').forEach(a => {
                                if (a.href === url) {
                                    a.parentNode.remove();
                                }
                            });
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

document.querySelectorAll('li.file a').forEach(a => a.draggable = false);

document.querySelectorAll('li.file').forEach(li => li.draggable = true);

document.querySelectorAll('.files ul').forEach(ul => {
    ul.addEventListener('drag', e => {
        if (e.target.parentNode === ul && e.target.classList.contains('file')) {
            lastDragged = e.target;
        }
    });
    ul.addEventListener('dragend', e => {
        lastDragged = null;
    });
});

const playlistObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        let ul = mutation.target;
        let li = mutation.target;
        switch (mutation.type) {
            case 'childList':
                if (mutation.addedNodes.length > 1) {
                    return;
                }
                if (mutation.removedNodes.length > 1) {
                    return;
                }
                if (mutation.addedNodes.length === 1) {
                    li = mutation.addedNodes[0];
                }
                if (mutation.removedNodes.length === 1) {
                    li = mutation.removedNodes[0];
                }
                break;
            case 'attributes':
                if (!mutation.oldValue || !mutation.oldValue.includes('sorting')) {
                    return;
                }
                ul = li.parentNode;
                break;
            default:
                return;
        }
        if (li.classList.contains('sorting')) {
            return;
        }
        const playlistLink = ul.parentNode.querySelector('a');
        const newList = [];
        ul.querySelectorAll('a').forEach(a => {
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
playlistObserver.observe(document.querySelector('.playlists ul'), {
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ['class'],
    childList: true
});


document.querySelector('.add-playlist .drop').addEventListener('dragover', e => {
    e.preventDefault();
});
document.querySelector('.add-playlist .drop').addEventListener('drop', e => {
    const ul = document.querySelector('.add-playlist ul');
    e.preventDefault();
    if (lastDragged.parentNode != ul) {
        const newLi = lastDragged.cloneNode(true);
        let over = e.target;
        while (over && over.parentNode !== ul) {
            over = over.parentNode;
        }
        if (over) {
            over.before(newLi);
        } else {
            ul.appendChild(newLi);
        }
    }
});

document.querySelector('.add-playlist').addEventListener('click', e => {
    if (e.target.classList.contains('delete')) {
        e.preventDefault();
        e.stopPropagation();
        e.target.parentNode.remove();
    }
});

document.querySelector('.add-playlist').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const filename = form.filename.value + '.m3u';
    const path = '/' + form.clientId.value + '/' + filename;

    const newList = [];
    form.querySelectorAll('ul a').forEach(a => {
        const url = new URL(a.href);
        newList.push(decodeURI(url.pathname));
    });

    fetch(path, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'MasterId ' + query.get('id')
        },
        method: 'POST',
        body: JSON.stringify(newList)
    })
            .then(response => {
                if (response.status === 409) {
                    throw new Error('File already exists');
                }
                if (!response.ok) {
                    throw new Error('Could not process the request');
                }
                return response.json();
            })
            .then(list => {
                form.querySelector('ul').innerHTML = '';
                form.filename.value = '';

                const playlists = document.querySelector('ul.playlists');
                const playlist = document.createElement('li');
                playlist.classList.add('playlist');
                const a = document.createElement('a');
                a.href = path;
                a.textContent = filename;
                playlist.appendChild(a);
                const music = document.createElement('ul');
                music.classList.add('music');
                list.forEach(item => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = item;
                    a.textContent = item.split(/[\\/]/).pop();
                    li.appendChild(a);
                    music.appendChild(li);
                });
                playlist.appendChild(music);
                playlists.appendChild(playlist);
                setupPlaylist(playlist);
            })
            .catch(alert)
            ;
});