document.addEventListener("DOMContentLoaded", () => {
    const keyToNote = {
      "z": "C2", "s": "C#2", "x": "D2", "d": "D#2", "c": "E2",
      "v": "F2", "g": "F#2", "b": "G2", "h": "G#2", "n": "A2",
      "j": "A#2", "m": "B2", "a": "C4", "w": "C#4", "s": "D4",
      "e": "D#4", "d": "E4", "f": "F4", "t": "F#4", "g": "G4",
      "y": "G#4", "h": "A4", "u": "A#4", "j": "B4", "k": "C5",
    };
  
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
  
    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1000;
    filter.Q.value = 1;
    filter.gain.value = 0;
  
    let currentVolume = 0.5;
    let instrumentType = 'sine';
    let isRecording = false;
    let recording = [];
  
    const instrumentSelect = document.getElementById("instrument");
    const volumeControl = document.getElementById("volume");
    const filterTypeControl = document.getElementById("filterType");
    const filterFrequencyControl = document.getElementById("filterFrequency");
    const filterQControl = document.getElementById("filterQ");
    const filterGainControl = document.getElementById("filterGain");
  
    const recordButton = document.getElementById("recordButton");
    const playbackButton = document.getElementById("playbackButton");
    const saveButton = document.getElementById("saveButton");
    const canvas = document.getElementById("visualizer");
    const ctx = canvas.getContext("2d");
  
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  
    instrumentSelect.addEventListener("change", (event) => {
      instrumentType = event.target.value;
    });
  
    volumeControl.addEventListener("input", (event) => {
      currentVolume = parseFloat(event.target.value);
    });
  
    filterTypeControl.addEventListener("change", (event) => {
      filter.type = event.target.value;
    });
  
    filterFrequencyControl.addEventListener("input", (event) => {
      filter.frequency.value = parseFloat(event.target.value);
    });
  
    filterQControl.addEventListener("input", (event) => {
      filter.Q.value = parseFloat(event.target.value);
    });
  
    filterGainControl.addEventListener("input", (event) => {
      filter.gain.value = parseFloat(event.target.value);
    });
  
    recordButton.addEventListener("click", () => {
      isRecording = !isRecording;
      recordButton.textContent = isRecording ? "Stop Recording" : "Start Recording";
      if (!isRecording && recording.length > 0) {
        playbackButton.disabled = false;
        saveButton.disabled = false;
      }
    });
  
    playbackButton.addEventListener("click", () => {
      playbackRecording();
    });
  
    saveButton.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(recording)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recording.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  
    function playNoteWithVisualizer(note, keyElement) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
  
      oscillator.connect(gainNode);
      gainNode.connect(filter);
      filter.connect(analyser);
      analyser.connect(audioContext.destination);
  
      oscillator.type = instrumentType;
      oscillator.frequency.value = getFrequency(note);
      gainNode.gain.setValueAtTime(currentVolume, audioContext.currentTime);
  
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
  
      animateWaveform();
  
      if (isRecording) {
        recording.push({ note, time: Date.now() });
      }
  
      if (keyElement) {
        keyElement.classList.add("playing");
        setTimeout(() => keyElement.classList.remove("playing"), 150);
      }
    }
  
    function getFrequency(note) {
      const notes = {
        "C2": 65.41, "C#2": 69.30, "D2": 73.42, "D#2": 77.78, "E2": 82.41,
        "F2": 87.31, "F#2": 92.50, "G2": 98.00, "G#2": 103.83, "A2": 110.00,
        "A#2": 116.54, "B2": 123.47, "C4": 261.63, "C#4": 277.18, "D4": 293.66,
        "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.0,
        "G#4": 415.3, "A4": 440.0, "A#4": 466.16, "B4": 493.88, "C5": 523.25,
      };
      return notes[note] || 440;
    }
  
    function playbackRecording() {
      let startTime = recording[0].time;
      recording.forEach(entry => {
        setTimeout(() => playNoteWithVisualizer(entry.note), entry.time - startTime);
      });
    }
  
    function animateWaveform() {
      requestAnimationFrame(animateWaveform);
  
      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);
  
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1db954";
      ctx.beginPath();
  
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
  
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
  
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
  
        x += sliceWidth;
      }
  
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }
  
    document.addEventListener("keydown", (event) => {
      const note = keyToNote[event.key.toLowerCase()];
      const keyElement = document.querySelector(`.key[data-note="${note}"]`);
      if (note) playNoteWithVisualizer(note, keyElement);
    });
  
    document.querySelectorAll(".key").forEach(key => {
      key.addEventListener("mousedown", () => {
        const note = key.getAttribute("data-note");
        playNoteWithVisualizer(note, key);
      });
    });
  });
  
  
  
  
  