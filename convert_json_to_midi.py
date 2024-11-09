import json
from mido import Message, MidiFile, MidiTrack
import sys

# Helper function to convert note name to MIDI note number
def note_to_midi(note):
    notes = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    octave = int(note[-1])
    key = notes[note[:-1]]
    return (octave + 1) * 12 + key

# Load JSON data from a specified file
def load_json(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

def main(file_path):
    # Load JSON data
    data = load_json(file_path)

    # Create a new MIDI file and track
    midi_file = MidiFile()
    track = MidiTrack()
    midi_file.tracks.append(track)

    # Sort events by time and calculate delta times
    data.sort(key=lambda x: x["time"])
    start_time = data[0]["time"]

    for event in data:
        # Calculate delta time in milliseconds
        delta_time = event["time"] - start_time
        start_time = event["time"]

        # Convert milliseconds to MIDI ticks (adjust tempo as needed, here we use 10ms per tick)
        ticks = int(delta_time / 10)  # adjust divisor based on tempo

        # Add note on and note off events
        midi_note = note_to_midi(event["note"])
        track.append(Message("note_on", note=midi_note, velocity=64, time=ticks))
        track.append(Message("note_off", note=midi_note, velocity=64, time=120))  # Fixed duration for each note

    # Save MIDI file
    output_filename = "output.mid"
    midi_file.save(output_filename)
    print(f"MIDI file '{output_filename}' created successfully.")

if __name__ == "__main__":
    # Check if a file path is provided
    if len(sys.argv) < 2:
        print("Usage: python script.py <path_to_json_file>")
    else:
        json_file_path = sys.argv[1]
        main(json_file_path)

