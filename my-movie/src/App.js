import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import NavbarMobile from './components/Navbar/NavbarMobile';
import Home from './pages/Home';
import FeedPage from './pages/feedPage';
import RecommendedPage from './pages/RecommendedPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import ShortsPage from './pages/ShortsPage';
import MusicPage from './pageMusic/MusicPage';
import MusicShortsPage from './pageMusic/MusicShortsPage';
import MusicDetail from './pageMusic/MusicDetail';
import VideoPage from './pageMusic/VideoPage';
import MusicAlbumDetail from './pageMusic/MusicAlbumDetail';
import MusicMorePage from './pageMusic/MusicMorePage';
import ArtistDetail from './pageMusic/ArtistDetail';
import ActorsPage from './pages/ActorsPage';
import LikeHistoryPage from './pages/LikeHistoryPage';
import RatingPage from './pages/RatingPage';
import TrailerPage from './pages/TrailerPage';
import MovieDetail from './components/MovieDetail/MovieDetail';
import { ViewedMoviesProvider } from './context/ViewedMoviesContext';
import { ContentLanguageProvider } from './context/ContentLanguageContext';
import { MusicPlayerProvider } from './context/MusicPlayerContext';
import { LoadingProvider } from './context/LoadingContext';
import { store, persistor } from './store/store';
import './App.css';

function MusicDetailWithKey() {
  return <MusicDetail />;
}

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ViewedMoviesProvider>
            <Router>
              <ContentLanguageProvider>
                <MusicPlayerProvider>
                  <LoadingProvider>
                    <div className="App">
                      <Navbar />
                      <main className="App-main">
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/feed" element={<FeedPage />} />
                          <Route path="/category/:categoryId" element={<RecommendedPage />} />
                          <Route path="/similar-movies/:movieId" element={<RecommendedPage />} />
                          <Route path="/movie/:id" element={<MovieDetail />} />
                          <Route path="/movie/:id/trailer" element={<TrailerPage />} />
                          <Route path="/recommended" element={<RecommendedPage />} />
                          <Route path="/wishlist" element={<WishlistPage />} />
                          <Route path="/profile" element={<ProfilePage />} />
                          <Route path="/shorts" element={<ShortsPage />} />
                          <Route path="/music" element={<MusicPage />} />
                          <Route path="/music/shorts" element={<MusicShortsPage />} />
                          <Route path="/music/more" element={<MusicMorePage />} />
                          <Route path="/music/more/:section" element={<MusicMorePage />} />
                          <Route path="/music/artist/:id" element={<ArtistDetail />} />
                          <Route path="/music/album/:id" element={<MusicAlbumDetail />} />
                          <Route path="/music/video/:id" element={<VideoPage />} />
                          <Route path="/music/:id" element={<MusicDetailWithKey />} />
                          <Route path="/actor/:id" element={<ActorsPage />} />
                          <Route path="/like-history" element={<LikeHistoryPage />} />
                          <Route path="/rating-page" element={<RatingPage />} />
                        </Routes>
                      </main>
                      <NavbarMobile />
                    </div>
                  </LoadingProvider>
                </MusicPlayerProvider>
              </ContentLanguageProvider>
            </Router>
          </ViewedMoviesProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
