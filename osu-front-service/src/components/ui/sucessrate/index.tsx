import React from 'react';
import style from './style.module.css';


interface SuccessRateProps {
    rate: number;
}

const SuccessRate: React.FC<SuccessRateProps> = ({ rate }) => {
    const clampedRate = Math.min(Math.max(rate, 0), 100);

    return (
        <div className={style.successRatePanel}>
            <h3 className={style.srTitle}>Taxa de Sucesso</h3>

            <div className={style.srTrack}>
                <div
                    className={style.srFill}
                    style={{ width: `${clampedRate}%` }}
                />
            </div>

            <span className={style.srValue}>{clampedRate.toFixed(1)}%</span>
        </div>
    );
};

export default SuccessRate;