const mongoose = require('mongoose');

/**
 * Registered app users (auth collection).
 * usernameNormalized — case-insensitive unique (Shokhruz === shokhruz).
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    usernameNormalized: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    emailNormalized: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    bio: {
      type: String,
      maxlength: 65,
      default: '',
    },
    /** Public R2 URL (or empty). Never store base64. */
    avatar: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: String(this._id),
    name: this.name,
    username: this.username,
    email: this.email,
    bio: this.bio || '',
    avatar: this.avatar || '',
    role: this.role || 'user',
    createdAt: this.createdAt,
  };
};

userSchema.methods.isAdmin = function isAdmin() {
  return this.role === 'admin';
};

module.exports = mongoose.model('User', userSchema);
