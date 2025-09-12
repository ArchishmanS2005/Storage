import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { 
  Download, 
  Trash2, 
  File, 
  Image, 
  Video, 
  Music, 
  Archive,
  FileText,
  MoreHorizontal,
  Copy,
  Share
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilesSectionProps {
  files: Doc<"files">[];
}

export function FilesSection({ files }: FilesSectionProps) {
  const deleteFileMutation = useMutation(api.files.deleteFile);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) 
      return <Archive className="w-5 h-5" />;
    if (mimeType.includes('text') || mimeType.includes('document')) 
      return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stored': return 'bg-green-100 text-green-800 border-green-200';
      case 'uploading': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'retrieving': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDelete = async (fileId: Id<"files">, fileName: string) => {
    try {
      await deleteFileMutation({ fileId });
      toast.success(`${fileName} deleted successfully`);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete ${fileName}`);
    }
  };

  const handleDownload = async (file: Doc<"files">) => {
    // In a real implementation, this would:
    // 1. Fetch chunks from peers
    // 2. Verify integrity
    // 3. Decrypt and reassemble
    // 4. Trigger download
    toast.info(`Downloading ${file.name}... (Demo mode)`);
  };

  const handleCopyHash = (manifestHash: string) => {
    navigator.clipboard.writeText(manifestHash);
    toast.success("Manifest hash copied to clipboard");
  };

  const handleShare = (file: Doc<"files">) => {
    const shareUrl = `${window.location.origin}/file/${file.manifestHash}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard");
  };

  if (files.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Files</h2>
          <p className="text-muted-foreground mt-2">
            Your uploaded files will appear here.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <File className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Upload your first file to get started with decentralized storage.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Files</h2>
          <p className="text-muted-foreground mt-2">
            {files.length} file{files.length !== 1 ? 's' : ''} stored in the network
          </p>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Total size: {formatBytes(files.reduce((sum, f) => sum + f.size, 0))}
        </div>
      </div>

      <div className="grid gap-4">
        {files.map((file, index) => (
          <motion.div
            key={file._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 text-muted-foreground">
                    {getFileIcon(file.mimeType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold truncate">{file.name}</h3>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(file.status)}
                      >
                        {file.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>{formatBytes(file.size)}</span>
                      <span>{formatDate(file._creationTime)}</span>
                      <span>{file.chunks.length} chunks</span>
                      <span>{file.redundancyFactor}x redundancy</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === 'stored' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyHash(file.manifestHash)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Hash
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(file)}>
                          <Share className="w-4 h-4 mr-2" />
                          Share Link
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(file._id, file.name)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
