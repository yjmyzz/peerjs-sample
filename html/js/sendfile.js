var txtSelfId = document.querySelector("input#txtSelfId");
var txtTargetId = document.querySelector("input#txtTargetId");
var btnRegister = document.querySelector("button#btnRegister");
var btnCall = document.querySelector("button#btnCall");
var inputFile = document.querySelector("input#inputFile");
var img = document.querySelector("img#demoImage")
var lblStatus = document.querySelector("label#lblStatus");

let peer = null;
let localConn = null;
let localStream = null;

hashCode = function (str) {
    var hash = 0;
    if (str.length == 0) return hash;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

//base64编码
const encode = input => {
    const keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    let output = ''
    let chr1, chr2, chr3, enc1, enc2, enc3, enc4
    let i = 0
    while (i < input.length) {
        chr1 = input[i++]
        chr2 = i < input.length ? input[i++] : Number.NaN
        chr3 = i < input.length ? input[i++] : Number.NaN
        enc1 = chr1 >> 2
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
        enc4 = chr3 & 63
        if (isNaN(chr2)) {
            enc3 = enc4 = 64
        } else if (isNaN(chr3)) {
            enc4 = 64
        }
        output +=
            keyStr.charAt(enc1) +
            keyStr.charAt(enc2) +
            keyStr.charAt(enc3) +
            keyStr.charAt(enc4)
    }
    return output
}

function sendFile(from, to, blob, fileName, fileType) {
    var message = { "from": from, "to": to, "file": blob, "filename": fileName, "filetype": fileType };
    if (!localConn) {
        localConn = peer.connect(hashCode(to));
        localConn.on('open', () => {
            localConn.send(message);
            console.log('onopen sendfile');
        });
    }
    localConn.send(message);
    console.log('send file');
}

window.onload = function () {
    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {
        console.log('webrtc is not supported!');
        alert("webrtc is not supported!");
        return;
    }

    let connOption = { host: 'localhost', port: 9000, path: '/', debug: 3 };

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
            lblStatus.innerHTML = "scoket open"
        });

        peer.on('connection', (conn) => {
            conn.on('data', (data) => {
                console.log("receive remote data");
                lblStatus.innerHTML = "receive data from " + data.from;
                txtTargetId.value = data.from
                if (data.filetype.includes('image')) {
                    lblStatus.innerHTML = data.filename + "(" + data.filetype + ") from:" + data.from
                    const bytes = new Uint8Array(data.file)
                    //用base64编码，还原图片
                    img.src = 'data:image/png;base64,' + encode(bytes)
                }
            });
        });
    }
}

//文件变化时，触发sendFile
inputFile.onchange = function (event) {
    if (txtTargetId.value.length == 0) {
        alert("please input target name");
        txtTargetId.focus();
        return;
    }
    const file = event.target.files[0]   
    //构造图片对应的blob对象     
    const blob = new Blob(event.target.files, { type: file.type });
    img.src = window.URL.createObjectURL(file);
    sendFile(txtSelfId.value, txtTargetId.value, blob, file.name, file.type);
}
}

