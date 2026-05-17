import mongoose from 'mongoose'

// ADD THIS — reusable sub-schema for seller's rating per category
const sellerCategorySchema = new mongoose.Schema({
    rating: {
        type: String,
        enum: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
        default: 'Good'
    },
    description: { type: String, default: '' }
}, { _id: false });

const listingSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
        },
        description:{
            type:String,
            required:true,
        },
        address:{
            type:String,
            required:true,
        },
        regularPrice:{
            type:Number,
            required:true,
        },
        discountPrice:{
            type:Number,
            required:true,
        },
        bedRooms:{
            type:Number,
            required:true,
        },
        furnished:{
            type:Boolean,
            required:true,
        },
        parking:{
            type:Boolean,
            required:true,
        },
        type:{
            type:String,
            required:true,
        },
        offer:{
            type:Boolean,
            required:true,
        },
        imageUrls:{
            type:Array,
            required:true,
        },
        washrooms:{
            type:Number,
            required:true,
        },
        userRef:{
            type:String,
            required:true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        approvedBy: {
            type: String,
        },
        approvedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        fraudDetection: {
            fraudScore:   { type: Number, default: null },
            isFraudulent: { type: Boolean, default: false },
            anomalyScore: { type: Number, default: null },
            detectedAt:   { type: Date, default: null },
            fraudFeatures: {
                pricePerSqm:        Number,
                areaNormalized:     Number,
                bedroomsNormalized: Number,
                cityTier:           Number,
            },
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                required: false,
            },
            coordinates: {
                type: [Number],
                required: true,
            },
        },
        reviews: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                comment: String,
                rating: {
                    type: Number,
                    min: 1,
                    max: 5,
                },
            },
        ],

        // ── ADDED ──────────────────────────────────────────────

        // Seller fills these when creating the listing
        sellerInsight: {
            waterSupply: { type: sellerCategorySchema, default: () => ({}) },
            powerSupply: { type: sellerCategorySchema, default: () => ({}) },
            traffic:     { type: sellerCategorySchema, default: () => ({}) },
            safety:      { type: sellerCategorySchema, default: () => ({}) },
            schools:     { type: sellerCategorySchema, default: () => ({}) },
            dailyNeeds:  { type: sellerCategorySchema, default: () => ({}) },
        },

        // Populated by reverse geocoding when listing is created
        localityName: { type: String, default: '', index: true },

        // Geohash cell this listing falls in (precision 6)
        geohash: { type: String, default: '', index: true },

        // ───────────────────────────────────────────────────────
    },
    { timestamps: true }
);

listingSchema.index({ location: '2dsphere' });

const Listing = mongoose.model('Listing', listingSchema)
export default Listing;