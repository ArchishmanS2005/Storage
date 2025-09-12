import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export function UploadSection() {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const uploadFileMutation = useMutation(api.files.uploadFile);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: "pending"
    }));
    
    setUploadFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 100 * 1024 * 1024, // 100MB max file size
  });

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    try {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: "uploading", progress: 0 } : f
      ));

      // Simulate file processing and chunking
      const chunks = [];
      const chunkSize = 1024 * 1024; // 1MB chunks
      const totalChunks = Math.ceil(uploadFile.file.size / chunkSize);
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, uploadFile.file.size);
        const chunkData = uploadFile.file.slice(start, end);
        
        // Simulate chunk hash generation
        const chunkHash = `chunk_${uploadFile.id}_${i}_${Date.now()}`;
        
        // Simulate peer selection (would be real peer IDs in production)
        const peerIds = [`peer_${Math.random().toString(36).substr(2, 8)}`, 
                        `peer_${Math.random().toString(36).substr(2, 8)}`,
                        `peer_${Math.random().toString(36).substr(2, 8)}`];
        
        chunks.push({
          hash: chunkHash,
          size: chunkData.size,
          peerIds
        });

        // Update progress
        const progress = ((i + 1) / totalChunks) * 80; // 80% for chunking
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, progress } : f
        ));

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Simulate manifest creation and blockchain submission
      const manifestHash = `manifest_${uploadFile.id}_${Date.now()}`;
      const encryptionKey = `key_${Math.random().toString(36).substr(2, 16)}`;

      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 90 } : f
      ));

      // Submit to Convex
      await uploadFileMutation({
        name: uploadFile.file.name,
        size: uploadFile.file.size,
        mimeType: uploadFile.file.type,
        manifestHash,
        encryptionKey,
        chunks,
        redundancyFactor: 3,
      });

      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 100, status: "success" } : f
      ));

      toast.success(`${uploadFile.file.name} uploaded successfully`);

    } catch (error) {
      console.error("Upload error:", error);
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: "error", 
          error: error instanceof Error ? error.message : "Upload failed"
        } : f
      ));
      toast.error(`Failed to upload ${uploadFile.file.name}`);
    }
  };

  const uploadAll = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === "pending");
    for (const file of pendingFiles) {
      await uploadFile(file);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "uploading":
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload Files</h2>
        <p className="text-muted-foreground mt-2">
          Upload files to the decentralized storage network with automatic encryption and redundancy.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Files</CardTitle>
          <CardDescription>
            Drag and drop files or click to browse. Maximum file size: 100MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop files here...</p>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium">Drop files here or click to browse</p>
                <p className="text-sm text-muted-foreground">
                  Supports all file types up to 100MB
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadFiles.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upload Queue</CardTitle>
              <CardDescription>
                {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''} ready for upload
              </CardDescription>
            </div>
            <Button 
              onClick={uploadAll}
              disabled={uploadFiles.every(f => f.status !== "pending")}
            >
              Upload All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadFiles.map((uploadFile) => (
                <motion.div
                  key={uploadFile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  {getStatusIcon(uploadFile.status)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">{uploadFile.file.name}</p>
                      <span className="text-sm text-muted-foreground">
                        {formatBytes(uploadFile.file.size)}
                      </span>
                    </div>
                    
                    {uploadFile.status === "uploading" && (
                      <div className="space-y-1">
                        <Progress value={uploadFile.progress} className="h-1" />
                        <p className="text-xs text-muted-foreground">
                          {uploadFile.progress.toFixed(0)}% complete
                        </p>
                      </div>
                    )}
                    
                    {uploadFile.status === "error" && uploadFile.error && (
                      <p className="text-xs text-red-500">{uploadFile.error}</p>
                    )}
                    
                    {uploadFile.status === "success" && (
                      <p className="text-xs text-green-600">Upload complete</p>
                    )}
                  </div>

                  {uploadFile.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}