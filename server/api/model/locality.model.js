import mongoose from 'mongoose';


const categorySchema = new mongoose.Schema({
    score:  { type: Number, default: 0, min: 0, max: 5 },
    rating: {
        type: String,
        enum: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
        default: 'Good'
    },
    totalSellerResponses: { type: Number, default: 0 },
}, { _id: false });

const localitySchema = new mongoose.Schema({
    localityName:  { type: String, required: true, unique: true, trim: true },
    city:          { type: String, default: '' },
    geohashes:     [{ type: String }],   // all cells that cover this locality
    totalListings: { type: Number, default: 0 },
    overallScore:  { type: Number, default: 0, min: 0, max: 10 },

    ratings: {
        waterSupply: { type: categorySchema, default: () => ({}) },
        powerSupply: { type: categorySchema, default: () => ({}) },
        traffic:     { type: categorySchema, default: () => ({}) },
        safety:      { type: categorySchema, default: () => ({}) },
        schools:     { type: categorySchema, default: () => ({}) },
        dailyNeeds:  { type: categorySchema, default: () => ({}) },
    },
}, { timestamps: true });

// localitySchema.index({ localityName: 1 });
// localitySchema.index({ geohashes: 1 });
// localitySchema.index({ city: 1 });

const Locality = mongoose.model('Locality1', localitySchema);
export default Locality;