import mongoose from 'mongoose';

// Minimal user model — auth is out of scope for the skeleton, but the docs
// (4-database-schema.md) list a Users table, so we keep it for schema fidelity.
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
