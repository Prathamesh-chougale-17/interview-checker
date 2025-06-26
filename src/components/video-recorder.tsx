"use client";

import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, AlertTriangle, Video, VideoOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import * as faceapi from 'face-api.js';

interface VideoRecorderProps {
  onRecordingComplete: (videoDataUri: string, facialData: any[]) => void;
  isProcessing: boolean; // True if parent is processing video
}

export const VideoRecorder: FC<VideoRecorderProps> = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoDataUri, setVideoDataUri] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const facialDataRef = useRef<any[]>([]);
  
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
      return;
    }

    const loadModels = async () => {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Failed to load face-api models:", error);
        toast({
          title: "AI Model Error",
          description: "Could not load facial recognition models from CDN. Performance analysis will be disabled.",
          variant: "destructive"
        });
      }
    };
    loadModels();

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
      if(detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [getCameraPermission]);

  const handleDetection = async () => {
    if (videoRef.current && modelsLoaded && !videoRef.current.paused) {
      const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
      if (detections) {
        facialDataRef.current.push({
          timestamp: Date.now(),
          expressions: detections.expressions
        });
      } else {
        // Push null if no face is detected, to indicate a gap
        facialDataRef.current.push(null);
      }
    }
  };

  const startRecording = useCallback(async () => {
    if (!isBrowserSupported || !hasCameraPermission || !streamRef.current || !modelsLoaded) {
        toast({ title: "Cannot Start Recording", description: "Camera is not ready, permissions denied, or AI models are not loaded.", variant: "destructive" });
        return;
    }
    setVideoDataUri(null); // Clear previous recording
    facialDataRef.current = [];

    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
      videoChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        videoChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        if(detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;

        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setVideoDataUri(base64String);
          onRecordingComplete(base64String, facialDataRef.current);
        };
        reader.readAsDataURL(videoBlob);
      };

      mediaRecorderRef.current.start();
      detectionIntervalRef.current = setInterval(handleDetection, 1000); // Run detection every second
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      if(detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      toast({
        title: "Recording Error",
        description: "Could not start the video recording.",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  }, [onRecordingComplete, toast, isBrowserSupported, hasCameraPermission, modelsLoaded]);

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
        {!modelsLoaded && hasCameraPermission && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50 p-4">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Loading AI models...</p>
            </div>
        )}
        {hasCameraPermission === false && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive-foreground bg-destructive/80 p-4 text-center">
                <VideoOff className="h-12 w-12 mb-4" />
                <h3 className="font-bold">Camera Access Required</h3>
                <p className="text-sm">Please allow camera and microphone access to record your answer.</p>
                <Button onClick={getCameraPermission} variant="secondary" size="sm" className="mt-4">Retry Permissions</Button>
            </div>
        )}
         {hasCameraPermission === null && !modelsLoaded && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Video className="h-12 w-12 mb-4 animate-pulse" />
                <p>Waiting for camera...</p>
            </div>
        )}
      </div>

      <Button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing || !hasCameraPermission || hasCameraPermission === null || !modelsLoaded}
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
