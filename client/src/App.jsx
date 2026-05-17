import React from 'react';
import {BrowserRouter,Routes,Route} from 'react-router-dom';
import Search from './pages/search';
import Header from './components/header';
import Home from "./pages/home";
import About  from "./pages/about";
import  Profile from "./pages/profile";
import  SignIn from "./pages/signin"  ;
import  SignUp from "./pages/signup";
import  Updatelisting from "./pages/updateListing";
import PrivateRoute from './components/privateRoute';
import CreateListing from './pages/createListing';  
import Lds from './pages/listing';
import MyChats from './pages/myChats';
import LocalInsights from './pages/localInsights';
import AdminDashboard from './pages/adminDashboard';











export default function App() {
  return (
    <BrowserRouter>
    {/* <Routes> */}
    <Header/>
    <Routes >
      <Route path="/" element={<Home/>}></Route>
      <Route path="/about" element={<About/>}></Route>
      {/* <Route path="/profile" element={<Profile/>}></Route> */}
      <Route path='/listing/:id' element={<Lds/>} ></Route>
      <Route path='/search' element={<Search/>}></Route>
      
      <Route element={<PrivateRoute/>}  >
        <Route path='/profile' element={<Profile/>} ></Route>
        <Route path='/listing/:id/insights' element={<LocalInsights/>} ></Route>
        <Route path='/listing' element={<CreateListing/>} ></Route>
        <Route path='/updatelisting/:id' element={<Updatelisting/>}></Route>
      </Route>
      <Route element={<PrivateRoute/>}>
        <Route path='/mychats' element={<MyChats/>}></Route>
        <Route path='/admin/dashboard' element={<AdminDashboard/>}></Route>
      </Route>
      <Route path="/signin" element={<SignIn/>}></Route>
      <Route path="/signup" element={<SignUp/>}></Route>

    </Routes>
    </BrowserRouter>
    
    
  )
}
