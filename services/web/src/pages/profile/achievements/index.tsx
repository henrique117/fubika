import React from 'react'
import style from './style.module.css'
import { WrapperComponent } from '../../../components/components.export'

const asset = (name: string) => `/assets/${name}`

type Achievement = {
    image: string
    title: string
    description: string
    tier: string
}

const achievements: Achievement[] = [
    {
        image: 'f8422.png',
        title: 'Primeiros passos',
        description: 'Jogue sua primeira partida.',
        tier: 'Bronze',
    },
    {
        image: '7e59f.png',
        title: 'Em movimento',
        description: 'Complete 25 partidas.',
        tier: 'Prata',
    },
    { image: '968d6.png', title: 'Veterano', description: 'Complete 100 partidas.', tier: 'Ouro' },
    {
        image: '720f8.png',
        title: 'Incansável',
        description: 'Complete 250 partidas.',
        tier: 'Platina',
    },
    {
        image: '840e7.png',
        title: 'Na classificação',
        description: 'Entre no ranque global.',
        tier: 'Bronze',
    },
    {
        image: 'fe8a5.png',
        title: 'Entre os melhores',
        description: 'Alcance o top 500.',
        tier: 'Prata',
    },
    { image: '9754f.png', title: 'Elite mundial', description: 'Alcance o top 100.', tier: 'Ouro' },
    {
        image: '25556.png',
        title: 'Número um',
        description: 'Chegue ao topo do ranque.',
        tier: 'Platina',
    },
    {
        image: '97df4.png',
        title: 'Aprovado',
        description: 'Passe uma fase sem falhar.',
        tier: 'Bronze',
    },
    {
        image: '53adb.png',
        title: 'Impecável',
        description: 'Passe 10 fases sem falhar.',
        tier: 'Prata',
    },
    {
        image: '77ecc.png',
        title: 'Perfeccionista',
        description: 'Conclua uma campanha perfeita.',
        tier: 'Ouro',
    },
    {
        image: 'd7076.png',
        title: 'Sem limites',
        description: 'Domine todas as campanhas.',
        tier: 'Platina',
    },
    {
        image: '70b30.png',
        title: 'Combo completo',
        description: 'Conquiste seu primeiro full combo.',
        tier: 'Bronze',
    },
    { image: 'b7c6f.png', title: 'Precisão', description: 'Faça 10 full combos.', tier: 'Prata' },
    { image: '0aa07.png', title: 'Virtuose', description: 'Faça 50 full combos.', tier: 'Ouro' },
    { image: '1bd95.png', title: 'Lendário', description: 'Faça 100 full combos.', tier: 'Platina' },
]

const panels = [
    { title: 'Habilidade', frame: 'f6b0a.svg', populated: true },
    { title: 'Dedicação', frame: 'eae86.svg', populated: false },
    { title: 'Introdução a modificações', frame: '32df0.svg', populated: false },
    { title: 'Hush-Hush', frame: 'eae86.svg', populated: false },
]

const ProfileAchievements: React.FC = () => {
    return (
        <WrapperComponent>
            <div className={style.appShell}>
                <div className={style.wallpaper} aria-hidden="true" />

                <section className={style.profileCard} aria-label="Conquistas de Arlecchino">
                    <div className={style.profileHero}>
                        <img className={style.graph} src={asset('133bb.svg')} alt="" width="720" height="165" />
                        <div className={style.profilePicture}>
                            <img src={asset('e464c.png')} alt="Foto de perfil de Arlecchino" />
                        </div>

                        <div className={style.profileCopy}>
                            <h1>Arlecchino</h1>
                            <p className={style.level}>Nível -100</p>
                            <div className={style.xpTrack}>
                                <span />
                            </div>
                            <div className={style.ranks}>
                                <div>
                                    <small>Ranque Global</small>
                                    <strong className={style.rankGlobal}>#1000</strong>
                                </div>
                                <div>
                                    <small>Ranque Estadual</small>
                                    <strong className={style.rankState}>#25</strong>
                                </div>
                            </div>
                            <div className={style.relationshipActions}>
                                <button type="button" className={style.mutual} aria-label="Seguir">
                                    <img src={asset('26409.png')} alt="" />
                                </button>
                                <button type="button" className={style.bell} aria-label="Notificações">
                                    <img src={asset('edbd4.png')} alt="" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={style.achievementGrid}>
                        {panels.map((panel) => (
                            <section className={style.achievementPanel} key={panel.title}>
                                <img
                                    className={style.panelFrame}
                                    src={asset(panel.frame)}
                                    alt=""
                                    width="330"
                                    height="382"
                                />
                                <h2>{panel.title}</h2>
                                {panel.populated && (
                                    <div className={style.badges}>
                                        {achievements.map((achievement) => (
                                            <div
                                                key={achievement.image}
                                                className={style.badge}
                                                title={`${achievement.title} (${achievement.tier}) - ${achievement.description}`}
                                                aria-label={`${achievement.title}, ${achievement.tier}`}
                                            >
                                                <img src={asset(achievement.image)} alt={achievement.title} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>
                </section>
            </div>
        </WrapperComponent>
    )
}

export default ProfileAchievements
