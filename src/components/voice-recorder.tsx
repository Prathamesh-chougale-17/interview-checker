"use client";

import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, AlertTriangle, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onRecordingComplete: (audioDataUri: string) => void;
  isProcessing: boolean; // True if parent is processing audio (transcribing/evaluating)
}

export const VoiceRecorder: FC<VoiceRecorderProps> = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && (!navigator.mediaDevices || !window.MediaRecorder)) {
      setIsBrowserSupported(false);
      toast({
        title: "Browser Not Supported",
        description: "Audio recording is not supported by your browser. Please try a different browser.",
        variant: "destructive",
        duration: Infinity,
      });
    }
  }, [toast]);

  const startRecording = useCallback(async () => {
    if (!isBrowserSupported) return;
    setPermissionError(false);
    setAudioDataUri(null); // Clear previous recording

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Standard webm, good for Google STT
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setAudioDataUri(base64String);
          onRecordingComplete(base64String);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // Stop microphone access
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setPermissionError(true);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access in your browser settings to record audio.",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  }, [onRecordingComplete, toast, isBrowserSupported]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  if (!isBrowserSupported) {
    return (
      <div className="flex items-center gap-2 p-4 border border-destructive bg-destructive/10 rounded-md text-destructive">
        <AlertTriangle className="h-6 w-6" />
        <p>Audio recording is not supported by your browser.</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg shadow-sm">
      {permissionError && (
        <div className="flex items-center gap-2 text-sm text-destructive p-2 bg-destructive/10 rounded-md">
          <AlertTriangle className="h-5 w-5" />
          <span>Microphone access denied. Please check browser permissions.</span>
        </div>
      )}
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing || (!isBrowserSupported)}
        variant={isRecording ? "destructive" : "default"}
        size="lg"
        className="w-full"
      >
        {isRecording ? (
          <>
            <StopCircle className="mr-2 h-5 w-5" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="mr-2 h-5 w-5" />
            {audioDataUri ? 'Record Again' : 'Start Recording Answer'}
          </>
        )}
      </Button>
      {isRecording && (
         <div className="flex items-center text-sm text-primary">
            <Settings2 className="h-4 w-4 mr-1 animate-spin-slow" />
            Recording...
         </div>
      )}
      {audioDataUri && !isRecording && !isProcessing && (
        <div className="w-full mt-2">
          <p className="text-sm text-muted-foreground mb-1">Your recorded answer:</p>
          <audio controls src={audioDataUri} className="w-full h-10" />
        </div>
      )}
    </div>
  );
};

// Add a slower spin animation to globals if needed, or use existing spin and adjust speed via style prop.
// For now, adding a custom utility for slower spin
// Add to tailwind.config.ts if this becomes a common pattern:
// theme: { extend: { animation: { 'spin-slow': 'spin 3s linear infinite' } } }
// For now, it's just illustrative. `animate-spin` is default.

// To make `animate-spin-slow` work, you'd add to globals.css:
// @layer utilities {
//   .animate-spin-slow {
//     animation: spin 3s linear infinite;
//   }
// }
// For simplicity, will use standard `animate-spin` if visual of settings icon spinning is crucial.
// The `Settings2` icon is just an example for "processing" like state. A simple "Recording..." text is often enough.
// Let's simplify to a visual cue that indicates recording.
// A red dot or similar pulsing element.
// Reverted to Settings2 for a generic "active" look, but can be adjusted.
