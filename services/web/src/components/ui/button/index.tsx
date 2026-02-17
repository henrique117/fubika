import React from 'react'
import style from './style.module.css'

interface ButtonProps {
    text?: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({ text = '' }) => {
    return (
        <div className={style.container}>
            <h2>{ text }</h2>
        </div>
    )
}

export default Button