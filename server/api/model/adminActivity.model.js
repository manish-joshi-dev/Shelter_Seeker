import mongoose from 'mongoose'

const adminActivitySchema = new mongoose.Schema(
    {
        adminId: {
            type: String,
            required: true,
            index: true,
        },
        adminName: {
            type: String,
            default: '',
        },
        action: {
            type: String,
            required: true,
            index: true,
        },
        targetType: {
            type: String,
            required: true,
            index: true,
        },
        targetId: {
            type: String,
            default: null,
        },
        targetName: {
            type: String,
            default: '',
        },
        ip: {
            type: String,
            default: '',
        },
        userAgent: {
            type: String,
            default: '',
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: undefined,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    { timestamps: true }
);

adminActivitySchema.index({ createdAt: -1 });

const AdminActivity = mongoose.model('AdminActivity', adminActivitySchema);
export default AdminActivity;
