import mongoose, { Schema, model, models } from "mongoose";

export type PayoutMethod = "bank" | "upi";

const WithdrawalSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 1 },

    method: { type: String, enum: ["bank", "upi"], default: "bank" },

    /** Snapshot of payout details at the time of the request. */
    payoutDetails: { type: String, default: "" },

    /**
     * pending  -> amount is held from the user's balance, waiting for admin payout
     * paid     -> admin confirmed the money was sent
     * rejected -> held amount was released back to the balance
     */
    status: {
      type: String,
      enum: ["pending", "paid", "rejected"],
      default: "pending",
      index: true,
    },

    adminNote: { type: String, default: "" },
    paidAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

WithdrawalSchema.index({ createdAt: -1 });

const Withdrawal =
  models.Withdrawal || model("Withdrawal", WithdrawalSchema);

export default Withdrawal;