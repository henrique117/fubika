import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { BeatmapPage, ForgotPassPage, GlobalRankingPage, HomePage, HowToConnectPage, LoginPage, NotFoundPage, RedefinePassPage, RegisterPage } from '../pages/pages.export'

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
        path: '/ranking',
        element: <GlobalRankingPage />
    },
    {
        path: '/beatmap',
        element: <BeatmapPage />
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