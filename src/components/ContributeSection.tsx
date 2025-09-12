import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { 
  Wallet, 
  Gift, 
  Trophy, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Coins,
  HardDrive,
  Users
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ContributeSectionProps = { donation?: any; contributors?: any[] };
export function ContributeSection(_props: ContributeSectionProps) {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [pledgeAmount, setPledgeAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myDonation = useQuery(api.peers.getMyDonation);
  const topContributors = useQuery(api.peers.getTopContributors, { limit: 5 });
  const donateStorageMutation = useMutation(api.peers.donateStorage);
  const accrueRewardsMutation = useMutation(api.peers.accrueRewards);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not found. Please install MetaMask to continue.", {
        action: {
          label: "Install",
          onClick: () => window.open("https://metamask.io/download/", "_blank"),
        },
      });
      return;
    }

    setIsConnecting(true);
    try {
      const provider = window.ethereum;
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (Array.isArray(accounts) && accounts.length > 0) {
        setWalletAddress(String(accounts[0]));
        toast.success("Wallet connected successfully!");
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast.error("Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePledgeSubmit = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    const amountGB = parseFloat(pledgeAmount);
    if (!amountGB || amountGB <= 0) {
      toast.error("Please enter a valid storage amount");
      return;
    }

    const pledgedCapacity = amountGB * 1024 * 1024 * 1024; // Convert GB to bytes

    setIsSubmitting(true);
    try {
      await donateStorageMutation({
        pledgedCapacity,
        wallet: walletAddress,
      });
      
      toast.success(`Successfully pledged ${amountGB} GB of storage!`);
      setPledgeAmount("");
    } catch (error) {
      console.error("Pledge error:", error);
      toast.error("Failed to submit pledge. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimRewards = async () => {
    try {
      const result = await accrueRewardsMutation({ amount: 10 });
      toast.success(`Claimed 10 demo tokens! New balance: ${result.newTokenBalance}`);
    } catch (error) {
      console.error("Claim error:", error);
      toast.error("Failed to claim rewards. Please try again.");
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Contribute Storage</h2>
        <p className="text-muted-foreground mt-2">
          Donate your storage capacity to the network and earn demo tokens as rewards.
        </p>
      </div>

      {/* Wallet Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Connection
          </CardTitle>
          <CardDescription>
            Connect your MetaMask wallet to participate in storage donations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!walletAddress ? (
            <Button 
              onClick={connectWallet} 
              disabled={isConnecting}
              className="w-full sm:w-auto"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect MetaMask
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">{shortenAddress(walletAddress)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyAddress(walletAddress)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Pledge */}
      {walletAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Pledge Storage
            </CardTitle>
            <CardDescription>
              Commit storage capacity to earn rewards (Demo mode)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myDonation ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">Current Pledge</div>
                    <div className="text-sm text-muted-foreground">
                      {formatBytes(myDonation.pledgedCapacity)}
                    </div>
                  </div>
                  <Badge 
                    variant="outline"
                    className={
                      myDonation.status === "active" 
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                    }
                  >
                    {myDonation.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">Reward Balance</div>
                    <div className="text-sm text-muted-foreground">
                      {myDonation.rewardBalance} tokens
                    </div>
                  </div>
                  <Button onClick={handleClaimRewards} size="sm">
                    <Gift className="w-4 h-4 mr-2" />
                    Claim +10 Tokens
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pledge-amount">Storage Amount (GB)</Label>
                  <Input
                    id="pledge-amount"
                    type="number"
                    placeholder="e.g., 100"
                    value={pledgeAmount}
                    onChange={(e) => setPledgeAmount(e.target.value)}
                    min="1"
                    step="1"
                  />
                </div>
                
                <Button 
                  onClick={handlePledgeSubmit}
                  disabled={isSubmitting || !pledgeAmount}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Pledge Storage
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top Contributors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Top Contributors
          </CardTitle>
          <CardDescription>
            Leading storage donors in the network
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topContributors && topContributors.length > 0 ? (
            <div className="space-y-3">
              {topContributors.map((contributor, index) => (
                <motion.div
                  key={contributor._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{contributor.userName}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatBytes(contributor.pledgedCapacity)} pledged
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <Coins className="w-3 h-3" />
                      {contributor.rewardBalance}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No contributors yet</p>
              <p className="text-sm text-muted-foreground">Be the first to pledge storage!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}