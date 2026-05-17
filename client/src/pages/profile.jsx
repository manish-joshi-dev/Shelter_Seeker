import React from 'react'
import { useSelector } from 'react-redux'
import { useRef } from 'react';
import { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { updateUserSuccess,updateUserFailure,updateUserStart,deleteUserFailure,deleteUserStart,deleteUserSuccess,signOutUserStart,signOutUserFailure,signOutUserSuccess } from '../redux/user/userSlice';
import { persistor } from '../redux/store';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';

function profile() {
  const {curUser,loading,error} = useSelector((state)=>state.user);
  const fileRef = useRef(null);
  const [file,setFile] = useState(undefined);
  const [filePerc, setFilePerc] = useState(0);
  const [fileUploadError,setFileErrorUpload] = useState(false);
  const [formData,SetFormData] = useState({});
  const [updateSuccess,setUpdateSuccess] = useState(false);
  const [userListings, setUserListings] = useState([]);
  const navigate = useNavigate();
  const [showListingError,setShowListingError]= useState(null);

  
  const dispatch = useDispatch();
  // console.log(curUser);
  // console.log(filePerc);

  console.log(file);
  console.log(formData);
  console.log(new Date().getTime());


  
  useEffect(()=>{
    if(file) {
      handleFileUpload(file);
    }
  },[file])

  const handleFileUpload = async (file)=>{
    try {
      setFilePerc(1);
      setFileErrorUpload(false);
      const downloadURL = await uploadImageToCloudinary(file, {
        folder: "shelter-seeker/avatars",
      });
      SetFormData((prev) => ({ ...prev, avatar: downloadURL }));
      setFilePerc(100);
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      setFileErrorUpload(true);
      setFilePerc(0);
    }
  }
  const handleChange = (e)=>{
    // console.log(e.target.value);
    SetFormData({...formData,[e.target.id]:e.target.value});

  }
  const handleSumbit = async(e)=>{
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      
      const res = await fetch(`/api/user/update/${curUser._id}`,
        {
        method:'POST',
        headers : {
          'Content-Type':'application/json'
        },
        body: JSON.stringify(formData),

    });
    const data = await res.json();
    if(data.success===false){
      dispatch(updateUserFailure(data.message));
      return;
    }
    dispatch(updateUserSuccess(data));
    setUpdateSuccess(true);
    
      
    } catch (error) {
      dispatch(updateUserFailure(data.message));
    }
  }
  const handleDeleteUser = async(e)=>{
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    try {
      dispatch(deleteUserStart());
      const res = await fetch (`/api/user/delete/${curUser._id}`,{
        method:'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if(data.success===false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
      await persistor.purge(); // Clear localStorage
      navigate('/');

    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  }

  const handleSignOut = async(e)=>{
    e.preventDefault();
    try {
      dispatch(signOutUserStart());
      const res = await fetch ('/api/auth/signout', {
        credentials: 'include'
      });
      const data = await res.json();
      if(data.success===false){
        dispatch(signOutUserFailure(data.message));
        return;
      }
      dispatch(signOutUserSuccess(data));
      await persistor.purge(); // Clear localStorage
      navigate("/");
    } catch (error) {
      dispatch(signOutUserFailure(error.message))
    }
  }
  const handleShowListings = async(e)=>{
    e.preventDefault();
    try {
      const res = await fetch (`/api/user/listing/${curUser._id}`);
      const data = await res.json();
      if(data.success===false){
        setShowListingError(data.message);
        return;
      }
      setUserListings(data);
      console.log(data);
    } catch (error) {
      setShowListingError(error.message)
    }
  }

  const handleDeleteListing = async(listingId)=>{
    // e.preventDefault();
    try {
      console.log(listingId);
      console.log("hi")
      const res = await fetch (`/api/listing/delete/${listingId}`,
        {
          method:"DELETE",
        },
      );
      const data = await res.json();
      if(data.success===false) {
        console.log(data.message);
        setShowListingError(data.message);
        return;

      }
      setUserListings((prev) =>
        prev.filter((listing) => listing._id !== listingId)
      );
      // setUserListings();
      console.log(data);
    } catch (error) {
      setShowListingError(error.message);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900">Profile Settings</h1>
          <p className="mt-2 text-neutral-600">Manage your account and listings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">Personal Information</h2>
              
              <form onSubmit={handleSumbit} className="space-y-6">
                {/* Avatar Upload */}
                <div className="text-center">
                  <input 
                    onChange={(e) => setFile(e.target.files[0])} 
                    type="file" 
                    ref={fileRef} 
                    hidden 
                    accept="image/*" 
                  />
                  <div className="relative inline-block">
                    <img 
                      src={formData.avatar || curUser.avatar} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full mx-auto cursor-pointer border-4 border-white shadow-medium hover:shadow-large transition-shadow duration-200" 
                      onClick={() => fileRef.current.click()} 
                    />
                    <div className="absolute -bottom-2 -right-2 bg-primary-600 text-white rounded-full p-2 cursor-pointer hover:bg-primary-700 transition-colors duration-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  </div>
                  
                  <p className="text-sm text-neutral-600 mt-2">Click to change profile picture</p>
                  
                  {/* Upload Status */}
                  {fileUploadError ? (
                    <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      Error uploading image
                    </div>
                  ) : filePerc > 0 && filePerc < 100 ? (
                    <div className="mt-2 text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg">
                      Uploading {filePerc}%
                    </div>
                  ) : filePerc === 100 ? (
                    <div className="mt-2 text-sm text-secondary-600 bg-secondary-50 px-3 py-2 rounded-lg">
                      Image successfully updated
                    </div>
                  ) : null}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      placeholder="Enter username"
                      className="input-field"
                      defaultValue={curUser.username}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      placeholder="Enter email"
                      className="input-field"
                      defaultValue={curUser.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                    New Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    id="password"
                    placeholder="Enter new password"
                    className="input-field"
                    onChange={handleChange}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </div>
                  ) : (
                    "Update Profile"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link to="/listing" className="w-full btn-secondary py-3 text-center block">
                  Create New Listing
                </Link>
                <button 
                  onClick={handleShowListings}
                  className="w-full btn-outline py-3"
                >
                  View My Listings
                </button>
              </div>
            </div>

            {/* Admin Section */}
            {curUser && curUser.role === 'admin' && (
              <div className="card p-6 bg-purple-50 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                  </svg>
                  Admin Panel
                </h3>
                <div className="space-y-3">
                  <Link 
                    to="/admin/dashboard"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg text-center block transition-colors duration-200"
                  >
                    Admin Dashboard
                  </Link>
                  <div className="text-sm text-purple-700">
                    <p className="font-medium">Role: Administrator</p>
                    <p className="text-xs mt-1">Full system access and management privileges</p>
                  </div>
                </div>
              </div>
            )}

            {/* Account Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Account</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleSignOut}
                  className="w-full text-neutral-600 hover:text-neutral-800 py-2 text-left border-b border-neutral-200 last:border-b-0"
                >
                  Sign Out
                </button>
                <button 
                  onClick={handleDeleteUser}
                  className="w-full text-red-600 hover:text-red-800 py-2 text-left"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User Listings */}
        {userListings && userListings.length > 0 && (
          <div className="mt-8">
            <div className="card p-6">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Your Listings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userListings.map((listing) => (
                  <div key={listing._id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-medium transition-shadow duration-200">
                    <Link to={`/listing/${listing._id}`} className="block">
                      <img
                        src={listing.imageUrls[0]}
                        alt={listing.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h3 className="font-semibold text-neutral-900 mb-2 line-clamp-1">
                        {listing.name}
                      </h3>
                      <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                    </Link>
                    <div className="flex space-x-2">
                      <Link 
                        to={`/updatelisting/${listing._id}`}
                        className="flex-1 btn-outline py-2 text-center text-sm"
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDeleteListing(listing._id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        
        {updateSuccess && (
          <div className="mt-6 bg-secondary-50 border border-secondary-200 rounded-lg p-4">
            <p className="text-sm text-secondary-800">Profile updated successfully!</p>
          </div>
        )}
        
        {showListingError && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{showListingError}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default profile
