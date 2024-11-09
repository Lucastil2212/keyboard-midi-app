document.addEventListener("DOMContentLoaded", () => {
  const keyToNote = {
    // Lower octave (C1 to B1)
    "z": "C1", "s": "C#1", "x": "D1", "d": "D#1", "c": "E1",
    "v": "F1", "g": "F#1", "b": "G1", "h": "G#1", "n": "A1",
    "j": "A#1", "m": "B1",
    
    // Middle octave (C4 to B4)
    "a": "C4", "w": "C#4", "s": "D4", "e": "D#4", "d": "E4",
    "f": "F4", "t": "F#4", "g": "G4", "y": "G#4", "h": "A4",
    "u": "A#4", "j": "B4",
    
    // Higher octave (C6 to B6)
    "k": "C6", "o": "C#6", "l": "D6", "p": "D#6", ";": "E6",
    "'": "F6", "[": "F#6", "]": "G6", "\\": "G#6", "1": "A6",
    "2": "A#6", "3": "B6"
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
  let isRecordingMIDI = false;
  let isRecordingMic = false;
  let midiRecording = [];
  let micRecording = [];
  let mediaRecorder;
  let micChunks = [];

  const instrumentSelect = document.getElementById("instrument");
  const volumeControl = document.getElementById("volume");
  const filterTypeControl = document.getElementById("filterType");
  const filterFrequencyControl = document.getElementById("filterFrequency");
  const filterQControl = document.getElementById("filterQ");
  const filterGainControl = document.getElementById("filterGain");

  const recordButton = document.getElementById("recordButton");
  const micRecordButton = document.getElementById("micRecordButton");
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
    isRecordingMIDI = !isRecordingMIDI;
    recordButton.textContent = isRecordingMIDI ? "Stop MIDI Recording" : "Start MIDI Recording";
    if (!isRecordingMIDI && midiRecording.length > 0) {
      playbackButton.disabled = false;
      saveButton.disabled = false;
    }
  });

  micRecordButton.addEventListener("click", async () => {
    if (isRecordingMic) {
      mediaRecorder.stop();
      isRecordingMic = false;
      micRecordButton.textContent = "Start Mic Recording";
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      micChunks = [];
      mediaRecorder.ondataavailable = event => micChunks.push(event.data);
      mediaRecorder.onstop = () => {
        const micBlob = new Blob(micChunks, { type: "audio/webm" });
        micRecording.push(micBlob);
        if (micRecording.length > 0) {
          playbackButton.disabled = false;
          saveButton.disabled = false;
        }
      };
      mediaRecorder.start();
      isRecordingMic = true;
      micRecordButton.textContent = "Stop Mic Recording";
    }
  });

  playbackButton.addEventListener("click", () => {
    playbackAllRecordings();
  });

  saveButton.addEventListener("click", () => {
    saveAllRecordings();
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

    if (isRecordingMIDI) {
      midiRecording.push({ note, time: Date.now() });
    }

    if (keyElement) {
      keyElement.classList.add("playing");
      setTimeout(() => keyElement.classList.remove("playing"), 150);
    }
  }

  function getFrequency(note) {
    const notes = {
      "C1": 32.70, "C#1": 34.65, "D1": 36.71, "D#1": 38.89, "E1": 41.20,
      "F1": 43.65, "F#1": 46.25, "G1": 49.00, "G#1": 51.91, "A1": 55.00,
      "A#1": 58.27, "B1": 61.74,
      "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63,
      "F4": 349.23, "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00,
      "A#4": 466.16, "B4": 493.88,
      "C6": 1046.50, "C#6": 1108.73, "D6": 1174.66, "D#6": 1244.51, "E6": 1318.51,
      "F6": 1396.91, "F#6": 1479.98, "G6": 1567.98, "G#6": 1661.22, "A6": 1760.00,
      "A#6": 1864.66, "B6": 1975.53
    };
    return notes[note] || 440;
  }

  function playbackAllRecordings() {
    const startTime = midiRecording[0] ? midiRecording[0].time : Date.now();
    midiRecording.forEach(entry => {
      setTimeout(() => playNoteWithVisualizer(entry.note), entry.time - startTime);
    });

    micRecording.forEach(micBlob => {
      const micAudio = new Audio(URL.createObjectURL(micBlob));
      micAudio.play();
    });
  }

  function saveAllRecordings() {
    const midiBlob = new Blob([JSON.stringify(midiRecording)], { type: "application/json" });
    const micBlob = new Blob(micChunks, { type: "audio/webm" });

    const midiUrl = URL.createObjectURL(midiBlob);
    const micUrl = URL.createObjectURL(micBlob);

    const midiLink = document.createElement("a");
    midiLink.href = midiUrl;
    midiLink.download = "midi_recording.json";
    midiLink.click();

    const micLink = document.createElement("a");
    micLink.href = micUrl;
    micLink.download = "mic_recording.webm";
    micLink.click();

    URL.revokeObjectURL(midiUrl);
    URL.revokeObjectURL(micUrl);
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

  
  
  
  