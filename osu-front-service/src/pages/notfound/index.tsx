import React from 'react'
import style from './style.module.css'
import { WrapperComponent } from '../../components/components.export'

const NotFoundPage: React.FC = () => {
    return (
        <WrapperComponent>
            <div className={style.container}>
                <div className={style.containerLeft}>
                    <img src="/text_404.svg" alt="Texto 404 Not Found" className={style.imgNotFound} />
                </div>
                <div className={style.containerRight} >
                    <img src="/cat.svg" alt="Gato de corpo inteiro com o olho fechado" className={style.imgCat} />
                    <div className={style.speechBubble} >
                        <h2 className={style.text} >Verifique se você<br />escreveu as informações<br />corretamente!</h2>
                    </div>
                </div>
            </div>
            <div className={style.footer}>

            </div>
        </WrapperComponent>
    )
}

export default NotFoundPage