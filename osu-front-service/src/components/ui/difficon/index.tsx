import React from 'react'

interface DifficultyIconProps {
    color: string;
    isSelected?: boolean;
    onClick?: () => void;
    className?: string;
}

const DiffIcon: React.FC<DifficultyIconProps> = ({ color, isSelected, onClick }) => {
    return (
        <div 
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // padding: '5px',
                borderRadius: '8px',
                cursor: 'pointer',
                border: isSelected ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
                transition: 'all 0.2s ease'
            }}
        >
            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
                <circle 
                    cx="12" 
                    cy="12" 
                    r="11" 
                    stroke={color} 
                    strokeWidth="2"
                    opacity="0.7"
                />
                <circle 
                    cx="12" 
                    cy="12" 
                    r="6.7" 
                    fill={color}
                    opacity="0.7"
                />
            </svg>
        </div>
    )
}

export default DiffIcon