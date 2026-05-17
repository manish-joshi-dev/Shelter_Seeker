import ngeohash from 'ngeohash';
import Listing from '../model/listing.model.js';
import Locality from '../model/locality.model.js';
// converts [lng, lat] GeoJSON coordinates to geohash



export function computeGeohash(coordinates) {
    const [lng, lat] = coordinates;  // GeoJSON is [longitude, latitude]
    return ngeohash.encode(lat, lng, 6);  // precision 6 = ~1.2km cell
}

// add this to utils/locality.js



const ratingToScore = {
    'Excellent': 5, 'Good': 4, 'Average': 3, 'Poor': 2, 'Very Poor': 1
};

const scoreToRating = (score) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Average';
    if (score >= 1.5) return 'Poor';
    return 'Very Poor';
};

export async function recomputeLocalityRatings(localityName) {
    const listings = await Listing.find({ localityName });
    const categories = ['waterSupply', 'powerSupply', 'traffic',
                        'safety', 'schools', 'dailyNeeds'];

    const updatedRatings = {};
    let categoryScoreSum = 0;

    for (const cat of categories) {
        const scores = listings
            .map(l => ratingToScore[l.sellerInsight?.[cat]?.rating])
            .filter(Boolean);

        const avg = scores.length
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0;

        updatedRatings[`ratings.${cat}.score`]                = parseFloat(avg.toFixed(1));
        updatedRatings[`ratings.${cat}.rating`]               = scoreToRating(avg);
        updatedRatings[`ratings.${cat}.totalSellerResponses`]  = scores.length;

        categoryScoreSum += avg;
    }

    const overallScore = parseFloat(
        ((categoryScoreSum / categories.length / 5) * 10).toFixed(1)
    );

    await Locality.findOneAndUpdate(
        { localityName },
        {
            $set: {
                ...updatedRatings,
                overallScore,
                totalListings: listings.length
            }
        },
        { upsert: true, new: true }
    );
}

export async function getLocalityName(coordinates) {
    const [lng, lat] = coordinates;
    console.log(lng);
    console.log(lat);
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

    const res = await fetch(url, {
        headers: { 'User-Agent': 'your-property-app' }  // Nominatim requires this
    });

    if (!res.ok) return 'Unknown';

    const data = await res.json();

    // Nominatim returns different fields depending on area density.
    // Prefer the most specific locality field available.
    const address = data?.address ?? {};
    const locality = (
        address.suburb ||
        address.neighbourhood ||
        address.village ||
        address.town ||
        address.city_district ||
        address.city ||
        address.hamlet ||
        address.locality ||
        address.municipality ||
        address.county ||
        address.state_district ||
        address.state ||
        address.region
    );
    console.log("rrrr");
    if (locality) return locality;
    if (typeof data.display_name === 'string') {
        return data.display_name.split(',')[0].trim();
    }

    return 'Unknown';
}
