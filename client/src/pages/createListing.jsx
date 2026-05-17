import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import LocalityInsightsForm from "../components/LocalityInsightsForm";
import FraudDetectionBadge from "../components/FraudDetectionBadge";
import MapPickerOSM from "../components/MapPickerOSM";
import { uploadImageToCloudinary } from "../utils/cloudinaryUpload";


export default function CreateListing() {
  const { curUser } = useSelector((state) => state.user);
  const [files, setFiles] = useState([]); // array of File
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const [imageUploadError, setImageUploadError] = useState("");
  const [formData, setFormData] = useState({
    imageUrls: [], // Must contain URLs once uploaded
    name: "",
    description: "",
    address: "",
    latitude: null,
    longitude: null,
    type: "rent",
    bedRooms: 1,
    washrooms: 1,
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [localityInsights, setLocalityInsights] = useState(null);
  const [localityName, setLocalityName] = useState("");
  const [fraudDetectionResult, setFraudDetectionResult] = useState(null);

  const handleImageSubmit = (e) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      setImageUploadError("Select at least 1 image");
      return;
    }
    if (files.length > 0 && files.length + formData.imageUrls.length <= 6) {
      setUploading(true);
      setImageUploadError("");
      const promises = [];
      for (let i = 0; i < files.length; i++) {
        promises.push(storeImage(files[i]));
      }
      Promise.all(promises)
        .then((urls) => {
          setFormData((prev) => ({
            ...prev,
            imageUrls: prev.imageUrls.concat(urls),
          }));
          setUploading(false);
        })
        .catch((err) => {
          console.error("Upload error:", err);
          setImageUploadError(err.message || "Image upload failed");
          setUploading(false);
        });
    } else {
      setImageUploadError("You can only upload up to 6 images per listing");
    }
  };

  const storeImage = async (file) => {
    return uploadImageToCloudinary(file, {
      folder: "shelter-seeker/listings",
    });
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      if (formData.imageUrls.length < 1) {
        setError("You must upload at least one image");
        setLoading(false);
        return;
      }
      if (+formData.regularPrice < +formData.discountPrice) {
        setError("Discount price must be lower than regular price");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/listing/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userRef: curUser._id,
          sellerInsight: localityInsights,
          localityName,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        setError(data.message || "Failed to create listing");
        setLoading(false);
        return;
      }

      // Store fraud detection result if returned
      if (data.fraudDetection) {
        setFraudDetectionResult(data.fraudDetection);
      }

      // Create locality insights if provided (non-blocking)
      if (localityInsights && localityName) {
        try {
          await fetch("/api/locality-insights/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              listingId: data._id,
              sellerInsight: localityInsights,
              localityName,
            }),
          });
        } catch (insightError) {
          console.error("Error creating locality insights:", insightError);
        }
      }

      setLoading(false);

      // redirect after a short delay so user can see result
      setTimeout(() => navigate(`/listing/${data._id}`), 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  const handleLocalityInsightsChange = (insights, name) => {
    setLocalityInsights(insights);
    setLocalityName(name);
  };

  const handleChange = (e) => {
    const { id, type, value, checked } = e.target;
    if (id === "sell" || id === "rent") {
      setFormData((prev) => ({ ...prev, type: id }));
      return;
    }
    if (id === "parking" || id === "furnished" || id === "offer") {
      setFormData((prev) => ({ ...prev, [id]: checked }));
      return;
    }
    if (type === "number") {
      setFormData((prev) => ({ ...prev, [id]: Number(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [id]: value }));
    console.log(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create a Listing</h1>
          <p className="text-gray-600">Share your property with potential buyers and renters</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Name *
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder="e.g., Beautiful 3BR Apartment"
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  onChange={handleChange}
                  value={formData.name}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  id="address"
                  placeholder="Enter full address"
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  onChange={handleChange}
                  value={formData.address}
                  required
                />
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <MapPickerOSM
                defaultCenter={{ lat: 20.5937, lng: 78.9629 }}
                defaultZoom={5}
                onLocationChange={(loc) => {
                  setFormData((prev) => ({
                    ...prev,
                    address: loc.address || prev.address,
                    // latitude: loc.lat,
                    // longitude: loc.lng,
                    location: {
                      type: 'Point',
                      coordinates: [loc.lng, loc.lat]
                    } ,
                  }));
                }}
                height="420px"
              />
              <div className="text-sm text-gray-600">
                <span className="font-medium">Selected Coords:</span>{" "}
                {formData.location && formData.location.coordinates
                  ? `${formData.location.coordinates[0].toFixed(6)}, ${formData.location.coordinates[1].toFixed(6)}`
                  : "—"}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                id="description"
                placeholder="Describe your property in detail..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                onChange={handleChange}
                value={formData.description}
                required
              />
            </div>
          </div>

          {/* Property Details Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms *</label>
                <input
                  type="number"
                  id="bedRooms"
                  min="1"
                  max="10"
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={handleChange}
                  value={formData.bedRooms}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms *</label>
                <input
                  type="number"
                  id="washrooms"
                  min="1"
                  max="10"
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={handleChange}
                  value={formData.washrooms}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Regular Price *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="regularPrice"
                    min="50"
                    max="10000000"
                    className="w-full p-4 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={handleChange}
                    value={formData.regularPrice}
                    required
                  />
                </div>
                {formData.type === "rent" && <p className="text-sm text-gray-500 mt-1">per month</p>}
              </div>

              {formData.offer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discounted Price *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="discountPrice"
                      min="0"
                      max="10000000"
                      className="w-full p-4 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={handleChange}
                      value={formData.discountPrice}
                      required
                    />
                  </div>
                  {formData.type === "rent" && <p className="text-sm text-gray-500 mt-1">per month</p>}
                </div>
              )}
            </div>
          </div>

          {/* Property Type & Features Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Property Type & Features</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Property Type *</label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      id="sell"
                      name="type"
                      className="w-5 h-5 text-blue-600"
                      onChange={handleChange}
                      checked={formData.type === "sell"}
                    />
                    <span className="text-lg">For Sale</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      id="rent"
                      name="type"
                      className="w-5 h-5 text-blue-600"
                      onChange={handleChange}
                      checked={formData.type === "rent"}
                    />
                    <span className="text-lg">For Rent</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Features</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input type="checkbox" id="parking" className="w-5 h-5 text-blue-600" onChange={handleChange} checked={formData.parking} />
                    <span className="text-lg">Parking Available</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input type="checkbox" id="furnished" className="w-5 h-5 text-blue-600" onChange={handleChange} checked={formData.furnished} />
                    <span className="text-lg">Furnished</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input type="checkbox" id="offer" className="w-5 h-5 text-blue-600" onChange={handleChange} checked={formData.offer} />
                    <span className="text-lg">Special Offer</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Property Images</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images *</label>
                <p className="text-sm text-gray-500 mb-4">The first image will be the cover photo. Maximum 6 images allowed.</p>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) => setFiles(Array.from(e.target.files))}
                  />
                  <button
                    type="button"
                    onClick={handleImageSubmit}
                    disabled={uploading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </div>

              {imageUploadError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{imageUploadError}</p>
                </div>
              )}

              {formData.imageUrls.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.imageUrls.map((url, index) => (
                      <div key={`${url}-${index}`} className="relative group">
                        <img src={url} alt={`Property image ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                        {index === 0 && <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">Cover</span>}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Locality Insights Section */}
          <LocalityInsightsForm onInsightsChange={handleLocalityInsightsChange} />

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message with Fraud Detection */}
          {fraudDetectionResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-green-800">Listing Created Successfully!</h3>
              </div>

              <div className="mb-4">
                <p className="text-green-700 mb-2">Your listing has been created and analyzed by our AI fraud detection system.</p>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">Fraud Detection Status:</span>
                  <FraudDetectionBadge fraudDetection={fraudDetectionResult} />
                </div>
              </div>

              {fraudDetectionResult.isFraudulent && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 text-sm"><strong>Note:</strong> This listing has been flagged for review. Our team will verify the details before it goes live.</p>
                </div>
              )}

              <p className="text-sm text-gray-600">Redirecting to your listing...</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <button type="submit" disabled={loading || uploading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-12 py-4 rounded-lg text-lg font-semibold transition-colors">
              {loading ? "Creating Listing..." : "Create Listing"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
