import React, { useEffect, useRef, useState } from 'react'
import { useNavigation } from 'react-router-dom'
import style from './style.module.css'

interface TopProgressBarProps {
    forceActive?: boolean
}

const TopProgressBar: React.FC<TopProgressBarProps> = ({ forceActive = false }) => {
    const navigation = useNavigation()
    const isLoading = forceActive || navigation.state === 'loading'
    const [phase, setPhase] = useState<'idle' | 'loading' | 'completing'>(
        forceActive ? 'loading' : 'idle'
    )
    const wasLoadingRef = useRef(forceActive)

    useEffect(() => {
        let startTimer: number | undefined
        let completeTimer: number | undefined
        let resetTimer: number | undefined

        if (isLoading) {
            wasLoadingRef.current = true
            startTimer = window.setTimeout(() => {
                setPhase('loading')
            }, 0)
        } else if (wasLoadingRef.current) {
            wasLoadingRef.current = false
            completeTimer = window.setTimeout(() => {
                setPhase('completing')
            }, 0)
            resetTimer = window.setTimeout(() => {
                setPhase('idle')
            }, 390)
        }

        return () => {
            if (startTimer !== undefined) window.clearTimeout(startTimer)
            if (completeTimer !== undefined) window.clearTimeout(completeTimer)
            if (resetTimer !== undefined) window.clearTimeout(resetTimer)
        }
    }, [isLoading])

    const containerClass =
        phase === 'loading'
            ? `${style.barContainer} ${style.loading}`
            : phase === 'completing'
              ? `${style.barContainer} ${style.completing}`
              : style.barContainer

    return (
        <div
            className={containerClass}
            role="progressbar"
            aria-hidden={phase === 'idle'}
            aria-label="Carregando página"
        >
            <div className={style.barFill} />
        </div>
    )
}

export default TopProgressBar
