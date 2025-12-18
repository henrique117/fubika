import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { HomePage } from '../pages/pages.export'

const router = createBrowserRouter([
    {
        path: '/',
        element: <HomePage />
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