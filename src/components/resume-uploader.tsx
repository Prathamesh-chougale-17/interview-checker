"use client";

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ResumeUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export function ResumeUploader({ onFileUpload, isLoading }: ResumeUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or DOCX file.",
          variant: "destructive",
        });
        setSelectedFile(null);
        event.target.value = ""; // Reset file input
      }
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
    } else {
      toast({
        title: "No File Selected",
        description: "Please select your resume to upload.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 p-2">
      <div className="space-y-2 text-center">
        <UploadCloud className="mx-auto h-12 w-12 text-primary" />
        <h2 className="text-2xl font-semibold">Upload Your Resume</h2>
        <p className="text-muted-foreground">
          Upload your resume (PDF or DOCX) to get started.
        </p>
      </div>
      <div className="space-y-3">
        <Label htmlFor="resume-file" className="sr-only">Resume File</Label>
        <Input
          id="resume-file"
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          disabled={isLoading}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
        />
        {selectedFile && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground p-2 border rounded-md">
            <FileText className="h-5 w-5 text-primary" />
            <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={isLoading || !selectedFile}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
      >
        {isLoading ? 'Processing...' : 'Upload and Analyze Resume'}
      </Button>
    </div>
  );
}
