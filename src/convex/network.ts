import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getNetworkStats = query({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db.query("files").collect();
    const peers = await ctx.db.query("peers").collect();
    const deals = await ctx.db.query("deals").collect();

    const onlinePeers = peers.filter(p => p.isOnline);
    const totalStorage = peers.reduce((sum, p) => sum + p.storageUsed, 0);
    const activeDeals = deals.filter(d => d.status === "active");

    // Calculate network health based on various factors
    const healthFactors = {
      peerDistribution: Math.min(onlinePeers.length / 10, 1), // Ideal: 10+ peers
      storageUtilization: Math.min(totalStorage / (1024 * 1024 * 1024 * 100), 1), // Ideal: 100GB+
      dealSuccess: activeDeals.length / Math.max(deals.length, 1),
    };

    const networkHealth = Math.round(
      (healthFactors.peerDistribution * 0.4 + 
       healthFactors.storageUtilization * 0.3 + 
       healthFactors.dealSuccess * 0.3) * 100
    );

    return {
      totalFiles: files.length,
      totalStorage,
      activePeers: onlinePeers.length,
      totalDeals: activeDeals.length,
      averageRetrievalTime: 2.5, // Mock value - would be calculated from actual retrievals
      networkHealth,
    };
  },
});

export const updateNetworkStats = mutation({
  args: {
    totalFiles: v.number(),
    totalStorage: v.number(),
    activePeers: v.number(),
    totalDeals: v.number(),
    averageRetrievalTime: v.number(),
    networkHealth: v.number(),
  },
  handler: async (ctx, args) => {
    // Delete existing stats and insert new ones
    const existingStats = await ctx.db.query("networkStats").collect();
    for (const stat of existingStats) {
      await ctx.db.delete(stat._id);
    }

    await ctx.db.insert("networkStats", args);
  },
});
