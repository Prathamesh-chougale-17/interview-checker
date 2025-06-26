"use client";

import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, AlertTriangle, Video, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface VideoRecorderProps {
  onRecordingComplete: (videoDataUri: string) => void;
  isProcessing: boolean; // True if parent is processing video
}

export const VideoRecorder: FC<VideoRecorderProps> = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoDataUri, setVideoDataUri] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && (!navigator.mediaDevices || !window.MediaRecorder)) {
      setIsBrowserSupported(false);
      toast({
        title: "Browser Not Supported",
        description: "Video recording is not supported by your browser.",
        variant: "destructive",
        duration: Infinity,
      });
    }
  }, [toast]);
  
  const getCameraPermission = useCallback(async () => {
      if (!isBrowserSupported || hasCameraPermission) return;
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
  }, [isBrowserSupported, hasCameraPermission, toast]);

  // Request permission on component mount
  useEffect(() => {
    getCameraPermission();

    // Cleanup stream on component unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [getCameraPermission]);

  const startRecording = useCallback(async () => {
    if (!isBrowserSupported || !hasCameraPermission || !streamRef.current) {
        toast({ title: "Cannot Start Recording", description: "Camera is not available or permission was denied.", variant: "destructive" });
        return;
    }
    setVideoDataUri(null); // Clear previous recording

    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
      videoChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        videoChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setVideoDataUri(base64String);
          onRecordingComplete(base64String);
        };
        reader.readAsDataURL(videoBlob);
        // We don't stop the tracks here so the user can see their preview until they re-record
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      toast({
        title: "Recording Error",
        description: "Could not start the video recording.",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  }, [onRecordingComplete, toast, isBrowserSupported, hasCameraPermission]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return (
    <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg shadow-sm bg-muted/20">
      <div className="w-full aspect-video bg-black rounded-md overflow-hidden relative flex items-center justify-center">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
        {hasCameraPermission === false && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive-foreground bg-destructive/80 p-4 text-center">
                <VideoOff className="h-12 w-12 mb-4" />
                <h3 className="font-bold">Camera Access Required</h3>
                <p className="text-sm">Please allow camera and microphone access to record your answer.</p>
                <Button onClick={getCameraPermission} variant="secondary" size="sm" className="mt-4">Retry Permissions</Button>
            </div>
        )}
         {hasCameraPermission === null && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Video className="h-12 w-12 mb-4 animate-pulse" />
                <p>Waiting for camera...</p>
            </div>
        )}
      </div>

      <Button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing || !hasCameraPermission || hasCameraPermission === null}
        variant={isRecording ? "destructive" : "default"}
        size="lg"
        className="w-full"
      >
        {isRecording ? (
          <>
            <StopCircle className="mr-2 h-5 w-5 animate-pulse" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="mr-2 h-5 w-5" />
            {videoDataUri ? 'Record Again' : 'Start Recording Answer'}
          </>
        )}
      </Button>

      {isBrowserSupported === false && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Browser Not Supported</AlertTitle>
            <AlertDescription>
                Video recording is not available in your browser. Please try Chrome or Firefox.
            </AlertDescription>
         </Alert>
      )}

      {videoDataUri && !isRecording && !isProcessing && (
        <div className="w-full mt-2">
          <p className="text-sm text-muted-foreground mb-1">Your recorded answer:</p>
          <video controls src={videoDataUri} className="w-full rounded-md" />
        </div>
      )}
    </div>
  );
};
