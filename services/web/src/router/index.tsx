import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { BeatmapPage, ForgotPassPage, GlobalRankingPage, HomePage, HowToConnectPage, LoginPage, NotFoundPage, RedefinePassPage, RegisterPage, ProfilePage, ProfileTopPlaysPage, ProfileRecentPlaysPage, ProfileAchievementsPage, MpLinkPage } from '../pages/pages.export'
import PrivateRoute from './private'

const ProtectedLayout = () => {
    return (
        <PrivateRoute>
            <Outlet />
        </PrivateRoute>
    )
}

const router = createBrowserRouter([
    {
        path: '/',
        element: <HomePage />
    },
    {
        path: '/login',
        element: <LoginPage />
    },
    {
        path: '/register',
        element: <RegisterPage />
    },
    {
        path: '/forgotpass',
        element: <ForgotPassPage />
    },
    {
        path: '/redefinepass',
        element: <RedefinePassPage />
    },
    {
        path: '/howtoconnect',
        element: <HowToConnectPage />
    },
    {
        path: '/profile',
        element: <ProfilePage />
    },
    {
        path: '/profile/:id',
        element: <ProfilePage />
    },
    {
        path: '/top-plays',
        element: <ProfileTopPlaysPage />
    },
    {
        path: '/profile/:id/top-plays',
        element: <ProfileTopPlaysPage />
    },
    {
        path: '/recent-plays',
        element: <ProfileRecentPlaysPage />
    },
    {
        path: '/profile/:id/recent-plays',
        element: <ProfileRecentPlaysPage />
    },
    {
        path: '/achievements',
        element: <ProfileAchievementsPage />
    },
    {
        path: '/conquistas',
        element: <ProfileAchievementsPage />
    },
    {
        path: '/profile/:id/achievements',
        element: <ProfileAchievementsPage />
    },
    {
        path: '/mplink',
        element: <MpLinkPage />
    },
    {
        path: '/mplink/:id',
        element: <MpLinkPage />
    },
    {
        path: '/mp-links',
        element: <MpLinkPage />
    },
    {
        path: '/matches',
        element: <MpLinkPage />
    },
    {
        path: '/beatmap',
        element: <BeatmapPage />
    },
    {
        path: '/beatmaps',
        element: <BeatmapPage />
    },
    {
        path: '/beatmap/:id',
        element: <BeatmapPage />
    },
    {
        element: <ProtectedLayout />,
        children: [
            {
                path: '/ranking',
                element: <GlobalRankingPage />
            },
        ]
    },
    {
        path: '*',
        element: <NotFoundPage />
    }
])

const AppRouter: React.FC = () => {
    return <RouterProvider router={router} />
}

export default AppRouter