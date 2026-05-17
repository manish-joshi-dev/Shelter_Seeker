import React from "react";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate,useParams } from "react-router-dom";
import MapPickerOSM from "../components/MapPickerOSM";
import { uploadImageToCloudinary } from "../utils/cloudinaryUpload";

export default function updateListing() {
  const { curUser } = useSelector((state) => state.user);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState();
  const navigate = useNavigate();
  const params = useParams();
  const [imageUploadError, setImageUploadError] = useState("");
  const [formData, setFormData] = useState({
    imageUrls: [], // Must contain URLs once uploaded
    name: "",
    description: "", // Update with a meaningful description
    address: "", // Update with a valid address
    latitude: null,
    longitude: null,
    type: "",
    bedRooms: 1, // Updated field name
    washrooms: 1,
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
//   useEffect(async()=>{
//     const res = await fetch (`/api/listing/get/${params.id}`);
//     const data = await res.json();
//     if(data.success===false){
//         setError(data.message);
//         return;
//     }
//     setFormData(data);
//   },[]);
useEffect(() => {
    const fetchListing = async () => {
      const listingId = params.id;
      const res = await fetch(`/api/listing/get/${listingId}`);
      const data = await res.json();
      if (data.success === false) {
        setError(data.message);
        return;
      }
      setFormData(data);
    };

    fetchListing();
  }, []);

  console.log(files);
  const handleImageSubmit = (e) => {
    // console.log("sdf");
    e.preventDefault();
    if (files.length == 0) setImageUploadError("select atleast 1 image");
    else if (files.length > 0 && files.length + formData.imageUrls.length < 7) {
      setUploading(true);
      setImageUploadError("");
      const promises = [];
      for (let i = 0; i < files.length; i++) {
        promises.push(storeImage(files[i]));
      }
      Promise.all(promises)
        .then((urls) => {
          setFormData({
            ...formData,
            imageUrls: formData.imageUrls.concat(urls),
          });
          setUploading(false);
          setImageUploadError("");
        })
        .catch((err) => {
          setImageUploadError(err.message || "Image upload failed");
          setUploading(false);
          console.log(err);
        });
    } else {
      setImageUploadError("You can only upload 6 images per listing");
    }
  };

  const storeImage = async (file) => {
    return uploadImageToCloudinary(file, {
      folder: "shelter-seeker/listings",
    });
  };
  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });
    // setFiles([])
  };

  const handleSumbit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
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
      const body = JSON.stringify({
        ...formData,
        userRef: curUser._id,
      });
      console.log(body);
      const res = await fetch(`/api/listing/update/${params.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userRef: curUser._id,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success === false) {
        setError(data.message);
      }
      navigate(`/listing/${formData._id}`);
    } catch (error) {
      setError(error.message);
      console.log(error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    if (e.target.id === "sell" || e.target.id === "rent") {
      setFormData({ ...formData, type: e.target.id });
    }
    if (
      e.target.id === "parking" ||
      e.target.id === "furnished" ||
      e.target.id === "offer"
    ) {
      setFormData({
        ...formData,
        [e.target.id]: e.target.checked,
      });
    }
    if (
      e.target.type === "number" ||
      e.target.type === "text" ||
      e.target.type === "textarea"
    ) {
      setFormData({
        ...formData,
        [e.target.id]: e.target.value,
      });
    }
  };

  return (
    <div>
      <main className="max-w-5xl mx-auto my-5 ">
        <h1 className="text-4xl text-center my-10 font-bold font-sans">
          Edit a Listing
        </h1>
        <form
          onSubmit={handleSumbit}
          action=""
          className="flex flex-col sm:flex-row gap-7"
        >
          <div>
            <div className="flex flex-col">
              <input
                type="text"
                placeholder="name"
                id="name"
                className="mb-7 p-3 text-xl"
                onChange={handleChange}
                value={formData.name}
              />
              <textarea
                name=""
                id="description"
                placeholder="Description"
                className="p-3 text-xl"
                onChange={handleChange}
                value={formData.description}
              ></textarea>
              <input
                type="text"
                placeholder="address"
                id="address"
                className="my-7 p-3 text-xl"
                onChange={handleChange}
                value={formData.address}
              />
            </div>
            <div className="my-4 grid gap-3">
              <MapPickerOSM
                defaultCenter={
                  formData.latitude && formData.longitude
                    ? { lat: Number(formData.latitude), lng: Number(formData.longitude) }
                    : { lat: 20.5937, lng: 78.9629 }
                }
                defaultZoom={formData.latitude && formData.longitude ? 14 : 5}
                onLocationChange={(loc) => {
                  setFormData((prev) => ({
                    ...prev,
                    address: loc.address || prev.address,
                    latitude: loc.lat,
                    longitude: loc.lng,
                  }));
                }}
                height="380px"
              />
              <div className="text-sm text-gray-600">
                <span className="font-medium">Selected Coords:</span>{" "}
                {formData.latitude && formData.longitude
                  ? `${Number(formData.latitude).toFixed(6)}, ${Number(formData.longitude).toFixed(6)}`
                  : '—'}
              </div>
            </div>
            <div className="flex flex-row mx-auto gap-5 flex-wrap mb-7 mt-2">
              <div className="flex gap-3">
                <input
                  type="checkbox"
                  id="sell"
                  className="w-5"
                  onChange={handleChange}
                  checked={formData.type === "sell"}
                />
                <span className=" text-xl">Sell</span>
              </div>
              <div className="flex gap-3">
                <input
                  type="checkbox"
                  id="rent"
                  className="w-5"
                  onChange={handleChange}
                  checked={formData.type === "rent"}
                />
                <span className="text-xl">Rent</span>
              </div>
              <div className="flex gap-3">
                <input
                  id="parking"
                  type="checkbox"
                  className="w-5"
                  onChange={handleChange}
                  checked={formData.parking}
                />
                <span className="text-xl">Parking</span>
              </div>
              <div className="flex gap-3">
                <input
                  id="furnished"
                  type="checkbox"
                  className="w-5"
                  onChange={handleChange}
                  checked={formData.furnished}
                />
                <span className="text-xl">Furnished</span>
              </div>
              <div className="flex gap-3">
                <input
                  id="offer"
                  type="checkbox"
                  className="w-5"
                  onChange={handleChange}
                  checked={formData.offer}
                />
                <span className="text-xl">Offer</span>
              </div>
            </div>
            <div className="flex gap-5 mb-7">
              <div className="flex gap-3">
                <input
                  id="bedRooms"
                  type="number"
                  className="p-3 border rounded-lg w-16"
                  onChange={handleChange}
                  value={formData.bedRooms}
                />
                <span className="text-xl my-auto">Bedrooms</span>
              </div>

              <div className="flex gap-2">
                <input
                  id="washrooms"
                  type="number"
                  className="border p-3 rounded-lg w-16"
                  onChange={handleChange}
                  value={formData.washrooms}
                />
                <span className="text-xl my-auto">WashRooms</span>
              </div>
            </div>
            <div className="flex gap-4 ">
              <input
                type="number"
                id="regularPrice"
                className="rounded-lg "
                onChange={handleChange}
                value={formData.regularPrice}
                min="0"
                max="10000000"
                required
              />
              <div className="flex flex-col">
                <span className="text-xl">Regular Price</span>
                <span>($/Month)</span>
              </div>
            </div>
            {formData.offer && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="discountPrice"
                  min="0"
                  max="10000000"
                  required
                  className="p-3 border border-gray-300 rounded-lg"
                  onChange={handleChange}
                  value={formData.discountPrice}
                />
                <div className="flex flex-col items-center">
                  <p>Discounted price</p>
                  <span className="text-xs">($ / month)</span>
                </div>
              </div>
            )}
          </div>
          <div>
            <div>
              <p className="text-xl">
                Images:{" "}
                <span className="font-semibold text-lg">
                  The first image will be the cover (Max : 6)
                </span>
              </p>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="p-3 border my-4"
                  onChange={(e)=> setFiles(e.target.files)}
                />
                <button
                  onClick={handleImageSubmit}
                  className="bg-green-600 p-3 rounded-lg text-white"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>

            <p>{imageUploadError ? imageUploadError : ""}</p>
            {formData.imageUrls.length > 0 &&
              formData.imageUrls.map((url, index) => (
                <div
                  key={url}
                  className="flex justify-between p-3 border items-center"
                >
                  <img
                    src={url}
                    alt="listing image"
                    className="w-20 h-20 object-contain rounded-lg"
                  />
                  <button
                  
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="p-3 text-red-700 rounded-lg uppercase hover:opacity-75"
                  >
                    Delete
                  </button>
                </div>
              ))}
            {error && (
              <div>
                <p>{error}</p>
              </div>
            )}
            <button
              disabled={loading || uploading}
              className="bg-slate-700 text-white max-w-[100%] my-3 p-4 text-2xl w-[100%] hover:opacity-90"
            >
              {loading ? "Loading..." : "Edit Listing"}
            </button>
            
          </div>
        </form>
      </main>
    </div>
  );
}
