import { internalMutation } from "./_generated/server";

export const seedNetworkData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing data
    const existingPeers = await ctx.db.query("peers").collect();
    for (const peer of existingPeers) {
      await ctx.db.delete(peer._id);
    }

    const existingStats = await ctx.db.query("networkStats").collect();
    for (const stat of existingStats) {
      await ctx.db.delete(stat._id);
    }

    // Seed peer nodes
    const peers = [
      {
        nodeId: "peer_sf_001",
        address: "192.168.1.100:8080",
        publicKey: "04a1b2c3d4e5f6789abcdef0123456789abcdef0123456789abcdef0123456789a",
        storageCapacity: 1024 * 1024 * 1024 * 100, // 100GB
        storageUsed: 1024 * 1024 * 1024 * 25, // 25GB used
        reputation: 95,
        lastSeen: Date.now(),
        isOnline: true,
        location: "San Francisco, CA"
      },
      {
        nodeId: "peer_ny_002", 
        address: "192.168.1.101:8080",
        publicKey: "04b2c3d4e5f6789abcdef0123456789abcdef0123456789abcdef0123456789ab",
        storageCapacity: 1024 * 1024 * 1024 * 50, // 50GB
        storageUsed: 1024 * 1024 * 1024 * 12, // 12GB used
        reputation: 88,
        lastSeen: Date.now() - 300000, // 5 minutes ago
        isOnline: true,
        location: "New York, NY"
      },
      {
        nodeId: "peer_london_003",
        address: "192.168.1.102:8080", 
        publicKey: "04c3d4e5f6789abcdef0123456789abcdef0123456789abcdef0123456789abc",
        storageCapacity: 1024 * 1024 * 1024 * 200, // 200GB
        storageUsed: 1024 * 1024 * 1024 * 80, // 80GB used
        reputation: 92,
        lastSeen: Date.now() - 120000, // 2 minutes ago
        isOnline: true,
        location: "London, UK"
      },
      {
        nodeId: "peer_tokyo_004",
        address: "192.168.1.103:8080",
        publicKey: "04d4e5f6789abcdef0123456789abcdef0123456789abcdef0123456789abcd",
        storageCapacity: 1024 * 1024 * 1024 * 75, // 75GB
        storageUsed: 1024 * 1024 * 1024 * 30, // 30GB used
        reputation: 90,
        lastSeen: Date.now() - 600000, // 10 minutes ago
        isOnline: false,
        location: "Tokyo, Japan"
      },
      {
        nodeId: "peer_berlin_005",
        address: "192.168.1.104:8080",
        publicKey: "04e5f6789abcdef0123456789abcdef0123456789abcdef0123456789abcde",
        storageCapacity: 1024 * 1024 * 1024 * 150, // 150GB
        storageUsed: 1024 * 1024 * 1024 * 45, // 45GB used
        reputation: 97,
        lastSeen: Date.now() - 60000, // 1 minute ago
        isOnline: true,
        location: "Berlin, Germany"
      }
    ];

    for (const peer of peers) {
      await ctx.db.insert("peers", peer);
    }

    // Seed network statistics
    const totalStorage = peers.reduce((sum, p) => sum + p.storageUsed, 0);
    const activePeers = peers.filter(p => p.isOnline).length;
    
    await ctx.db.insert("networkStats", {
      totalFiles: 1247,
      totalStorage,
      activePeers,
      totalDeals: 3891,
      averageRetrievalTime: 2.3,
      networkHealth: 87
    });

    return { message: "Network data seeded successfully", peersCreated: peers.length };
  },
});
