const mongoose = require('mongoose');

/**
 * Temporary email OTP for register / login verification.
 * Separate from users so pending signups do not pollute the user collection.
 */
const authOtpSchema = new mongoose.Schema(
  {
    emailNormalized: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['register', 'login'],
      required: true,
      index: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    /** Pending register payload (name, username, passwordHash) — login leaves empty */
    pending: {
      name: { type: String, trim: true, default: '' },
      username: { type: String, trim: true, default: '' },
      usernameNormalized: { type: String, trim: true, lowercase: true, default: '' },
      email: { type: String, trim: true, default: '' },
      passwordHash: { type: String, default: '' },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'auth_otps',
  }
);

authOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AuthOtp', authOtpSchema);
