convert a file to another filetype
ffmpeg -i zoom_1.mp4 zoom_1.wav


Edit out specific frequencies
ffmpeg -i <input_file> -af "highpass=f=200, lowpass=f=3000" <output_file>
// ffmpeg -i taleen-3-min-audio-copy.wav -af "highpass=f=200, lowpass=f=3000" taleen-3-min-high-100-low-3000-audio-copy.wav

change the volume
ffmpeg -i <input_file> -filter:a "volume=2.0" <output_file>
// ffmpeg -i taleen-interview-2.wav -filter:a "volume=8.0" taleen-interview-2-4loud.wav

change volume specific time interval
ffmpeg -i <start> -filter:a "volume=2.0:enable='between(t,27,40)" <end>
// ffmpeg -i zoom_jack-taleen-test.wav -filter:a "volume=2.0:enable='between(t,27,40)" zoom_jack-taleen-test-2trim.wav

Check how many channels there are:
ffprobe <2-channel-test.wav> -show_streams -select_streams a:0
