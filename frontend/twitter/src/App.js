import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './pages/Login';
import Register from './pages/Register';
import RenderMyProfile from './pages/RenderMyProfile';
import RenderProfile from './pages/RenderProfile';
import RenderTweet from './pages/RenderTweet';
import RenderFeeds from './pages/RenderFeeds';
import ProtectedRoute from './routes/protectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path='/myprofile' element={<RenderMyProfile />} />
          <Route path='/profile/:userId' element={<RenderProfile />} />
          <Route path='/tweet/:tweetId' element={<RenderTweet />} />
          <Route path='/feeds' element={<RenderFeeds />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
