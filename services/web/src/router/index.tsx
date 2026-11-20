import { createBrowserRouter, Outlet, redirect, RouterProvider, type LoaderFunctionArgs } from 'react-router-dom'
import { BeatmapPage, ForgotPassPage, GlobalRankingPage, HomePage, HowToConnectPage, LoginPage, NotFoundPage, RedefinePassPage, RegisterPage, ProfilePage, ProfileTopPlaysPage, ProfileRecentPlaysPage, ProfileAchievementsPage, MpLinkPage } from '../pages/pages.export'
import PrivateRoute from './private'
import { TopProgressBar } from '../components/components.export'
import {
    DEFAULT_AVATAR_URL,
    fetchActivePlayer,
    fetchBeatmapWithSetFromMirror,
    fetchRankingPageCached,
    fetchUserRecent,
    hasApiAuth,
    hydrateScoresBeatmaps,
    preloadImage,
    preloadProfileAssets,
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
    if (!params.id) {
        if (!hasApiAuth()) {
            return redirect('/')
        }
        const resolved = await fetchActivePlayer(undefined, { preferMe: true })
        if (!resolved?.player?.id) {
            return redirect('/')
        }
        let recentScores = undefined
        if (resolved.player.top_200 === undefined || resolved.player.top_200.length === 0) {
            recentScores = await fetchUserRecent(resolved.player.id, 10)
        }
        await preloadProfileAssets(resolved.player, recentScores, 10)
        return redirect(`/profile/${resolved.player.id}`)
    }

    if (!hasApiAuth()) return null
    const resolved = await fetchActivePlayer(params.id)
    if (resolved) {
        let recentScores = undefined
        if (!resolved.player.top_200 || resolved.player.top_200.length === 0) {
            recentScores = await fetchUserRecent(resolved.player.id, 10)
        }
        await preloadProfileAssets(resolved.player, recentScores, 10)
    }
    return null
}

const topPlaysLoader = async ({ params }: LoaderFunctionArgs) => {
    if (!params.id) {
        if (!hasApiAuth()) {
            return redirect('/')
        }
        const resolved = await fetchActivePlayer(undefined, { preferMe: true, hydrateCount: 50 })
        if (!resolved?.player?.id) {
            return redirect('/')
        }
        await preloadImage(resolved.player.pfp || DEFAULT_AVATAR_URL)
        return redirect(`/profile/${resolved.player.id}/top-plays`)
    }
    if (!hasApiAuth()) return null
    const resolved = await fetchActivePlayer(params.id, { hydrateCount: 50 })
    if (resolved) {
        await preloadImage(resolved.player.pfp || DEFAULT_AVATAR_URL)
    }
    return null
}

const recentPlaysLoader = async ({ params }: LoaderFunctionArgs) => {
    if (!params.id) {
        if (!hasApiAuth()) {
            return redirect('/')
        }
        const resolved = await fetchActivePlayer(undefined, { preferMe: true, hydrateCount: 0 })
        if (!resolved?.player?.id) {
            return redirect('/')
        }
        const recent = await fetchUserRecent(resolved.player.id, 50)
        if (recent.length === 0 && resolved.player.top_200?.length) {
            await hydrateScoresBeatmaps(resolved.player.top_200.slice(0, 50), 50)
        }
        await preloadImage(resolved.player.pfp || DEFAULT_AVATAR_URL)
        return redirect(`/profile/${resolved.player.id}/recent-plays`)
    }
    if (!hasApiAuth()) return null
    const resolved = await fetchActivePlayer(params.id, { hydrateCount: 0 })
    if (resolved) {
        const recent = await fetchUserRecent(resolved.player.id, 50)
        if (recent.length === 0 && resolved.player.top_200?.length) {
            await hydrateScoresBeatmaps(resolved.player.top_200.slice(0, 50), 50)
        }
        await preloadImage(resolved.player.pfp || DEFAULT_AVATAR_URL)
    }
    return null
}

const achievementsLoader = async ({ params }: LoaderFunctionArgs) => {
    if (!params.id) {
        if (!hasApiAuth()) {
            return redirect('/')
        }
        const resolved = await fetchActivePlayer(undefined, { preferMe: true, hydrateCount: 0 })
        if (!resolved?.player?.id) {
            return redirect('/')
        }
        await preloadImage(resolved.player.pfp || DEFAULT_AVATAR_URL)
        return redirect(`/profile/${resolved.player.id}/achievements`)
    }
    if (!hasApiAuth()) return null
    const resolved = await fetchActivePlayer(params.id, { hydrateCount: 0 })
    if (resolved) {
        await preloadImage(resolved.player.pfp || DEFAULT_AVATAR_URL)
    }
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
