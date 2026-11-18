import React, { useId, useMemo, useRef, useState } from 'react'
import style from './style.module.css'
import { type ApiPlayer, type ApiScore } from '../../../services/profileData'

interface ProfileRankChartProps {
    player: ApiPlayer | null
    scores?: ApiScore[]
    className?: string
}

interface ChartPoint {
    label: string
    pp: number
    rank: number
    isEstimatedRank?: boolean
}

interface PlottedPoint extends ChartPoint {
    x: number
    y: number
}

const CHART_BOX_X = 400
const CHART_BOX_Y = 33
const CHART_BOX_WIDTH = 300
const CHART_BOX_HEIGHT = 100

const PLOT_X_MIN = 412
const PLOT_X_MAX = 688
const PLOT_Y_TOP = 45
const PLOT_Y_BOTTOM = 121

const MASK_PATH =
    'M700 0C711.046 8.05322e-08 720 8.95431 720 20V145C720 156.046 711.046 165 700 165H20C8.95431 165 3.22129e-07 156.046 0 145V20C3.2215e-07 8.95431 8.95431 5.15406e-06 20 0H700ZM420 33C408.954 33 400 41.9543 400 53V113C400 124.046 408.954 133 420 133H680C691.046 133 700 124.046 700 113V53C700 41.9543 691.046 33 680 33H420Z'

const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value))

const formatShortDate = (raw: string | number | Date | undefined): string => {
    if (!raw) return 'Data'
    const timestamp =
        typeof raw === 'number'
            ? raw < 10_000_000_000
                ? raw * 1000
                : raw
            : Date.parse(String(raw))

    if (!Number.isFinite(timestamp)) {
        return String(raw).slice(0, 10)
    }

    const d = new Date(timestamp)
    const day = String(d.getUTCDate()).padStart(2, '0')
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    return `${day}/${month}`
}

const getDateKey = (raw: string | number | Date | undefined): string | null => {
    if (!raw) return null
    const timestamp =
        typeof raw === 'number'
            ? raw < 10_000_000_000
                ? raw * 1000
                : raw
            : Date.parse(String(raw))
    if (!Number.isFinite(timestamp)) return null
    return new Date(timestamp).toISOString().slice(0, 10)
}

const computeWeightedPp = (ppList: number[]): number => {
    const sorted = ppList.slice().sort((a, b) => b - a).slice(0, 200)
    let total = 0
    for (let i = 0; i < sorted.length; i++) {
        total += sorted[i] * Math.pow(0.95, i)
    }
    return total
}

const downsamplePoints = (points: ChartPoint[], maxPoints = 36): ChartPoint[] => {
    if (points.length <= maxPoints) return points
    const result: ChartPoint[] = [points[0]]
    const step = (points.length - 1) / (maxPoints - 1)
    for (let i = 1; i < maxPoints - 1; i++) {
        result.push(points[Math.round(i * step)])
    }
    result.push(points[points.length - 1])
    return result
}

const buildMockSeries = (): ChartPoint[] => {
    const offsets = [
        0.16, 0.2, 0.19, 0.25, 0.27, 0.24, 0.31, 0.34, 0.32, 0.39, 0.43, 0.41, 0.48, 0.52,
        0.5, 0.57, 0.62, 0.6, 0.67, 0.72, 0.7, 0.78, 0.82, 0.85, 0.89, 0.94, 0.97, 1,
    ]
    return offsets.map((ratio, index) => {
        const daysAgo = offsets.length - 1 - index
        const label = daysAgo === 0 ? 'Hoje' : `Há ${daysAgo}d`
        const pp = Math.round(420 + ratio * 580)
        const rank = Math.max(1000, Math.round(2800 - ratio * 1800))
        return { label, pp, rank }
    })
}

const buildChartSeries = (player: ApiPlayer | null, scores: ApiScore[]): ChartPoint[] => {
    if (!player) {
        return buildMockSeries()
    }

    const currentPp = Math.round(Number(player.pp || 0))
    const currentRank = Math.max(1, Number(player.rank || 1))

    // Prioridade 1: Histórico real persistido em user_rank_history
    if (player.rank_history && player.rank_history.length >= 2) {
        const series: ChartPoint[] = player.rank_history.map((entry) => ({
            label: formatShortDate(entry.date),
            pp: Math.round(entry.pp),
            rank: Math.max(1, entry.rank),
        }))

        const last = series[series.length - 1]
        const todayKey = new Date().toISOString().slice(0, 10)
        const lastRawDate = player.rank_history[player.rank_history.length - 1]?.date
        if (lastRawDate === todayKey) {
            series[series.length - 1] = {
                ...last,
                label: 'Hoje',
                pp: currentPp || last.pp,
                rank: currentRank,
            }
        } else {
            series.push({
                label: 'Hoje',
                pp: currentPp,
                rank: currentRank,
            })
        }

        return downsamplePoints(series)
    }

    // Prioridade 2: Reconstrução cronológica real pelas scores do jogador
    const candidateScores = (scores.length > 0 ? scores : player.top_200 ?? [])
        .map((score) => {
            const key = getDateKey(score.play_time)
            const timestamp = score.play_time ? Date.parse(String(score.play_time)) : NaN
            return {
                pp: Number(score.pp || 0),
                key,
                timestamp: Number.isFinite(timestamp) ? timestamp : 0,
            }
        })
        .filter((item) => item.pp > 0 && item.key !== null)
        .sort((a, b) => a.timestamp - b.timestamp)

    if (candidateScores.length > 0) {
        const dayMap = new Map<string, number[]>()
        for (const entry of candidateScores) {
            const key = entry.key!
            const bucket = dayMap.get(key)
            if (bucket) {
                bucket.push(entry.pp)
            } else {
                dayMap.set(key, [entry.pp])
            }
        }

        const usePerScoreGranularity = dayMap.size < 3 && candidateScores.length >= 3
        const rawPoints: { label: string; weightedPp: number }[] = []
        const seenPps: number[] = []

        if (usePerScoreGranularity) {
            for (const entry of candidateScores) {
                seenPps.push(entry.pp)
                rawPoints.push({
                    label: formatShortDate(entry.timestamp),
                    weightedPp: computeWeightedPp(seenPps),
                })
            }
        } else {
            for (const [dayKey, dayPps] of dayMap.entries()) {
                seenPps.push(...dayPps)
                rawPoints.push({
                    label: formatShortDate(dayKey),
                    weightedPp: computeWeightedPp(seenPps),
                })
            }
        }

        const finalWeighted = rawPoints[rawPoints.length - 1]?.weightedPp || 0
        const scale = currentPp > 0 && finalWeighted > 0 ? currentPp / finalWeighted : 1

        let series: ChartPoint[] = rawPoints.map((pt, idx) => {
            const isLast = idx === rawPoints.length - 1
            const scaledPp = isLast ? currentPp : Math.round(pt.weightedPp * scale)
            const estimatedRank = isLast
                ? currentRank
                : Math.max(
                      currentRank,
                      Math.min(
                          99_999,
                          Math.round(
                              currentRank *
                                  Math.pow(Math.max(1, currentPp) / Math.max(1, scaledPp), 1.25)
                          )
                      )
                  )

            return {
                label: pt.label,
                pp: scaledPp,
                rank: estimatedRank,
                isEstimatedRank: !isLast,
            }
        })

        if (series.length === 1) {
            const only = series[0]
            series = [
                {
                    label: only.label,
                    pp: Math.max(0, Math.round(only.pp * 0.6)),
                    rank: Math.max(only.rank, Math.round(only.rank * 1.4)),
                    isEstimatedRank: true,
                },
                { ...only, label: 'Hoje', isEstimatedRank: false },
            ]
        } else {
            series[series.length - 1] = {
                ...series[series.length - 1],
                label: 'Hoje',
                pp: currentPp,
                rank: currentRank,
                isEstimatedRank: false,
            }
        }

        return downsamplePoints(series)
    }

    // Sem scores ranqueadas ainda
    return [
        { label: 'Início', pp: currentPp, rank: currentRank },
        { label: 'Hoje', pp: currentPp, rank: currentRank },
    ]
}

const plotSeries = (series: ChartPoint[]): { points: PlottedPoint[]; linePath: string; areaPath: string } => {
    const safeSeries = series.length >= 2 ? series : [...series, ...series]
    const count = safeSeries.length

    const pps = safeSeries.map((pt) => pt.pp)
    const ranks = safeSeries.map((pt) => pt.rank)
    const minPp = Math.min(...pps)
    const maxPp = Math.max(...pps)
    const minRank = Math.min(...ranks)
    const maxRank = Math.max(...ranks)

    const hasPpVariance = maxPp > minPp
    const hasRankVariance = maxRank > minRank

    const points: PlottedPoint[] = safeSeries.map((pt, index) => {
        const xRatio = count > 1 ? index / (count - 1) : 1
        const x = PLOT_X_MIN + xRatio * (PLOT_X_MAX - PLOT_X_MIN)

        let yRatio = 0.2
        if (hasPpVariance) {
            yRatio = (pt.pp - minPp) / (maxPp - minPp)
        } else if (hasRankVariance) {
            yRatio = (maxRank - pt.rank) / (maxRank - minRank)
        } else if (pt.pp > 0) {
            yRatio = 0.55
        }

        const y = PLOT_Y_BOTTOM - yRatio * (PLOT_Y_BOTTOM - PLOT_Y_TOP)
        return { ...pt, x, y }
    })

    let linePath = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)]
        const p1 = points[i]
        const p2 = points[i + 1]
        const p3 = points[Math.min(points.length - 1, i + 2)]

        const cp1x = p1.x + (p2.x - p0.x) / 6
        const cp1y = clamp(p1.y + (p2.y - p0.y) / 6, PLOT_Y_TOP, PLOT_Y_BOTTOM)
        const cp2x = p2.x - (p3.x - p1.x) / 6
        const cp2y = clamp(p2.y - (p3.y - p1.y) / 6, PLOT_Y_TOP, PLOT_Y_BOTTOM)

        linePath += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
    }

    const first = points[0]
    const last = points[points.length - 1]
    const clipBottom = CHART_BOX_Y + CHART_BOX_HEIGHT
    const areaPath = `${linePath} L ${last.x.toFixed(2)} ${clipBottom} L ${first.x.toFixed(2)} ${clipBottom} Z`

    return { points, linePath, areaPath }
}

const ProfileRankChart: React.FC<ProfileRankChartProps> = ({
    player,
    scores = [],
    className = '',
}) => {
    const rawId = useId().replace(/:/g, '')
    const clipId = `profile-chart-clip-${rawId}`
    const gradientId = `profile-chart-grad-${rawId}`
    const hitboxRef = useRef<HTMLDivElement | null>(null)
    const [hoverIndex, setHoverIndex] = useState<number | null>(null)

    const { points, linePath, areaPath } = useMemo(() => {
        const candidateScores = scores.length > 0 ? scores : player?.top_200 ?? []
        const series = buildChartSeries(player, candidateScores)
        return plotSeries(series)
    }, [player, scores])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const box = hitboxRef.current
        if (!box || points.length === 0) return

        const rect = box.getBoundingClientRect()
        const ratio = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1)
        const svgX = PLOT_X_MIN + ratio * (PLOT_X_MAX - PLOT_X_MIN)

        let closestIdx = 0
        let minDist = Infinity
        for (let i = 0; i < points.length; i++) {
            const dist = Math.abs(points[i].x - svgX)
            if (dist < minDist) {
                minDist = dist
                closestIdx = i
            }
        }

        setHoverIndex(closestIdx)
    }

    const activePoint = hoverIndex !== null ? points[hoverIndex] ?? null : null
    const latestPoint = points[points.length - 1] ?? null

    const tooltipLeftPx = activePoint
        ? clamp(activePoint.x - CHART_BOX_X, 58, CHART_BOX_WIDTH - 58)
        : 0
    const placeTooltipAtBottom = activePoint ? activePoint.y < 78 : false

    return (
        <div className={`${style.chartRoot} ${className}`}>
            <svg
                className={style.chartSvg}
                width="720"
                height="165"
                viewBox="0 0 720 165"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <defs>
                    <clipPath id={clipId}>
                        <rect
                            x={CHART_BOX_X}
                            y={CHART_BOX_Y}
                            width={CHART_BOX_WIDTH}
                            height={CHART_BOX_HEIGHT}
                            rx="20"
                        />
                    </clipPath>
                    <linearGradient id={gradientId} x1="0" y1={PLOT_Y_TOP} x2="0" y2={133} gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#E89E00" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#E89E00" stopOpacity="0" />
                    </linearGradient>
                </defs>

                <g clipPath={`url(#${clipId})`}>
                    {[53, 73, 93, 113].map((gridY) => (
                        <line
                            key={gridY}
                            x1={CHART_BOX_X}
                            y1={gridY}
                            x2={CHART_BOX_X + CHART_BOX_WIDTH}
                            y2={gridY}
                            stroke="rgba(255, 255, 255, 0.06)"
                            strokeWidth="1"
                        />
                    ))}

                    <path d={areaPath} fill={`url(#${gradientId})`} />
                    <path
                        d={linePath}
                        stroke="#E89E00"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {activePoint && (
                        <>
                            <line
                                x1={activePoint.x}
                                y1={CHART_BOX_Y + 4}
                                x2={activePoint.x}
                                y2={CHART_BOX_Y + CHART_BOX_HEIGHT - 4}
                                stroke="rgba(255, 255, 255, 0.25)"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                            />
                            <circle
                                cx={activePoint.x}
                                cy={activePoint.y}
                                r="5.5"
                                fill="rgba(255, 196, 0, 0.28)"
                            />
                            <circle
                                cx={activePoint.x}
                                cy={activePoint.y}
                                r="3.2"
                                fill="#FFC400"
                                stroke="#FFFFFF"
                                strokeWidth="1.2"
                            />
                        </>
                    )}
                </g>

                <path id="Remover fundo" d={MASK_PATH} fill="#191715" fillOpacity="0.75" />
            </svg>

            <div
                ref={hitboxRef}
                className={style.chartHitbox}
                aria-label={
                    latestPoint
                        ? `Gráfico de evolução: #${latestPoint.rank}, ${latestPoint.pp.toLocaleString('en-US')}pp`
                        : 'Gráfico de evolução'
                }
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverIndex(null)}
            >
                {!activePoint && latestPoint && (
                    <div className={style.restBadge}>
                        <strong>#{latestPoint.rank}</strong>
                        <span>{latestPoint.pp.toLocaleString('en-US')}pp</span>
                    </div>
                )}

                {activePoint && (
                    <div
                        className={`${style.tooltip} ${
                            placeTooltipAtBottom ? style.tooltipBottom : style.tooltipTop
                        }`}
                        style={{ left: `${tooltipLeftPx}px` }}
                    >
                        <span className={style.tooltipRank}>
                            {activePoint.isEstimatedRank ? `~#${activePoint.rank}` : `#${activePoint.rank}`}
                        </span>
                        <span className={style.tooltipPp}>
                            {activePoint.pp.toLocaleString('en-US')}pp
                        </span>
                        <span className={style.tooltipDate}>{activePoint.label}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProfileRankChart
