export class AudioAssetPlayer {
    assets = {
        foo: ["bar.mp3"],
    };


    playAudioAsset(assetName, volume = 1, callback) {
        this.loadAudioAsset(assetName, buffer => {
            callback(buffer);
        });
    }

    loadAudioAsset(path, callback) {

        if (this.audioContext == undefined) {
            return rej("Hold your horses");
            if (this.AudioContext == undefined)
                this.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            console.log(this.audioContext);
        }
        var request = new XMLHttpRequest();

        request.open('GET', path, true);

        request.responseType = 'arraybuffer';

        request.onload = () => {
            var audioData = request.response;
            console.log(this.audioContext);
            this.audioContext.decodeAudioData(audioData, function (buffer) {
                callback(buffer);
            },

                function (e) {
                    console.log("Error with decoding audio data", e);
                    console.error(e.err);
                });

        }

        request.send();
    }


    sourceFromBuffer(buffer, volume) {
        let source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        let gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(this.audioContext.destination);
        source.connect(gainNode);
        source.loop = false;
        return source;
    }

    AudioContext;
    audioContext;
    constructor(callback) {
        this.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
    }


}