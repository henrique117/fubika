import { createBrowserRouter, Outlet, RouterProvider, type LoaderFunctionArgs } from 'react-router-dom'
import { BeatmapPage, ForgotPassPage, GlobalRankingPage, HomePage, HowToConnectPage, LoginPage, NotFoundPage, RedefinePassPage, RegisterPage, ProfilePage, ProfileTopPlaysPage, ProfileRecentPlaysPage, ProfileAchievementsPage, MpLinkPage } from '../pages/pages.export'
import PrivateRoute from './private'
import { TopProgressBar } from '../components/components.export'
import {
    fetchActivePlayer,
    fetchBeatmapWithSetFromMirror,
    fetchRankingPageCached,
    fetchUserRecent,
    hasApiAuth,
    hydrateScoresBeatmaps,
} from '../services/profileData'

const ProtectedLayout = () => {
    return (
        <PrivateRoute>
            <Outlet />
        </PrivateRoute>
    )
}

const RootLayout = () => {
    return (
        <>
            <TopProgressBar />
            <Outlet />
        </>
    )
}

const RootHydrateFallback = () => {
    return (
        <div style={{ minHeight: '100vh', background: '#2c2825' }}>
            <TopProgressBar forceActive />
        </div>
    )
}

const profileLoader = async ({ params }: LoaderFunctionArgs) => {
    if (!hasApiAuth()) return null
    const resolved = await fetchActivePlayer(params.id, { preferMe: !params.id })
    if (resolved && (!resolved.player.top_200 || resolved.player.top_200.length === 0)) {
        await fetchUserRecent(resolved.player.id, 10)
    }
    return null
}

const topPlaysLoader = async ({ params }: LoaderFunctionArgs) => {
    if (!hasApiAuth()) return null
    await fetchActivePlayer(params.id, { hydrateCount: 50 })
    return null
}

const recentPlaysLoader = async ({ params }: LoaderFunctionArgs) => {
    if (!hasApiAuth()) return null
    const resolved = await fetchActivePlayer(params.id, { hydrateCount: 0 })
    if (resolved) {
        const recent = await fetchUserRecent(resolved.player.id, 50)
        if (recent.length === 0 && resolved.player.top_200?.length) {
            await hydrateScoresBeatmaps(resolved.player.top_200.slice(0, 50), 50)
        }
    }
    return null
}

const achievementsLoader = async ({ params }: LoaderFunctionArgs) => {
    if (!hasApiAuth()) return null
    await fetchActivePlayer(params.id, { hydrateCount: 0 })
    return null
}

const beatmapLoader = async ({ params }: LoaderFunctionArgs) => {
    if (params.id) {
        await fetchBeatmapWithSetFromMirror(params.id)
    }
    return null
}

const rankingLoader = async () => {
    await fetchRankingPageCached(0, 1, '')
    return null
}

const router = createBrowserRouter([
    {
        element: <RootLayout />,
        HydrateFallback: RootHydrateFallback,
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
                path: '/profile',
                element: <ProfilePage />,
                loader: profileLoader,
            },
            {
                path: '/profile/:id',
                element: <ProfilePage />,
                loader: profileLoader,
            },
            {
                path: '/top-plays',
                element: <ProfileTopPlaysPage />,
                loader: topPlaysLoader,
            },
            {
                path: '/profile/:id/top-plays',
                element: <ProfileTopPlaysPage />,
                loader: topPlaysLoader,
            },
            {
                path: '/recent-plays',
                element: <ProfileRecentPlaysPage />,
                loader: recentPlaysLoader,
            },
            {
                path: '/profile/:id/recent-plays',
                element: <ProfileRecentPlaysPage />,
                loader: recentPlaysLoader,
            },
            {
                path: '/achievements',
                element: <ProfileAchievementsPage />,
                loader: achievementsLoader,
            },
            {
                path: '/conquistas',
                element: <ProfileAchievementsPage />,
                loader: achievementsLoader,
            },
            {
                path: '/profile/:id/achievements',
                element: <ProfileAchievementsPage />,
                loader: achievementsLoader,
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
                element: <NotFoundPage />,
            },
            {
                path: '/mapas',
                element: <NotFoundPage />,
            },
            {
                path: '/beatmaps',
                element: <NotFoundPage />,
            },
            {
                path: '/beatmap/:id',
                element: <BeatmapPage />,
                loader: beatmapLoader,
            },
            {
                element: <ProtectedLayout />,
                children: [
                    {
                        path: '/ranking',
                        element: <GlobalRankingPage />,
                        loader: rankingLoader,
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
