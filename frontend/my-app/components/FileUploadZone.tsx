import { useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export const FileUploadZone = ({ label, file, onFileChange }: FileUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      onFileChange(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  const removeFile = () => {
    onFileChange(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 transition-all duration-300 cursor-pointer hover:border-primary hover:bg-muted/50",
            isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border"
          )}
        >
          <input
            type="file"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className={cn(
              "p-4 rounded-full transition-all duration-300",
              isDragging ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <Upload className="w-8 h-8" />
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Drop your file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Support for any file type
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-lg p-4 bg-card shadow-card transition-all duration-300 hover:shadow-elegant">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            
            <button
              onClick={removeFile}
              className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors group"
            >
              <X className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};