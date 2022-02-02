import AudioPlayer from './AudioPlayer.js';

const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const host = protocol + window.location.host + '/ws/slave';

const query = new URLSearchParams(window.location.search);

const socket = new WebSocket(host);

function getNowPlaying() {
    const data = {
        method: 'getNowPlaying'
    };
    socket.send(JSON.stringify(data));
}

socket.addEventListener('open', e => {
    const data = {
        method: 'setId',
        id: query.get('id')
    };
    socket.send(JSON.stringify(data));
    getNowPlaying();
});


const audio = new AudioPlayer();
if (localStorage.getItem('volume')) {
    audio.volume = localStorage.getItem('volume');
}
audio.addEventListener('volumechange', e => {
    localStorage.setItem('volume', audio.volume);
});
audio.nowPlaying = false;
document.body.appendChild(audio);

audio.addEventListener('play', getNowPlaying);
audio.addEventListener('pause', e => {
    audio.removeEventListener('play', getNowPlaying);
    audio.addEventListener('play', getNowPlaying);
});

socket.addEventListener('message', e => {
    const data = JSON.parse(e.data);
    switch (data.method) {
        case 'setNowPlaying':
            audio.removeEventListener('play', getNowPlaying);
            audio.src = data.src;
            audio.currentTime = data.currentTime;
            if (data.paused) {
                audio.pause();
            } else {
                audio.play();
            }
            break;
        default:
            console.log(data);
            break;
    }
});
