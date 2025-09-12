import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
      
      // Storage-specific fields
      storageQuota: v.optional(v.number()), // Storage quota in bytes
      storageUsed: v.optional(v.number()), // Storage used in bytes
      peerNodeId: v.optional(v.string()), // Peer node identifier
      publicKey: v.optional(v.string()), // Public key for encryption
      
      // Donation/wallet fields
      walletAddress: v.optional(v.string()), // Connected wallet address
      tokenBalance: v.optional(v.number()), // Demo token balance
      preferredPledge: v.optional(v.number()), // Preferred pledge amount in bytes
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Storage donations from users
    donations: defineTable({
      userId: v.id("users"),
      wallet: v.string(), // Wallet address
      pledgedCapacity: v.number(), // Pledged storage in bytes
      status: v.union(
        v.literal("pending"),
        v.literal("active"),
        v.literal("inactive")
      ),
      rewardBalance: v.number(), // Accumulated reward tokens
      nodeId: v.optional(v.string()), // Optional peer node ID
      lastUpdated: v.number(), // Timestamp of last update
    }).index("by_user", ["userId"])
      .index("by_wallet", ["wallet"])
      .index("by_status", ["status"]),

    // Files stored in the decentralized network
    files: defineTable({
      userId: v.id("users"),
      name: v.string(),
      size: v.number(),
      mimeType: v.string(),
      manifestHash: v.string(), // Hash of the manifest on blockchain
      encryptionKey: v.string(), // Encrypted with user's key
      chunks: v.array(v.object({
        hash: v.string(),
        size: v.number(),
        peerIds: v.array(v.string()), // Peers storing this chunk
      })),
      status: v.union(
        v.literal("uploading"),
        v.literal("stored"),
        v.literal("retrieving"),
        v.literal("failed")
      ),
      redundancyFactor: v.number(), // Number of copies per chunk
    }).index("by_user", ["userId"])
      .index("by_status", ["status"])
      .index("by_manifest", ["manifestHash"]),

    // Peer nodes in the network
    peers: defineTable({
      nodeId: v.string(),
      address: v.string(), // IP:Port or multiaddr
      publicKey: v.string(),
      storageCapacity: v.number(), // Total storage in bytes
      storageUsed: v.number(), // Used storage in bytes
      reputation: v.number(), // Reputation score
      lastSeen: v.number(), // Timestamp
      isOnline: v.boolean(),
      location: v.optional(v.string()), // Geographic location
    }).index("by_node_id", ["nodeId"])
      .index("by_online", ["isOnline"])
      .index("by_reputation", ["reputation"]),

    // Storage deals between users and peers
    deals: defineTable({
      fileId: v.id("files"),
      peerId: v.id("peers"),
      chunkHash: v.string(),
      price: v.number(), // Price in tokens
      duration: v.number(), // Duration in seconds
      status: v.union(
        v.literal("pending"),
        v.literal("active"),
        v.literal("completed"),
        v.literal("failed")
      ),
      proofInterval: v.number(), // Proof submission interval
      lastProof: v.optional(v.number()), // Last proof timestamp
    }).index("by_file", ["fileId"])
      .index("by_peer", ["peerId"])
      .index("by_status", ["status"]),

    // Proof of storage submissions
    proofs: defineTable({
      dealId: v.id("deals"),
      peerId: v.id("peers"),
      chunkHash: v.string(),
      proof: v.string(), // Cryptographic proof
      challenge: v.string(), // Challenge that was answered
      verified: v.boolean(),
      blockchainTxHash: v.optional(v.string()),
    }).index("by_deal", ["dealId"])
      .index("by_peer", ["peerId"])
      .index("by_verified", ["verified"]),

    // Network statistics and monitoring
    networkStats: defineTable({
      totalFiles: v.number(),
      totalStorage: v.number(),
      activePeers: v.number(),
      totalDeals: v.number(),
      averageRetrievalTime: v.number(),
      networkHealth: v.number(), // 0-100 score
    }),
  },
  {
    schemaValidation: false,
  },
);

export default schema;