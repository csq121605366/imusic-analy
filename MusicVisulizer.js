
function MusicV(obj) {
  this.visualizer = obj.visualizer || function () { };
  this.size = obj.size || 125;


  this.source = null;
  this.count = 0;
  this.analyser = MusicV.ac.createAnalyser();
  this.gainNode = MusicV.ac.createGain();
  this.analyser.fftSize = this.size * 2;
  this.analyser.connect(this.gainNode);
  this.gainNode.connect(MusicV.ac.destination);

  this.xhr = new XMLHttpRequest();
  this.visualize();
}

MusicV.ac = new (window.AudioContext || window.webkitAudioContext);

MusicV.prototype.load = function (url, func) {
  this.xhr.abort();
  this.xhr.open('GET', url);
  this.xhr.responseType = 'arraybuffer';
  var self = this;
  this.xhr.onload = function () {
    func(self.xhr.response);
  }
  this.xhr.send();
}

MusicV.prototype.decode = function (arraybuffer, func) {
  MusicV.ac.decodeAudioData(arraybuffer, function (buffer) {
    func(buffer);
  }, function (err) {
    console.error(err);
  })
}

MusicV.prototype.play = function (url) {
  var n = ++this.count;
  var self = this;
  this.source && this.stop();
  this.load(url, function (arraybuffer) {
    if (n !== self.count) return;
    self.decode(arraybuffer, function (buffer) {
      if (n !== self.count) return;
      var bs = MusicV.ac.createBufferSource();
      bs.buffer = buffer;
      bs.connect(self.analyser);
      bs.start(0);
      self.source = bs;
    })
  })
}
MusicV.prototype.stop = function () {
  this.source.stop(0);
}
MusicV.prototype.changeVolume = function (percent) {
  this.gainNode.gain.setTargetAtTime(percent, MusicV.ac.currentTime + 1, 0.5);
}

MusicV.prototype.visualize = function (arr) {
  var arr = new Uint8Array(this.analyser.frequencyBinCount);
  var self = this;
  function v() {
    self.analyser.getByteFrequencyData(arr);
    self.visualizer(arr);
    requestAnimationFrame(v);
  }
  requestAnimationFrame(v);
}