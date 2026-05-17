import React from 'react'
import {GoogleAuthProvider,getAuth, signInWithPopup} from 'firebase/auth'

import {app} from '../firebase'
import { useDispatch } from 'react-redux'
import { signInSuccess } from '../redux/user/userSlice'
import { useNavigate } from 'react-router-dom'

function OAuth() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const handleGoogleClick = async ()=>{
        try {
            const provider = new GoogleAuthProvider();
            const auth = getAuth(app);
            const result = await signInWithPopup(auth,provider);
            console.log('Firebase auth result:', result);
            
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
            const res = await fetch(`${backendUrl}/api/auth/google`,{
                method:'POST',
                headers:{
                    'Content-Type':'application/json'
                },
                credentials: 'include', // Important for cookies
                body : JSON.stringify({
                    name: result.user.displayName,
                    email: result.user.email,
                    photo: result.user.photoURL
                })
            });
            
            const data = await res.json();
            console.log('Backend response:', data);
            
            if (data.success && data.user) {
                dispatch(signInSuccess(data.user));
                navigate('/');
            } else {
                console.error('Authentication failed:', data.message);
                alert('Authentication failed: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Could not sign in with Google:', error);
            alert('Could not sign in with Google. Please try again.');
        }
    }
  return (
    <div>
      <button onClick={handleGoogleClick} type='button' className="bg-red-700 text-white uppercase p-4 rounded-xl text-xl hover:opacity-85 w-[100%] ">
            Continue With Google
          </button>
    </div>
  )
}

export default OAuth
