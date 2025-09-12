import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

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

export const donateStorage = mutation({
  args: {
    pledgedCapacity: v.number(),
    wallet: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    if (args.pledgedCapacity <= 0) {
      throw new Error("Pledged capacity must be positive");
    }

    // Check for existing donation
    const existingDonation = await ctx.db
      .query("donations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    let donationId;
    
    if (existingDonation) {
      // Update existing donation
      await ctx.db.patch(existingDonation._id, {
        pledgedCapacity: args.pledgedCapacity,
        wallet: args.wallet,
        status: "active",
        lastUpdated: Date.now(),
      });
      donationId = existingDonation._id;
    } else {
      // Create new donation
      donationId = await ctx.db.insert("donations", {
        userId: user._id,
        wallet: args.wallet,
        pledgedCapacity: args.pledgedCapacity,
        status: "active",
        rewardBalance: 0,
        lastUpdated: Date.now(),
      });
    }

    // Update user's wallet address if not set
    if (!user.walletAddress) {
      await ctx.db.patch(user._id, {
        walletAddress: args.wallet,
      });
    }

    return donationId;
  },
});

export const getMyDonation = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    return await ctx.db
      .query("donations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

export const getTopContributors = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Sort by combined score (pledged capacity + reward balance)
    const sorted = donations
      .map(donation => ({
        ...donation,
        score: donation.pledgedCapacity + (donation.rewardBalance * 1000000), // Weight rewards
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Get user info for each donation
    const contributors = [];
    for (const donation of sorted) {
      const user = await ctx.db.get(donation.userId);
      if (user) {
        contributors.push({
          ...donation,
          userName: user.name || user.email || "Anonymous",
          userImage: user.image,
        });
      }
    }

    return contributors;
  },
});

export const accrueRewards = mutation({
  args: {
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    if (args.amount <= 0) {
      throw new Error("Reward amount must be positive");
    }

    const donation = await ctx.db
      .query("donations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!donation) {
      throw new Error("No active donation found");
    }

    // Update donation reward balance
    await ctx.db.patch(donation._id, {
      rewardBalance: donation.rewardBalance + args.amount,
      lastUpdated: Date.now(),
    });

    // Update user token balance
    const currentBalance = user.tokenBalance || 0;
    await ctx.db.patch(user._id, {
      tokenBalance: currentBalance + args.amount,
    });

    return {
      newRewardBalance: donation.rewardBalance + args.amount,
      newTokenBalance: currentBalance + args.amount,
    };
  },
});