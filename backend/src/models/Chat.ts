import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[];
  type: 'individual' | 'group';
  groupName?: string;
  groupAdmin?: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  type: { type: String, enum: ['individual', 'group'], default: 'individual' },
  groupName: { type: String },
  groupAdmin: { type: Schema.Types.ObjectId, ref: 'User' },
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });

export default mongoose.model<IChat>('Chat', chatSchema);

