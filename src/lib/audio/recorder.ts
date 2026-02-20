const FFT_SIZE = 4096;
const SMOOTHING = 0.5;

export interface AudioRecorderHandle {
  analyser: AnalyserNode;
  sampleRate: number;
  getTimeDomainData: () => Float32Array;
  getFrequencyData: () => Float32Array;
  stop: () => void;
}

/**
 * Request microphone access and create an audio analysis pipeline.
 * Returns a handle with methods to extract audio data and stop recording.
 */
export async function startRecording(): Promise<AudioRecorderHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      sampleRate: { ideal: 44100 },
    },
  });
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();

  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = SMOOTHING;

  source.connect(analyser);

  const timeDomainBuffer = new Float32Array(analyser.fftSize);
  const frequencyBuffer = new Float32Array(analyser.frequencyBinCount);

  return {
    analyser,
    sampleRate: ctx.sampleRate,

    getTimeDomainData() {
      analyser.getFloatTimeDomainData(timeDomainBuffer);
      return timeDomainBuffer;
    },

    getFrequencyData() {
      analyser.getFloatFrequencyData(frequencyBuffer);
      return frequencyBuffer;
    },

    stop() {
      stream.getTracks().forEach((track) => track.stop());
      source.disconnect();
      ctx.close();
    },
  };
}
