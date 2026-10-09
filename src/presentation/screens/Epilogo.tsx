import { motion } from 'framer-motion';
import { cascata, surgirDeBaixo } from '../animation/transicoes';
import { Cenario } from '../art/Cenario';
import { SpriteDePersonagem, aparenciaPara } from '../art/personagens';
import { Botao } from '../components/Botao';
import { Brasao } from '../components/Brasao';
import { ContadorAnimado } from '../components/ContadorAnimado';
import { Icone, type NomeDoIcone } from '../components/Icone';
import { Ornamento, Painel } from '../components/Painel';
import { useI18n, useJogo, useNavegacao, useServicos } from '../store/ContextoDoJogo';

/** Tela final da campanha: a Cidadela libertada. */
export function Epilogo() {
  const estado = useJogo();
  const { jogo } = useServicos();
  const { t } = useI18n();
  const { navegar } = useNavegacao();
  const [primeiro, segundo] = estado.grupo;

  const linhas: { icone: NomeDoIcone; rotulo: string; valor: number }[] = [
    { icone: 'coroa', rotulo: t('result.battlesWon'), valor: estado.estatisticas.batalhasVencidas },
    { icone: 'espada', rotulo: t('result.damageDealt'), valor: estado.estatisticas.danoCausado },
    { icone: 'escudo', rotulo: t('result.damageTaken'), valor: estado.estatisticas.danoRecebido },
    { icone: 'estrela', rotulo: t('result.abilities'), valor: estado.estatisticas.habilidadesUsadas },
    { icone: 'caveira', rotulo: t('result.enemies'), valor: estado.estatisticas.inimigosDerrotados },
  ];

  return (
    <div className="epilogo">
      <Cenario tipo="vitoria" />
      <div className="epilogo__conteudo">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 12 }}>
          <Brasao tamanho={110} className="epilogo__brasao" />
        </motion.div>
        <motion.h1
          className="titulo-do-jogo"
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.3, delay: 0.3 }}
        >
          {t('result.final.title')}
        </motion.h1>
        <Ornamento />
        <motion.p className="epilogo__subtitulo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          {t('result.final.subtitle', primeiro?.nome ?? '', segundo?.nome ?? '')}
        </motion.p>
        <div className="epilogo__herois">
          {estado.grupo.map((heroi, i) => (
            <motion.div
              key={heroi.id}
              className="epilogo__heroi"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.25, type: 'spring', stiffness: 120 }}
            >
              <SpriteDePersonagem aparencia={aparenciaPara(heroi.id, heroi.classe)} />
            </motion.div>
          ))}
        </div>
        <Painel className="epilogo__estatisticas" titulo={t('result.final.stats')} variante="vidro">
          <motion.ul className="resultado__estatisticas" variants={cascata(0.08, 1.6)} initial="oculto" animate="visivel">
            {linhas.map((linha, i) => (
              <motion.li key={linha.rotulo} variants={surgirDeBaixo} className="estatistica">
                <Icone nome={linha.icone} tamanho={20} />
                <span className="estatistica__rotulo">{linha.rotulo}</span>
                <span className="estatistica__valor">
                  <ContadorAnimado valor={linha.valor} atraso={1.6 + i * 0.08} />
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </Painel>
        <div className="resultado__acoes">
          <Botao
            variante="primario"
            icone="espadasCruzadas"
            onClick={async () => {
              await jogo.apagarSave();
              jogo.encerrarPartida();
              navegar('selecao');
            }}
          >
            {t('result.final.newJourney')}
          </Botao>
          <Botao
            variante="fantasma"
            icone="porta"
            onClick={() => {
              jogo.encerrarPartida();
              navegar('menu');
            }}
          >
            {t('result.menu')}
          </Botao>
        </div>
      </div>
    </div>
  );
}
