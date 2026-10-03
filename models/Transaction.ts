import mongoose, { Schema, model, models } from "mongoose";

export type TransactionType =
  | "deposit"
  | "withdraw"
  | "admin_credit"
  | "admin_debit"
  | "refund";

const TransactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["deposit", "withdraw", "admin_credit", "admin_debit", "refund"], required: true },
    amount: { type: Number, required: true },
    /** Signed effect on the wallet balance, stored for auditing. */
    direction: { type: Number, enum: [1, -1], required: true },
    status: {
      type: String,
      enum: ["success", "pending", "failed"],
      default: "success",
    },
    note: { type: String, default: "" },

    razorpayOrderId: { type: String, default: "", index: true },
    razorpayPaymentId: { type: String, default: "", index: true },

    balanceAfter: { type: Number, default: 0 },

    /** Set when an admin manually edits a balance. */
    adminId: { type: Schema.Types.ObjectId, ref: "User", default: null },

    /** Links a withdraw transaction back to its withdrawal request. */
    withdrawal: {
      type: Schema.Types.ObjectId,
      ref: "Withdrawal",
      default: null,
    },
  },
  { timestamps: true }
);

TransactionSchema.index({ user: 1, createdAt: -1 });

const Transaction =
  models.Transaction || model("Transaction", TransactionSchema);

export default Transaction;