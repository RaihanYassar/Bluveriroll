import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '../components/RootLayout';
import ProtectedRoute from '../components/ProtectedRoute';

import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import AnimeDetailPage from '../pages/AnimeDetailPage';
import WatchlistPage from '../pages/WatchlistPage';
import MoodSyncPage from '../pages/MoodSyncPage';
import ProfilePage from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'anime/:id',
        element: <AnimeDetailPage />,
      },
      {
        path: 'moodsync',
        element: <MoodSyncPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'watchlist',
        element: (
          <ProtectedRoute>
            <WatchlistPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default router;
