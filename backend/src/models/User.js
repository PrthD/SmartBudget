import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

const PreferencesSchema = new mongoose.Schema(
  {
    currency: { type: String, default: 'CAD' },
    // v1 hard-coded this zone, so it is the right default for existing users.
    timezone: { type: String, default: 'America/Edmonton' },
    aiEnabled: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    isFirstTimeLogin: { type: Boolean, default: true },
    // Base64 data URL (v1 format). Never selected by default: it can be large
    // and is served from its own cacheable endpoint.
    profilePhoto: { type: String, default: '', select: false },
    preferences: { type: PreferencesSchema, default: () => ({}) },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  }
});

UserSchema.methods.verifyPassword = function verifyPassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
