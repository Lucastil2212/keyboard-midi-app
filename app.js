document.addEventListener("DOMContentLoaded", () => {
    // Map keyboard keys to MIDI notes
    const keyToNote = {
      "a": "C4",
      "s": "D4",
      "d": "E4",
      "f": "F4",
      "g": "G4",
      "h": "A4",
      "j": "B4",
      "k": "C5",
    };
  
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let currentVolume = 0.5;
    let instrumentType = 'sine';
  
    // Get the controls for instrument type and volume
    const instrumentSelect = document.getElementById("instrument");
    const volumeControl = document.getElementById("volume");
  
    // Update instrument type when changed
    instrumentSelect.addEventListener("change", (event) => {
      instrumentType = event.target.value;
    });
  
    // Update volume when changed
    volumeControl.addEventListener("input", (event) => {
      currentVolume = parseFloat(event.target.value);
    });
  
    // Function to play a note
    function playNote(note) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
  
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
  
      // Set oscillator properties
      oscillator.type = instrumentType;
      oscillator.frequency.value = getFrequency(note);
      gainNode.gain.setValueAtTime(currentVolume, audioContext.currentTime);
  
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5); // Play for 0.5 seconds
    }
  
    // Calculate frequency based on MIDI note
    function getFrequency(note) {
      const notes = {
        "C4": 261.63,
        "D4": 293.66,
        "E4": 329.63,
        "F4": 349.23,
        "G4": 392.0,
        "A4": 440.0,
        "B4": 493.88,
        "C5": 523.25,
      };
      return notes[note] || 440; // Default to A4 if note not found
    }
  
    // Event listeners for keyboard
    document.addEventListener("keydown", (event) => {
      const note = keyToNote[event.key.toLowerCase()];
      if (note) {
        playNote(note);
      }
    });
  
    // Event listeners for on-screen keys
    document.querySelectorAll(".key").forEach((key) => {
      key.addEventListener("mousedown", () => {
        const note = key.getAttribute("data-note");
        playNote(note);
      });
    });
  });
  