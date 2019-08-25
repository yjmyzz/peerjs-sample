let txtSelfId = document.querySelector("input#txtSelfId");
let txtTargetId = document.querySelector("input#txtTargetId");
let btnRegister = document.querySelector("button#btnRegister");
let btnShare = document.querySelector("button#btnShare");
let demoCanvas = document.querySelector("canvas#demoCanvas");
let remoteVideo = document.querySelector("video#remoteVideo");


let peer = null;
let localConn = null;
let localStream = null;
let context = null;
let started = false;
let buffer = [];

hashCode = function (str) {
    let hash = 0;
    if (str.length == 0) return hash;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

function sendData(from, to, data) {
    if (from.length == 0 || to.length == 0 || data.length == 0) {
        return;
    }
    let message = { "from": from, "to": to, "data": data };
    if (!localConn) {
        localConn = peer.connect(hashCode(to));
        localConn.on('open', () => {
            localConn.send(JSON.stringify(message));
            console.log(message);
        });
    }
    if (localConn.open) {
        localConn.send(JSON.stringify(message));
        console.log(message);
    }
}

window.onload = function () {
    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {
        console.log('webrtc is not supported!');
        alert("webrtc is not supported!");
        return;
    }

    let connOption = { host: 'localhost', port: 9000, path: '/', debug: 3 };

    context = demoCanvas.getContext('2d');

    //canvas鼠标按下的处理
    demoCanvas.onmousedown = function (e) {
        e.preventDefault();
        context.strokeStyle = '#00f';
        context.beginPath();
        started = true;
        buffer.push({ "x": e.offsetX, "y": e.offsetY });
    }

    //canvas鼠标移动的处理
    demoCanvas.onmousemove = function (e) {
        if (started) {
            context.lineTo(e.offsetX, e.offsetY);
            context.stroke();
            buffer.push({ "x": e.offsetX, "y": e.offsetY });
        }
    }

    //canvas鼠标抬起的处理
    demoCanvas.onmouseup = function (e) {
        if (started) {
            started = false;
            //鼠标抬起时，发送坐标数据
            sendData(txtSelfId.value, txtTargetId.value, buffer);
            buffer = [];
        }
    }

    //register按钮处理
    btnRegister.onclick = function () {
        if (!peer) {
            if (txtSelfId.value.length == 0) {
                alert("please input your name");
                txtSelfId.focus();
                return;
            }
            peer = new Peer(hashCode(txtSelfId.value), connOption);
            peer.on('open', function (id) {
                console.log("register success. " + id);
            });
            peer.on('connection', (conn) => {
                conn.on('data', (data) => {
                    let msg = JSON.parse(data);
                    console.log(msg);
                    txtTargetId.value = msg.from;
                    //还原canvas
                    context.strokeStyle = '#f00';
                    context.beginPath();
                    context.moveTo(msg.data[0].x, msg.data[0].y);
                    for (const pos in msg.data) {
                        context.lineTo(msg.data[pos].x, msg.data[pos].y);
                    }
                    context.stroke();
                });
            });
        }
    }

    //share按钮处理
    btnShare.onclick = function () {
        if (txtTargetId.value.length == 0) {
            alert("please input target name");
            txtTargetId.focus();
            return;
        }
    }
    
    start();
}

