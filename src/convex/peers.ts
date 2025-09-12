import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const registerPeer = mutation({
  args: {
    nodeId: v.string(),
    address: v.string(),
    publicKey: v.string(),
    storageCapacity: v.number(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if peer already exists
    const existingPeer = await ctx.db
      .query("peers")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.nodeId))
      .unique();

    if (existingPeer) {
      // Update existing peer
      await ctx.db.patch(existingPeer._id, {
        address: args.address,
        publicKey: args.publicKey,
        storageCapacity: args.storageCapacity,
        location: args.location,
        lastSeen: Date.now(),
        isOnline: true,
      });
      return existingPeer._id;
    } else {
      // Create new peer
      return await ctx.db.insert("peers", {
        nodeId: args.nodeId,
        address: args.address,
        publicKey: args.publicKey,
        storageCapacity: args.storageCapacity,
        storageUsed: 0,
        reputation: 100, // Start with good reputation
        lastSeen: Date.now(),
        isOnline: true,
        location: args.location,
      });
    }
  },
});

export const getOnlinePeers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("peers")
      .withIndex("by_online", (q) => q.eq("isOnline", true))
      .collect();
  },
});

export const updatePeerStatus = mutation({
  args: {
    nodeId: v.string(),
    isOnline: v.boolean(),
    storageUsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const peer = await ctx.db
      .query("peers")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.nodeId))
      .unique();

    if (peer) {
      const updates: any = {
        isOnline: args.isOnline,
        lastSeen: Date.now(),
      };

      if (args.storageUsed !== undefined) {
        updates.storageUsed = args.storageUsed;
      }

      await ctx.db.patch(peer._id, updates);
    }
  },
});

export const getBestPeers = query({
  args: {
    count: v.number(),
    minCapacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let peers = await ctx.db
      .query("peers")
      .withIndex("by_online", (q) => q.eq("isOnline", true))
      .collect();

    // Filter by minimum capacity if specified
    const minCapacity = args.minCapacity;
    if (typeof minCapacity === "number") {
      peers = peers.filter(
        (peer) => peer.storageCapacity - peer.storageUsed >= minCapacity
      );
    }

    // Sort by reputation and available storage
    peers.sort((a, b) => {
      const aAvailable = a.storageCapacity - a.storageUsed;
      const bAvailable = b.storageCapacity - b.storageUsed;
      const aScore = a.reputation * 0.7 + (aAvailable / a.storageCapacity) * 0.3;
      const bScore = b.reputation * 0.7 + (bAvailable / b.storageCapacity) * 0.3;
      return bScore - aScore;
    });

    return peers.slice(0, args.count);
  },
});