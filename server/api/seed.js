import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Listing from "./model/listing.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const TOTAL_LISTINGS = 10000;
const BATCH_SIZE = 500;
const SHARED_IMAGE_URL =

  "https://res.cloudinary.com/gc25webathon/image/upload/v1775887553/shelter-seeker/listings/rr9hc7roytp7ve3snkcg.jpg";

const sellerIds = [
  "seed-seller-001",
  "seed-seller-002",
  "seed-seller-003",
  "seed-seller-004",
  "seed-seller-005",
];

const cities = [
  {
    city: "Bengaluru",
    areas: ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "BTM Layout"],
    center: [77.5946, 12.9716],
  },
  {
    city: "Mumbai",
    areas: ["Andheri", "Bandra", "Powai", "Thane", "Dadar"],
    center: [72.8777, 19.076],
  },
  {
    city: "Delhi",
    areas: ["Saket", "Rohini", "Dwarka", "Karol Bagh", "Lajpat Nagar"],
    center: [77.1025, 28.7041],
  },
  {
    city: "Pune",
    areas: ["Hinjewadi", "Kothrud", "Viman Nagar", "Baner", "Wakad"],
    center: [73.8567, 18.5204],
  },
  {
    city: "Hyderabad",
    areas: ["Gachibowli", "Madhapur", "Kondapur", "Banjara Hills", "Kukatpally"],
    center: [78.4867, 17.385],
  },
  {
    city: "Chennai",
    areas: ["Adyar", "Velachery", "T Nagar", "Anna Nagar", "Porur"],
    center: [80.2707, 13.0827],
  },
];

const propertyTypes = ["Studio", "Apartment", "PG Room", "Independent House", "Shared Flat"];
const descriptions = [
  "Well connected property close to public transport, grocery stores, and daily essentials.",
  "Clean and practical home suitable for students, working professionals, and small families.",
  "Peaceful locality with easy access to markets, hospitals, schools, and main roads.",
  "Move-in ready accommodation with useful amenities and a convenient neighborhood.",
  "Budget friendly stay in a residential area with good commute options nearby.",
];

const pick = (items, index) => items[index % items.length];

const makeCoordinateOffset = (index, spread = 0.18) => {
  const normalized = ((index * 37) % 1000) / 1000;
  return (normalized - 0.5) * spread;
};

const createListing = (index) => {
  const cityData = pick(cities, index);
  const area = pick(cityData.areas, Math.floor(index / cities.length));
  const propertyType = pick(propertyTypes, index);
  const isRent = index % 5 !== 0;
  const offer = index % 4 === 0;
  const bedRooms = (index % 4) + 1;
  const washrooms = Math.min(3, Math.max(1, bedRooms - (index % 2)));
  const regularPrice = isRent
    ? 6000 + (index % 90) * 500 + bedRooms * 1500
    : 1800000 + (index % 200) * 25000 + bedRooms * 300000;
  const discountPrice = offer ? Math.round(regularPrice * 0.92) : 0;
  const longitude = Number((cityData.center[0] + makeCoordinateOffset(index)).toFixed(6));
  const latitude = Number((cityData.center[1] + makeCoordinateOffset(index + 17)).toFixed(6));

  return {
    name: `${propertyType} in ${area} #${index + 1}`,
    description: pick(descriptions, index),
    address: `${100 + (index % 900)}, ${area}, ${cityData.city}, India`,
    regularPrice,
    discountPrice,
    bedRooms,
    furnished: index % 3 !== 0,
    parking: index % 2 === 0,
    type: isRent ? "rent" : "sale",
    offer,
    imageUrls: [SHARED_IMAGE_URL],
    washrooms,
    userRef: pick(sellerIds, index),
    status: "approved",
    isActive: true,
    location: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    fraudDetection: {
      fraudScore: 0,
      isFraudulent: false,
      anomalyScore: 0,
      detectedAt: new Date(),
    },
  };
};

const createBatch = (start, size) =>
  Array.from({ length: size }, (_, batchIndex) => createListing(start + batchIndex));

const seedDB = async () => {
  if (!process.env.MONGO) {
    throw new Error("MONGO is missing in server/.env");
  }

  await mongoose.connect(process.env.MONGO);
  console.log("Connected to MongoDB");

  await Listing.deleteMany({ userRef: { $in: sellerIds } });
  console.log("Removed old seeded listings");

  for (let start = 0; start < TOTAL_LISTINGS; start += BATCH_SIZE) {
    const size = Math.min(BATCH_SIZE, TOTAL_LISTINGS - start);
    await Listing.insertMany(createBatch(start, size), { ordered: false });
    console.log(`Inserted ${start + size}/${TOTAL_LISTINGS} listings`);
  }

  console.log("Database seeded successfully");
};

seedDB()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  });
