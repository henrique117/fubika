import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { HomePage, LoginPage, RegisterPage } from '../pages/pages.export'

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
    /* {
        path: '*',
        element: <NotFoundPage />
    } */
])

const AppRouter: React.FC = () => {
    return <RouterProvider router={router} />
}

export default AppRouter