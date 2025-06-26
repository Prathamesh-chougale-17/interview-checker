
"use client";

import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Video, VideoOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

interface VideoRecorderProps {
  onRecordingComplete: (videoDataUri: string, facialData: any[]) => void;
  isProcessing: boolean; // True if parent is processing video
}

export const VideoRecorder: FC<VideoRecorderProps> = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoDataUri, setVideoDataUri] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const facialDataRef = useRef<any[]>([]);
  const isRecordingRef = useRef(isRecording);
  
  const { toast } = useToast();

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // 1. Initialize MediaPipe FaceLandmarker
  useEffect(() => {
    const createFaceLandmarker = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });
        setFaceLandmarker(landmarker);
      } catch (error) {
        console.error("Error creating FaceLandmarker:", error);
        toast({
          title: "AI Model Error",
          description: "Could not load facial recognition models.",
          variant: "destructive"
        });
      } finally {
        setIsInitializing(false);
      }
    };
    
    if (typeof window !== 'undefined' && (!navigator.mediaDevices || !window.MediaRecorder)) {
        setIsBrowserSupported(false);
        setIsInitializing(false);
        return;
    }

    createFaceLandmarker();
  }, [toast]);
  
  // 2. Main prediction loop
  const predictWebcam = useCallback(() => {
    const video = videoRef.current;
    if (!video || !faceLandmarker) {
      if (animationFrameIdRef.current) {
        window.requestAnimationFrame(predictWebcam);
      }
      return;
    }

    // If the video is playing, start detecting
    if (video.readyState >= 2) { // Check if video has enough data to play
      const startTimeMs = performance.now();
      const results: FaceLandmarkerResult = faceLandmarker.detectForVideo(video, startTimeMs);

      // Add a null check for robustness
      if(results) {
        // If recording, save the results
        if (isRecordingRef.current && results.faceBlendshapes && results.faceBlendshapes.length > 0) {
          facialDataRef.current.push({
            timestamp: Date.now(),
            blendshapes: results.faceBlendshapes[0].categories,
          });
        } else if (isRecordingRef.current) {
          facialDataRef.current.push(null);
        }
      }
    }

    // Call this function again to keep predicting when the browser is ready.
    animationFrameIdRef.current = window.requestAnimationFrame(predictWebcam);
  }, [faceLandmarker]);

  // 3. Get camera permissions and start the prediction loop
  const enableCam = useCallback(async () => {
    if (!faceLandmarker || hasCameraPermission) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener("loadeddata", () => {
            animationFrameIdRef.current = window.requestAnimationFrame(predictWebcam);
        });
      }
      setHasCameraPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  }, [faceLandmarker, hasCameraPermission, predictWebcam, toast]);

  // Effect to automatically enable camera once ready
  useEffect(() => {
    if (!isInitializing) {
        enableCam();
    }
  }, [isInitializing, enableCam]);

  // Effect to handle component cleanup ONCE on unmount
  useEffect(() => {
    return () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (animationFrameIdRef.current) {
            window.cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
    }
  }, []); // Empty dependency array ensures this runs only on unmount


  const startRecording = () => {
    if (!streamRef.current || !streamRef.current.active) {
        toast({ title: "Camera not ready", description: "The camera stream is not active. Please try again.", variant: "destructive" });
        enableCam();
        return;
    }

    setVideoDataUri(null);
    facialDataRef.current = [];
    videoChunksRef.current = [];
    
    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            videoChunksRef.current.push(event.data);
          }
      };

      mediaRecorderRef.current.onstop = () => {
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
      setIsRecording(true);
    } catch (error) {
       console.error("Error starting MediaRecorder:", error);
       toast({
         title: "Recording Error",
         description: "Could not start video recording. Please ensure your browser supports WebM format and camera is not in use.",
         variant: "destructive"
       });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg shadow-sm bg-muted/20">
      <div className="w-full aspect-video bg-black rounded-md overflow-hidden relative flex items-center justify-center">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
        {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50 p-4">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Loading AI models...</p>
            </div>
        )}
        {hasCameraPermission === false && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive-foreground bg-destructive/80 p-4 text-center">
                <VideoOff className="h-12 w-12 mb-4" />
                <h3 className="font-bold">Camera Access Required</h3>
                <p className="text-sm">Please allow camera and microphone access.</p>
                <Button onClick={enableCam} variant="secondary" size="sm" className="mt-4">Retry Permissions</Button>
            </div>
        )}
         {hasCameraPermission === null && !isInitializing && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Video className="h-12 w-12 mb-4 animate-pulse" />
                <p>Waiting for camera...</p>
            </div>
        )}
      </div>

      <Button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing || !hasCameraPermission || isInitializing}
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
          <p className='text-xs text-destructive'>Video recording is not supported in your browser.</p>
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
