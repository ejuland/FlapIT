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

    playSoundFile(file, volume){
        this.loadAudioAsset(file, (buffer)=>{
            let src = this.sourceFromBuffer(buffer, volume);
            src.start();
        });
    }

    sourceFromBuffer(buffer, volume = 1) {
        let source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        let gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(this.audioContext.destination);
        source.connect(gainNode);
        source.loop = false;
        return source;
    }
    unlockAudioContext(audioCtx) {
        if (audioCtx.state !== 'suspended') return;
        const b = document.body;
        const events = ['touchstart','touchend', 'mousedown','keydown'];
        events.forEach(e => b.addEventListener(e, unlock, false));
        function unlock() { audioCtx.resume().then(clean); }
        function clean() { events.forEach(e => b.removeEventListener(e, unlock)); }
      }

    AudioContext;
    audioContext;
    constructor(callback) {
        this.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        this.unlockAudioContext(this.audioContext);
        // window.alert("oops!");

    }


}