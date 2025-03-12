const vendorIdSchema = new mongoose.Schema({
    vendorId: { type: Number, required: true, unique: false}, // Removed unique constraint to allow multiple users to share the same vendor ID
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  });
