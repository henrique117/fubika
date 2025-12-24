import React from 'react'
import style from './style.module.css'
import { WrapperComponent } from '../../components/components.export'
import { Link } from 'react-router-dom'

const HowToConnect: React.FC = () => {
    return (
        <WrapperComponent>
            <div className={style.pageWrapper}>
                <div className={style.card}>
                    <Link to='/'>
                        <button className={style.backButton}>
                            <img src="arrow_icon.svg" alt="" />
                        </button>
                    </Link>

                    <h1 className={style.title}>Como conectar?</h1>

                    <div className={style.instructions}>
                        <ul className={style.dashedList}>
                            <li>Localize o arquivo do osu! .exe em seu computador;</li>
                            <li>Clique com o botão direito sobre o osu! .exe e duplique o osu! .exe;</li>
                            <li>Após duplicar o arquivo, clique como botão direito e vá em propriedades;</li>
                            <li>Nas propriedades adicione “ADICIONAR AQ O COMANDO<br />PARA INSERIR NAS PROPRIEDADES” no destino (igual ao exemplo abaixo);</li>
                        </ul>
                        <img src="example.svg" alt="" className={style.image} />
                        <ul className={style.dashedList}>
                            <li>Clique no botão aplicar e logo em seguida o OK;</li>
                            <li>Feche a janela das propriedades do arquivo da cópia que você fez a alteração;</li>
                            <li>Abra o arquivo do jogo no qual você fez as modificações;</li>
                            <li>Aproveite o Fubika!</li>
                        </ul>
                    </div>
                </div>
            </div>
        </WrapperComponent>
    )
}

export default HowToConnect