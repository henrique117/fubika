import { createBrowserRouter, Outlet, RouterProvider, useLocation, useOutlet } from 'react-router-dom';
import { BeatmapPage, ForgotPassPage, GlobalRankingPage, HomePage, HowToConnectPage, LoginPage, NotFoundPage, RedefinePassPage, RegisterPage, ProfilePage, ProfileTopPlays, ProfileRecent } from '../pages/pages.export'
import { AnimatePresence } from "framer-motion";
import PrivateRoute from './private';
import React from 'react';

const ProtectedLayout = () => {
    return (
        <PrivateRoute>
            <Outlet />
        </PrivateRoute>
    )
}

const AnimationWrapper = () => {
    const location = useLocation();
    const element = useOutlet();

    return (
        <AnimatePresence mode="wait">
            {/* O segredo é a 'key' baseada no pathname */}
            {element && React.cloneElement(element, { key: location.pathname })}
        </AnimatePresence>
    );
};

const router = createBrowserRouter([
    {
        path: '/',
        element: <AnimationWrapper />,
        children: [
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
                path: '/profile/:id',
                element: <ProfilePage />,
            },

            {
                path: '/profile/:id/top-plays',
                element: <ProfileTopPlays />
            },
            {
                path: '/profile/:id/recent',
                element: <ProfileRecent />
            },
            {
                element: <ProtectedLayout />,
                children: [
                    {
                        path: '/ranking',
                        element: <GlobalRankingPage />
                    },
                    {
                        path: '/beatmap/:id',
                        element: <BeatmapPage />
                    },
                ]
            },
            {
                path: '*',
                element: <NotFoundPage />
            }
        ]
    }
])

const AppRouter: React.FC = () => {
    return <RouterProvider router={router} />
}

export default AppRouter