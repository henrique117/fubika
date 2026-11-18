import React from 'react'
import style from './style.module.css'
import { WrapperComponent } from '../../components/components.export'

const assets = '/assets'

const maps = [
    { title: 'Harumachi Clover - Hanasaka Yui (CV: M.A.O)', image: '1da67.png' },
    { title: 'Get Jinxed', image: '9bef5.png' },
    { title: 'Los! Los! Los!', image: '5ef09.png' },
    { title: 'Trust me', image: '42d4a.png' },
    { title: 'Sad Spring', image: 'e2302.png' },
    { title: 'Night of Knights', image: '4f2fc.png' },
    { title: 'Lionheart', image: 'b2e0b.png' },
    { title: 'Torero', image: '3388a.png' },
    { title: 'Through the Fire and Flames', image: 'cd522.png' },
    { title: 'Ai wa Binchoutan', image: '04814.png' },
]

const stats = [
    ['Pontuação ranqueada', '17,153,107,992'],
    ['Precisão de acerto', '98.40%'],
    ['Jogadas totais', '18,688'],
    ['Pontuação total', '48,336,973,155'],
    ['Acertos totais', '6,386,777'],
    ['Acertos por jogada', '341'],
    ['Combo máximo', '2,709'],
    ['Replays assistidos', '132'],
]

const Profile: React.FC = () => {
    return (
        <WrapperComponent>
            <div className={style.profilePage}>
                <div className={style.wallpaper} aria-hidden="true" />

                <div className={style.profilePanel}>
                    <section className={style.profileHero} aria-labelledby="profile-name">
                        <img className={style.chartBackground} src={`${assets}/4d78c.svg`} alt="" />
                        <div className={style.avatarFrame}>
                            <img src={`${assets}/e464c.png`} alt="Foto de perfil de Arlecchino" />
                        </div>

                        <div className={style.identity}>
                            <h1 id="profile-name">Arlecchino</h1>
                            <p>Nível -100</p>
                            <div className={style.experience} aria-label="12% de experiência">
                                <span />
                            </div>
                            <div className={style.ranks} id="rank">
                                <div>
                                    <small>Ranque Global</small>
                                    <strong>#1000</strong>
                                </div>
                                <div>
                                    <small>Ranque Estadual</small>
                                    <strong>#25</strong>
                                </div>
                            </div>
                        </div>

                        <div className={style.relationshipActions}>
                            <button type="button" className={style.mutualButton} title="Seguir">
                                <img src={`${assets}/26409.png`} alt="" />
                            </button>
                            <button type="button" className={style.bellButton} title="Notificações">
                                <img src={`${assets}/edbd4.png`} alt="" />
                            </button>
                        </div>
                    </section>

                    <section className={style.showcase} id="maps">
                        <div className={style.mapList} aria-label="Mapas favoritos">
                            {maps.map((map) => (
                                <div key={map.title} className={style.mapPill} title={map.title}>
                                    <img src={`${assets}/${map.image}`} alt="" />
                                    <span>{map.title}</span>
                                </div>
                            ))}
                        </div>

                        <div className={style.statusPanel}>
                            <dl>
                                {stats.map(([label, value]) => (
                                    <div key={label}>
                                        <dt>{label}</dt>
                                        <dd>{value}</dd>
                                    </div>
                                ))}
                            </dl>
                            <img className={style.cat} src={`${assets}/17c9d.png`} alt="Mascote gato azul" />
                        </div>
                    </section>
                </div>
            </div>
        </WrapperComponent>
    )
}

export default Profile
