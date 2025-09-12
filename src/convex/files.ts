import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const uploadFile = mutation({
  args: {
    name: v.string(),
    size: v.number(),
    mimeType: v.string(),
    manifestHash: v.string(),
    encryptionKey: v.string(),
    chunks: v.array(v.object({
      hash: v.string(),
      size: v.number(),
      peerIds: v.array(v.string()),
    })),
    redundancyFactor: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const fileId = await ctx.db.insert("files", {
      userId: user._id,
      name: args.name,
      size: args.size,
      mimeType: args.mimeType,
      manifestHash: args.manifestHash,
      encryptionKey: args.encryptionKey,
      chunks: args.chunks,
      status: "uploading",
      redundancyFactor: args.redundancyFactor,
    });

    // Update user's storage usage
    const currentUsage = user.storageUsed || 0;
    await ctx.db.patch(user._id, {
      storageUsed: currentUsage + args.size,
    });

    return fileId;
  },
});

export const getUserFiles = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    return await ctx.db
      .query("files")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const updateFileStatus = mutation({
  args: {
    fileId: v.id("files"),
    status: v.union(
      v.literal("uploading"),
      v.literal("stored"),
      v.literal("retrieving"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const file = await ctx.db.get(args.fileId);
    if (!file || file.userId !== user._id) {
      throw new Error("File not found or access denied");
    }

    await ctx.db.patch(args.fileId, {
      status: args.status,
    });
  },
});

export const deleteFile = mutation({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const file = await ctx.db.get(args.fileId);
    if (!file || file.userId !== user._id) {
      throw new Error("File not found or access denied");
    }

    // Update user's storage usage
    const currentUsage = user.storageUsed || 0;
    await ctx.db.patch(user._id, {
      storageUsed: Math.max(0, currentUsage - file.size),
    });

    await ctx.db.delete(args.fileId);
  },
});

export const getFileById = query({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const file = await ctx.db.get(args.fileId);
    if (!file || file.userId !== user._id) {
      throw new Error("File not found or access denied");
    }

    return file;
  },
});
