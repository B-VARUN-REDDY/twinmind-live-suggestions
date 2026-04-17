import { useState, useRef, useCallback } from 'react';

/**
 * Hook for managing microphone recording with MediaRecorder.
 * Produces audio blobs at configurable intervals (default 30s).
 *
 * @param {Object} options
 * @param {number} options.timeslice - Recording chunk interval in ms
 * @param {Function} options.onAudioChunk - Callback when a chunk is ready
 * @param {Function} options.onError - Error callback
 */
export function useAudioRecorder({ timeslice = 30000, onAudioChunk, onError }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const getMimeType = useCallback(() => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      streamRef.current = stream;

      const mimeType = getMimeType();
      if (!mimeType) {
        throw new Error('No supported audio format found in this browser');
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          // Skip very small blobs (likely silence or < 1 second)
          // ~16KB is roughly 1 second of webm/opus audio
          if (event.data.size < 5000) return;

          chunksRef.current.push(event.data);

          // Create a self-contained blob from ALL chunks so far for this interval
          // This ensures each transcription request gets playable audio
          const blob = new Blob([event.data], { type: mimeType });
          onAudioChunk?.(blob);
        }
      };

      recorder.onerror = (event) => {
        onError?.(new Error('Recording error: ' + event.error?.message || 'Unknown'));
      };

      recorder.start(timeslice);
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        onError?.(new Error('Microphone access denied. Please enable microphone permissions in your browser settings.'));
      } else if (err.name === 'NotFoundError') {
        onError?.(new Error('No microphone found. Please connect a microphone and try again.'));
      } else {
        onError?.(err);
      }
    }
  }, [timeslice, onAudioChunk, onError, getMimeType]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isPaused,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
