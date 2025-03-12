const vendorIdSchema = new mongoose.Schema({
    vendorId: { type: Number, required: true, unique: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  });
  