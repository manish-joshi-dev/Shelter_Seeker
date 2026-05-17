import mongoose from 'mongoose'

const localityQuestionSchema = new mongoose.Schema(
    {
        localityInsightId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Locality1',
            required: true,
        },
        question: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            enum: ['Water', 'Power', 'Traffic', 'Safety', 'Schools', 'Daily Needs', 'General'],
            required: true,
        },
        askedBy: {
            type: String, // user ID
            required: true,
        },
        askedByName: {
            type: String,
            required: true,
        },
        answers: [{
            answer: {
                type: String,
                required: true,
            },
            answeredBy: {
                type: String, // user ID
                required: true,
            },
            answeredByName: {
                type: String,
                required: true,
            },
            userType: {
                type: String,
                enum: ['Owner', 'Resident', 'Visitor'],
                required: true,
            },
            isVerified: {
                type: Boolean,
                default: false,
            },
            votes: {
                agree: { type: Number, default: 0 },
                disagree: { type: Number, default: 0 },
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        }],
        isResolved: {
            type: Boolean,
            default: false,
        },
        upvotes: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Index for efficient queries
// localityQuestionSchema.index({ localityInsightId: 1 });
// localityQuestionSchema.index({ category: 1 });
// localityQuestionSchema.index({ createdAt: -1 });

const LocalityQuestion = mongoose.model('localityq', localityQuestionSchema);
export default LocalityQuestion;
