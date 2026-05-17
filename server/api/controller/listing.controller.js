import Listing from "../model/listing.model.js"
import TrustSystemService from "../services/trustSystem.service.js";
import FraudDetectionService from "../services/fraudDetection.service.js";
import { errorHandler } from "../utils/error.js";
import redis from "../../redis.js";
import { computeGeohash, getLocalityName, recomputeLocalityRatings } from '../utils/locality.js';
import Locality from '../model/locality.model.js';


// export const createListing = async(req,res,next)=>{
//     try {
//         console.log(req.body);
        
//         // Validate required fields
//         const requiredFields = ['name', 'description', 'address', 'regularPrice', 'discountPrice', 'bedRooms', 'washrooms', 'furnished', 'parking', 'type', 'offer', 'imageUrls', 'userRef'];
//         for (const field of requiredFields) {
//             if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
//                 return next(errorHandler(400, `Missing required field: ${field}`));
//             }
//         }
        
//         // Convert type from 'sell' to 'sale' if needed
//         if (req.body.type === 'sell') {
//             req.body.type = 'sale';
//         }
        
//         // Perform fraud detection before creating the listing
//         console.log('Starting fraud detection for new listing...');
//         const fraudDetectionResult = await FraudDetectionService.detectFraud(req.body);
        
//         // Add fraud detection results to the listing data
//         req.body.fraudDetection = fraudDetectionResult;
        
//         const listing = await Listing.create(req.body);
//         const locality = await LocalityInsights.create({
//             listingId: listing._id,
//             address: req.body.address,
//             createdAt: new Date()
//         });
        
//         // Update trust points for listing creation
//         try {
//             await TrustSystemService.updateTrustPoints(
//                 req.body.userRef,
//                 'LISTING_CREATED',
//                 null,
//                 'Property listing created'
//             );
//         } catch (trustError) {
//             console.error('Error updating trust points for listing creation:', trustError);
//             // Don't fail the listing creation if trust update fails
//         }
        
//         console.log('Listing created with fraud detection:', {
//             listingId: listing._id,
//             fraudScore: fraudDetectionResult.fraudScore,
//             isFraudulent: fraudDetectionResult.isFraudulent
//         });
        
//         return res.status(201).json({listing,fraudDetection: fraudDetectionResult});
//     } catch (error) {
//         console.error('Error creating listing:', error);
//         next(error);
//     }
// }



export const createListing = async (req, res, next) => {
    try {
        console.log(req.body);

        // Validate required fields
        const requiredFields = ['name', 'description', 'address', 'regularPrice',
            'discountPrice', 'bedRooms', 'washrooms', 'furnished', 'parking',
            'type', 'offer', 'imageUrls', 'userRef'];
        for (const field of requiredFields) {
            if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
                return next(errorHandler(400, `Missing required field: ${field}`));
            }
        }

        if (req.body.type === 'sell') req.body.type = 'sale';

        // ── STEP 1: compute geohash and locality name ──────────
        const coordinates = req.body.location?.coordinates;

        if (!coordinates || coordinates.length < 2) {
            return next(errorHandler(400, 'Missing location coordinates'));
        }

        const geohash = computeGeohash(coordinates);
        console.log("hi the cods are:"+coordinates);
        const localityName = await getLocalityName(coordinates);
        console.log("hi the" + localityName);
        // attach to req.body so they get saved on the listing
        req.body.geohash = geohash;
        req.body.localityName = localityName;

        console.log(`Geohash: ${geohash}, Locality: ${localityName}`);
        // ───────────────────────────────────────────────────────

        // fraud detection
        console.log('Starting fraud detection...');
        const fraudDetectionResult = await FraudDetectionService.detectFraud(req.body);
        req.body.fraudDetection = fraudDetectionResult;

        // create the listing
        const listing = await Listing.create(req.body);

        // ── STEP 2: upsert Locality document ───────────────────
        // if Locality for this locality already exists → update it
        // if not → create it
        const locality = await Locality.findOneAndUpdate(
            { localityName },
            {
                $addToSet: { geohashes: geohash },
                $set: { city: req.body.address },
                $inc: { totalListings: 1 }
            },
            { upsert: true, new: true }
        );

        if (req.body.sellerInsight) {
            recomputeLocalityRatings(localityName);
        }

        console.log(locality);
        // ───────────────────────────────────────────────────────

        // trust points
        try {
            await TrustSystemService.updateTrustPoints(
                req.body.userRef,
                'LISTING_CREATED',
                null,
                'Property listing created'
            );
        } catch (trustError) {
            console.error('Trust points error:', trustError);
        }

        console.log('Listing created:', {
            listingId: listing._id,
            geohash,
            localityName,
            fraudScore: fraudDetectionResult.fraudScore,
        });

        return res.status(201).json({ listing, fraudDetection: fraudDetectionResult });

    } catch (error) {
        console.error('Error creating listing:', error);
        next(error);
    }
};

export const deleteListing = async(req,res,next)=>{
    const listing = await Listing.findById(req.params.id);
    if(!listing) return next(errorHandler(401,'User listing not found'));
    if(req.user.id !== listing.userRef) return next(errorHandler(402,'You can only delete your own listings'));
    try {
        await Listing.findByIdAndDelete(req.params.id);
        res.status(201).json('Your listing has been deleted !!');
    } catch (error) {
        next(error);
    }
}

export const updateListing = async(req,res,next)=>{
    const listing = await Listing.findById(req.params.id);
    if(!listing) return next(errorHandler(404,'listing not found'));
    if(req.user.id!==listing.userRef) return next(errorHandler(401,'you only update your istings'));
    try {
        const updatedListing = await Listing.findByIdAndUpdate(req.params.id,
            
               req.body
            ,
            {new:true}
        );
        res.status(201).json(updatedListing);
    } catch (error) {
        next(error);
    }
}

export const getListing = async(req,res,next)=>{
    
    try {
    const listing = await Listing.findById(req.params.id);
    if(!listing) return next(errorHandler(404,'listing not found'));
    res.status(200).json(listing);
    } catch (error) {
        next(error);
    }

}
// export const getListings = async(req,res,next)=>{

//     try {
//         const limit = parseInt(req.query.limit) || 9;
//         const startIndex = parseInt(req.query.startIndex) || 0;
       
//         let offer = req.query.offer;

//         if (offer === undefined || offer === 'false') {
//           offer = { $in: [false, true] };
//         }
//         let furnished = req.query.furnished;

//     if (furnished === undefined || furnished === 'false') {
//       furnished = { $in: [false, true] };
//     }

//     let parking = req.query.parking;

//     if (parking === undefined || parking === 'false') {
//       parking = { $in: [false, true] };
//     }
//     let type = req.query.type;

//     if (type === undefined || type === 'all') {
//       type = { $in: ['sale', 'rent'] };
//     }
//     const searchTerm = req.query.searchTerm || '';

//     const sort = req.query.sort || 'createdAt';

//     const order = req.query.order || 1;

//     const listings = await Listing.find({
//         name: {$regex:searchTerm,$options:'i' },
//         offer,
//         furnished,
//         parking,
//         type,
//     }).sort({[sort]:order}).limit(limit).skip(startIndex);
//     return res.status(200).json(listings);



//     } catch (error) {
//         next(error);
//     }
// }



export const getListings = async (req, res, next) => {
  try {
    const limit       = parseInt(req.query.limit)      || 9;
    const startIndex  = parseInt(req.query.startIndex) || 0;
    const searchTerm  = req.query.searchTerm           || '';
    const sort        = req.query.sort                 || 'createdAt';
    const order       = req.query.order                || 1;
    const offer       = req.query.offer;
    const furnished   = req.query.furnished;
    const parking     = req.query.parking;
    const type        = req.query.type;

    // ── Build a deterministic cache key from all query params ──
    const cacheKey = `listings:${searchTerm}:${offer}:${furnished}:${parking}:${type}:${sort}:${order}:${limit}:${startIndex}`;

    // ── Check cache first ──
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT');
      return res.status(200).json(JSON.parse(cached));
    }

    console.log('❌ Cache MISS — hitting MongoDB');

    // ── Build MongoDB query (your original logic) ──
    let offerQuery     = offer     === undefined || offer     === 'false' ? { $in: [false, true] } : offer;
    let furnishedQuery = furnished === undefined || furnished === 'false' ? { $in: [false, true] } : furnished;
    let parkingQuery   = parking   === undefined || parking   === 'false' ? { $in: [false, true] } : parking;
    let typeQuery      = type      === undefined || type      === 'all'   ? { $in: ['sale', 'rent'] } : type;

    const listings = await Listing.find({
      name:      { $regex: searchTerm, $options: 'i' },
      offer:     offerQuery,
      furnished: furnishedQuery,
      parking:   parkingQuery,
      type:      typeQuery,
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    // ── Store in Redis for 5 minutes ──
    await redis.setex(cacheKey, 300, JSON.stringify(listings));

    return res.status(200).json(listings);

  } catch (error) {
    next(error);
  }
};

export const detectFraudForListing = async(req,res,next)=>{
    try {
        const listing = await Listing.findById(req.params.id);
        if(!listing) return next(errorHandler(404,'Listing not found'));
        
        console.log('Starting fraud detection for existing listing:', listing._id);
        
        // Perform fraud detection
        const fraudDetectionResult = await FraudDetectionService.detectFraud(listing);
        console.log(fraudDetectionResult);
        // Update the listing with fraud detection results
        const updatedListing = await Listing.findByIdAndUpdate(
            req.params.id,
            { fraudDetection: fraudDetectionResult },
            { new: true }
        );
        
        console.log('Fraud detection completed for listing:', {
            listingId: listing._id,
            fraudScore: fraudDetectionResult.fraudScore,
            isFraudulent: fraudDetectionResult.isFraudulent
        });
        
        return res.status(200).json({
            message: 'Fraud detection completed',
            listing: updatedListing,
            fraudDetection: fraudDetectionResult
        });
        
    } catch (error) {
        console.error('Error in fraud detection for listing:', error);
        next(error);
    }
}

// New endpoint to get fraud detection service health
export const getFraudDetectionHealth = async(req,res,next)=>{
    try {
        const isHealthy = await FraudDetectionService.checkHealth();
        
        return res.status(200).json({
            service: 'fraud-detection',
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error checking fraud detection health:', error);
        next(error);
    }
}