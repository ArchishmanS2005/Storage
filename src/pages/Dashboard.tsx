import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { 
  Upload, 
  Download, 
  Files, 
  Network, 
  Settings, 
  LogOut,
  HardDrive,
  Users,
  Activity,
  Shield,
  Copy
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { UploadSection } from "@/components/UploadSection";
import { FilesSection } from "@/components/FilesSection";
import { NetworkSection } from "@/components/NetworkSection";
import { ContributeSection } from "@/components/ContributeSection";
import { toast } from "sonner";

type ActiveSection = "upload" | "files" | "network" | "contribute" | "settings";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ActiveSection>("upload");
  
  const networkStats = useQuery(api.network.getNetworkStats);
  const userFiles = useQuery(api.files.getUserFiles);
  const myDonation = useQuery(api.peers.getMyDonation);
  const topContributors = useQuery(api.peers.getTopContributors, { limit: 5 });

  // Check for tab parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'contribute') {
      setActiveSection('contribute');
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const storageUsed = user?.storageUsed || 0;
  const storageQuota = user?.storageQuota || (1024 * 1024 * 1024); // 1GB default
  const storagePercentage = (storageUsed / storageQuota) * 100;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderContent = () => {
    switch (activeSection) {
      case "upload":
        return <UploadSection />;
      case "files":
        return <FilesSection files={userFiles || []} />;
      case "network":
        return <NetworkSection stats={networkStats} />;
      case "contribute":
        return <ContributeSection />;
      case "settings":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
              <p className="text-muted-foreground mt-2">
                Manage your storage preferences and account settings.
              </p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Storage Quota</CardTitle>
                <CardDescription>
                  Your current storage usage and limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used: {formatBytes(storageUsed)}</span>
                    <span>Total: {formatBytes(storageQuota)}</span>
                  </div>
                  <Progress value={storagePercentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight">DeStore</h1>
                <p className="text-xs text-muted-foreground">Decentralized Storage</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="px-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === "upload"}
                  onClick={() => setActiveSection("upload")}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === "files"}
                  onClick={() => setActiveSection("files")}
                >
                  <Files className="w-4 h-4" />
                  <span>My Files</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === "network"}
                  onClick={() => setActiveSection("network")}
                >
                  <Network className="w-4 h-4" />
                  <span>Network</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === "contribute"}
                  onClick={() => setActiveSection("contribute")}
                >
                  <HardDrive className="w-4 h-4" />
                  <span>Contribute</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === "settings"}
                  onClick={() => setActiveSection("settings")}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <div className="space-y-4">
              {networkStats && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Network Health</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        networkStats.networkHealth > 80 ? 'bg-green-500' :
                        networkStats.networkHealth > 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{networkStats.networkHealth}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span>{networkStats.activePeers} peers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Files className="w-3 h-3 text-muted-foreground" />
                      <span>{networkStats.totalFiles} files</span>
                    </div>
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <div className="text-sm font-medium">{user?.name || user?.email}</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="w-full justify-start h-8 px-2"
                >
                  <LogOut className="w-3 h-3 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <h1 className="font-semibold capitalize">{activeSection}</h1>
            </div>
          </header>
          
          <main className="flex-1 p-6">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}