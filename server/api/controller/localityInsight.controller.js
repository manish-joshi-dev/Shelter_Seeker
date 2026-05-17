import Locality from "../model/locality.model.js";
import Localityq from "../model/localityq.model.js";

import Listing from "../model/listing.model.js";
import { errorHandler } from "../utils/error.js";
import mongoose from "mongoose";
import { recomputeLocalityRatings } from '../utils/locality.js';

// Create or update locality insights (for sellers)
// export const createOrUpdateInsights = async (req, res, next) => {
//   try {
//     const { listingId, sellerInsights, localityName } = req.body;

//     if (!listingId || !sellerInsights || !localityName) {
//       return next(errorHandler(400, "Missing required fields"));
//     }

//     // Verify listing exists and user owns it
//     const listing = await Listing.findById(listingId);
//     if (!listing) {
//       return next(errorHandler(404, "Listing not found"));
//     }
//     if (listing.userRef !== req.user.id) {
//       return next(
//         errorHandler(403, "You can only add insights to your own listings")
//       );
//     }

//     // Check if insights already exist
//     let localityInsight = await LocalityInsight.findOne({
//       listingId: new mongoose.Types.ObjectId(listingId),
//     });

//     if (localityInsight) {
//       // Update existing insights
//       localityInsight.sellerInsights = sellerInsights;
//       localityInsight.localityName = localityName;
//       localityInsight.address = listing.address;
//     } else {
//       // Create new insights
//       localityInsight = new LocalityInsight({
//         listingId: new mongoose.Types.ObjectId(listingId),
//         address: listing.address,
//         localityName,
//         sellerInsights,
//         createdBy: req.user.id,
//       });
//     }

//     // Calculate locality score based on ratings
//     const ratings = Object.values(sellerInsights).map(
//       (insight) => insight.rating
//     );
//     const scoreMap = { Good: 3, Average: 2, Poor: 1 };
//     const totalScore = ratings.reduce(
//       (sum, rating) => sum + scoreMap[rating],
//       0
//     );
//     localityInsight.localityScore = (totalScore / ratings.length) * (10 / 3); // Scale to 10

//     const savedInsight = await localityInsight.save();
//     res.status(201).json(savedInsight);
//   } catch (error) {
//     console.error("Error creating insights:", error);
//     next(error);
//   }
// };


export const createOrUpdateInsights = async (req, res, next) => {
    try {
        const sellerInsight = req.body.sellerInsight || req.body.sellerInsights;
        const { listingId } = req.body;

        if (!listingId || !sellerInsight) {
            return next(errorHandler(400, 'Missing required fields'));
        }

        // verify listing exists and user owns it
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return next(errorHandler(404, 'Listing not found'));
        }
        if (listing.userRef !== req.user.id) {
            return next(errorHandler(403, 'You can only add insights to your own listings'));
        }
        if (!listing.localityName) {
            return next(errorHandler(400, 'Listing does not have a locality yet. Make sure location coordinates are set.'));
        }

        // save sellerInsight directly on the listing
        const updatedListing = await Listing.findByIdAndUpdate(
            listingId,
            { $set: { sellerInsight } },
            { new: true }
        );

        // recompute locality aggregated ratings — fire and forget
        recomputeLocalityRatings(listing.localityName);

        res.status(200).json(updatedListing);

    } catch (error) {
        console.error('Error creating/updating insights:', error);
        next(error);
    }
};

// // Get locality insights for a listing
// export const getInsights = async (req, res, next) => {
//   try {
//     const { listingId } = req.params;

//     // Validate listingId
//     if (!listingId) {
//       return next(errorHandler(400, "Listing ID is required"));
//     }

//     // Validate ObjectId format
//     if (!mongoose.Types.ObjectId.isValid(listingId)) {
//       return next(errorHandler(400, "Invalid listing ID format"));
//     }

//     const localityInsight = await LocalityInsight.findOne({
//       listingId: new mongoose.Types.ObjectId(listingId),
//     });
//     const targetListing = await Listing.findById(listingId);
//     // console.log('Fetched locality insight:', localityInsight);
//     console.log("Target listing:", targetListing);
//     if (!localityInsight) {
//       return next(
//         errorHandler(404, "No locality insights found for this listing")
//       );
//     }

//     // Get questions for this locality
//     const questions = await Localityq.find({
//       localityInsightId: localityInsight._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(20);

//     console.log("Found questions for locality:", questions.length, questions);

//     res.status(200).json({
//       insight: localityInsight,
//       questions: questions,
//     });
//   } catch (error) {
//     console.error("Error in getInsights:", error);
//     next(error);
//   }
// };

export const getInsights = async (req, res, next) => {
    try {
      console.log("hi");
        const { listingId } = req.params;

        if (!listingId) return next(errorHandler(400, 'Listing ID is required'));
        if (!mongoose.Types.ObjectId.isValid(listingId)){
          // console.log("ee");
          return next(errorHandler(400, 'Invalid listing ID format'));

        }
            

        const listing = await Listing.findById(listingId);
        if (!listing) return next(errorHandler(404, 'Listing not found'));
        if (!listing.localityName){
          // console.log("eeee");
          return next(errorHandler(404, 'This listing has no locality data yet'));
        }
            

        // fetch locality aggregated ratings
        const locality = await Locality.findOne({ localityName: listing.localityName });
        // console.log(listing);
        console.log(locality);
        console.log(listing._id);
        // fetch questions for this locality
        // const localityInsightId = 
        const questions = await Localityq.find({ localityInsightId: locality._id })
            .sort({ createdAt: -1 })
            .limit(20);
            console.log(questions);
        console.log("last");
        res.status(200).json({
            sellerInsight:  listing.sellerInsight,   // this specific listing's seller input
            locality:       locality,                 // aggregated ratings for whole neighbourhood
            questions:      questions,
        });

    } catch (error) {
        console.error('Error in getInsights:', error);
        next(error);
    }
};

// Vote on seller insights
// export const voteOnInsight = async (req, res, next) => {
//   try {
//     const { localityInsightId, category, voteType } = req.body;

//     if (!localityInsightId || !category || !voteType) {
//       return next(errorHandler(400, "Missing required fields"));
//     }

//     // Check if user already voted
//     const existingVote = await LocalityVote.findOne({
//       userId: req.user.id,
//       localityInsightId,
//       category,
//     });

//     const localityInsight = await LocalityInsight.findById(localityInsightId);
//     if (!localityInsight) {
//       return next(errorHandler(404, "Locality insight not found"));
//     }

//     if (existingVote) {
//       // Update existing vote
//       if (existingVote.voteType !== voteType) {
//         // Remove old vote count
//         localityInsight.communityScores[category][existingVote.voteType] -= 1;
//         // Add new vote count
//         localityInsight.communityScores[category][voteType] += 1;
//         existingVote.voteType = voteType;
//         await existingVote.save();
//       }
//     } else {
//       // Create new vote
//       await LocalityVote.create({
//         userId: req.user.id,
//         localityInsightId,
//         category,
//         voteType,
//       });
//       localityInsight.communityScores[category][voteType] += 1;
//     }

//     await localityInsight.save();
//     res.status(200).json({ message: "Vote recorded successfully" });
//   } catch (error) {
//     next(error);
//   }
// };

// Ask a question about locality
// export const askQuestion = async (req, res, next) => {
//   try {
//     const { localityInsightId, question, category } = req.body;
//     console.log("Ask question request:", {
//       localityInsightId,
//       question,
//       category,
//       userId: req.user?.id,
//     });

//     if (!localityInsightId || !question || !category) {
//       return next(errorHandler(400, "Missing required fields"));
//     }

//     const localityInsight = await LocalityInsight.findById(localityInsightId);
//     if (!localityInsight) {
//       return next(errorHandler(404, "Locality insight not found"));
//     }

//     const newQuestion = new Localityq({
//       localityInsightId,
//       question,
//       category,
//       askedBy: req.user.id,
//       askedByName: req.user.username || req.user.email || "Anonymous",
//     });

//     const savedQuestion = await newQuestion.save();
//     console.log("Question saved successfully:", savedQuestion._id);
//     res.status(201).json(savedQuestion);
//   } catch (error) {
//     console.error("Error asking question:", error);
//     next(error);
//   }
// };

export const askQuestion = async (req, res, next) => {
    try {
        const { localityInsightId, question, category } = req.body;

        if (!localityInsightId || !question || !category)
            return next(errorHandler(400, 'Missing required fields'));

        const locality = await Locality.findById( localityInsightId );
        if (!locality) return next(errorHandler(404, 'Locality not found'));
        console.log("now save it");
        const newQuestion = new Localityq({
            localityInsightId,
            question,
            category,
            askedBy:     req.user.id,
            askedByName: req.user.username || req.user.email || 'Anonymous',
        });

        const saved = await newQuestion.save();
        res.status(201).json(saved);

    } catch (error) {
        console.error('Error asking question:', error);
        next(error);
    }
};

// Answer a question
// export const answerQuestion = async (req, res, next) => {
//   try {
//     const { questionId, answer, userType } = req.body;

//     if (!questionId || !answer || !userType) {
//       return next(errorHandler(400, "Missing required fields"));
//     }

//     const question = await Localityq.findById(questionId);
//     if (!question) {
//       return next(errorHandler(404, "Question not found"));
//     }

//     const newAnswer = {
//       answer,
//       answeredBy: req.user.id,
//       answeredByName: req.user.username || req.user.email,
//       userType,
//       isVerified: userType === "Owner",
//     };

//     question.answers.push(newAnswer);
//     await question.save();

//     res.status(201).json({ message: "Answer added successfully" });
//   } catch (error) {
//     next(error);
//   }
// };

export const answerQuestion = async (req, res, next) => {
    try {
        const { questionId, answer, userType } = req.body;

        if (!questionId || !answer || !userType)
            return next(errorHandler(400, 'Missing required fields'));

        const question = await Localityq.findById(questionId);
        if (!question) return next(errorHandler(404, 'Question not found'));

        question.answers.push({
            answer,
            answeredBy:     req.user.id,
            answeredByName: req.user.username || req.user.email || 'Anonymous',
            userType,
        });

        await question.save();
        res.status(201).json({ message: 'Answer added successfully' });

    } catch (error) {
        next(error);
    }
};

// Get aggregated locality insights for nearby listings within 7km radius
// export const getNearbyLocalityInsights = async (req, res, next) => {
//   try {
//     const { listingId } = req.params;

//     // 1️⃣ Fetch target listing
//     const targetListing = await Listing.findById(listingId);
//     console.log("Target listing for nearby insights:", targetListing);

//     if (!targetListing) {
//       return next(errorHandler(404, "Listing not found"));
//     }

//     // 2️⃣ Validate GeoJSON coordinates
//     if (
//       !targetListing.location ||
//       !Array.isArray(targetListing.location.coordinates) ||
//       targetListing.location.coordinates.length !== 2
//     ) {
//       return next(
//         errorHandler(400, "Listing does not have valid location coordinates")
//       );
//     }

//     // 3️⃣ Build aggregation pipeline
//     const pipeline = [
//       {
//         $geoNear: {
//           near: {
//             type: "Point",
//             coordinates: targetListing.location.coordinates, // ✅ [lng, lat]
//           },
//           distanceField: "distance",
//           maxDistance: 7000, // ✅ correct syntax
//           spherical: true,
//           query: {
//             _id: { $ne: targetListing._id },
//             // ⚠️ Temporarily allow both approved & pending for testing
//             // status: "approved",
//             isActive: true,
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: "localityinsights",
//           localField: "_id",
//           foreignField: "listingId",
//           as: "localityInsight",
//         },
//       },
//       {
//         $unwind: {
//           path: "$localityInsight",
//           preserveNullAndEmptyArrays: false,
//         },
//       },
//       {
//         $unwind: {
//           path: "$localityInsight.sellerInsights",
//           preserveNullAndEmptyArrays: false,
//         },
//       },
//       {
//         $addFields: {
//           ratings: {
//             waterSupply: {
//               $switch: {
//                 branches: [
//                   { case: { $eq: ["$localityInsight.sellerInsights.waterSupply.rating", "Excellent"] }, then: 5 },
//                   { case: { $eq: ["$localityInsight.sellerInsights.waterSupply.rating", "Good"] }, then: 4 },
//                   { case: { $eq: ["$localityInsight.sellerInsights.waterSupply.rating", "Average"] }, then: 3 },
//                   { case: { $eq: ["$localityInsight.sellerInsights.waterSupply.rating", "Poor"] }, then: 2 },
//                   { case: { $eq: ["$localityInsight.sellerInsights.waterSupply.rating", "Very Poor"] }, then: 1 },
//                 ],
//                 default: null,
//               },
//             },
//             powerSupply: {
//               $switch: {
//                 branches: [
//                   { case: { $eq: ["$localityInsight.sellerInsights.powerSupply.rating", "Excellent"] }, then: 5 },
//                   { case: { $eq: ["$localityInsight.sellerInsights.powerSupply.rating", "Good"] }, then: 4 },
//                   { case: { $eq: ["$localityInsight.sellerInsights.powerSupply.rating", "Average"] }, then: 3 },
//                   { case: { $eq: ["$localityInsight.sellerInsights.powerSupply.rating", "Poor"] }, then: 2 },
//                   { case: { $eq: ["$localityInsight.sellerInsights.powerSupply.rating", "Very Poor"] }, then: 1 },
//                 ],
//                 default: null,
//               },
//             },
//           },
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           nearbyCount: { $sum: 1 },
//           avgWaterSupply: { $avg: "$ratings.waterSupply" },
//           avgPowerSupply: { $avg: "$ratings.powerSupply" },
//           groupedComments: {
//             $push: {
//               category: "Water Supply",
//               description: "$localityInsight.sellerInsights.waterSupply.description",
//               rating: "$localityInsight.sellerInsights.waterSupply.rating",
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           nearbyCount: 1,
//           averageRatings: {
//             waterSupply: { $round: ["$avgWaterSupply", 1] },
//             powerSupply: { $round: ["$avgPowerSupply", 1] },
//           },
//           groupedComments: 1,
//         },
//       },
//     ];

//     // 4️⃣ Run aggregation
//     const result = await Listing.aggregate(pipeline);

//     // 5️⃣ Handle empty results gracefully
//     if (result.length === 0) {
//       return res.status(200).json({
//         localityName:
//           targetListing.address?.split(",")[0]?.trim() || "Unknown Locality",
//         averageRatings: {
//           waterSupply: 0,
//           powerSupply: 0,
//           traffic: 0,
//           safety: 0,
//           schools: 0,
//           dailyNeeds: 0,
//         },
//         groupedComments: [],
//         nearbyCount: 0,
//         message: "No nearby listings with locality insights found within 7 km",
//       });
//     }

//     // 6️⃣ Round averages & send final response
//     const insights = result[0];
//     const roundedRatings = {};
//     for (const [key, value] of Object.entries(insights.averageRatings)) {
//       roundedRatings[key] = Math.round(value * 10) / 10;
//     }

//     res.status(200).json({
//       localityName: targetListing.localityName || "Unknown Locality",
//       nearbyCount: insights.nearbyCount,
//       averageRatings: roundedRatings,
//       groupedComments: insights.groupedComments,
//     });
//   } catch (error) {
//     console.error("Error fetching locality insights:", error);
//     next(errorHandler(500, "Failed to fetch locality insights"));
//   }
// };


// Get nearby localities
// export const getNearbyLocalities = async (req, res, next) => {
//   try {
//     const { localityName } = req.params;

//     // This is a simplified version - in production, you'd use geolocation APIs
//     const nearbyInsights = await LocalityInsight.find({
//       localityName: { $regex: localityName, $options: "i" },
//       localityScore: { $exists: true },
//     })
//       .select("localityName localityScore address")
//       .limit(5);

//     res.status(200).json(nearbyInsights);
//   } catch (error) {
//     next(error);
//   }
// };
