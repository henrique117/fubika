import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ForgotPassPage, HomePage, LoginPage, RedefinePassPage, RegisterPage } from '../pages/pages.export'

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
    /* {
        path: '*',
        element: <NotFoundPage />
    } */
])

const AppRouter: React.FC = () => {
    return <RouterProvider router={router} />
}

export default AppRouter