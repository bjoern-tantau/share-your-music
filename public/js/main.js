const host = 'ws://' + window.ws_hostname + ':' + window.ws_port + '/slave';

const query = new URLSearchParams(window.location.search);

const socket = new WebSocket(host);
socket.addEventListener('open', e => {
    let data = {
        method: 'setId',
        id: query.get('id')
    };
    socket.send(JSON.stringify(data));

    data = {
        method: 'getNowPlaying'
    };
    socket.send(JSON.stringify(data));
});


const audio = document.createElement('audio');
audio.controls = true;
document.body.appendChild(audio);

socket.addEventListener('message', e => {
    const data = JSON.parse(e.data);
    switch (data.method) {
        case 'setNowPlaying':
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
