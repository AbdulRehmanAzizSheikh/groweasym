import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },

    /** Spendable balance in INR. Pending withdrawals are held out of this. */
    balance: { type: Number, default: 0, min: 0 },

    /** Money already held for withdrawal requests that are still pending. */
    heldBalance: { type: Number, default: 0, min: 0 },

    blocked: { type: Boolean, default: false },

    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    bank: {
      accountHolder: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifsc: { type: String, default: "" },
      bankName: { type: String, default: "" },
      upiId: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

UserSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    fullName: this.fullName,
    mobileNumber: this.mobileNumber,
    balance: this.balance,
    heldBalance: this.heldBalance,
    blocked: this.blocked,
    referralCode: this.referralCode,
    bank: this.bank,
    createdAt: this.createdAt,
  };
};

const User = models.User || model("User", UserSchema);

export default User;