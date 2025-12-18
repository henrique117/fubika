import React from 'react'
import style from './style.module.css'

interface ButtonProps {
    text?: React.ReactNode
    fontSize?: number
}

const ButtonGradient: React.FC<ButtonProps> = ({ text = '', fontSize = 14 }) => {
    return (
        <div className={style.container}>
            <h2 style={{ fontSize: `${fontSize}px` }}>{ text }</h2>
        </div>
    )
}

export default ButtonGradient