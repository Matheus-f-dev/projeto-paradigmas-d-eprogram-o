import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cascata, surgirDeBaixo } from '../animation/transicoes';
import { Cenario } from '../art/Cenario';
import { IlustracaoDeItem } from '../art/itens';
import { Botao } from '../components/Botao';
import { ContadorAnimado } from '../components/ContadorAnimado';
import { Icone, type NomeDoIcone } from '../components/Icone';
import { Ornamento, Painel } from '../components/Painel';
import { useAvisos, useI18n, useJogo, useNavegacao, useServicos, useSom } from '../store/ContextoDoJogo';

export function Resultado() {
  const estado = useJogo();
  const { jogo } = useServicos();
  const { t } = useI18n();
  const { navegar } = useNavegacao();
  const { avisar } = useAvisos();
  const tocar = useSom();
  const [ocupado, definirOcupado] = useState(false);
  const vitoria = estado.batalha?.estado === 'vitoria';
  const resumo = estado.ultimaBatalha;

  useEffect(() => {
    tocar(vitoria ? 'vitoria' : 'fanfarraDerrota');
  }, [tocar, vitoria]);

  if (!estado.batalha || !resumo) {
    return (
      <div className="tela-simples">
        <div className="tela-simples__conteudo">
          <Botao variante="primario" onClick={() => navegar('menu')}>
            {t('result.menu')}
          </Botao>
        </div>
      </div>
    );
  }

  const heroiDoMaiorGolpe = [...estado.batalha.herois, ...estado.batalha.aliados].find((h) => h.id === resumo.maiorGolpe.atorId);

  const linhas: { icone: NomeDoIcone; rotulo: string; valor: number; detalhe?: string }[] = [
    { icone: 'espada', rotulo: t('result.damageDealt'), valor: resumo.danoCausado },
    { icone: 'escudo', rotulo: t('result.damageTaken'), valor: resumo.danoRecebido },
    { icone: 'raio', rotulo: t('result.biggestHit'), valor: resumo.maiorGolpe.valor, detalhe: heroiDoMaiorGolpe?.nome },
    { icone: 'coracao', rotulo: t('result.healing'), valor: resumo.curaTotal },
    { icone: 'estrela', rotulo: t('result.abilities'), valor: resumo.habilidadesUsadas },
    { icone: 'caveira', rotulo: t('result.enemies'), valor: resumo.inimigosDerrotados },
    { icone: 'runa', rotulo: t('result.limbs'), valor: resumo.membrosDecepados },
    { icone: 'pocao', rotulo: t('result.items'), valor: resumo.itensUsados },
    { icone: 'ampulheta', rotulo: t('result.rounds'), valor: resumo.rodadas },
  ];

  const seguir = async () => {
    definirOcupado(true);
    try {
      await jogo.seguirParaAcampamento();
      navegar(jogo.getSnapshot().campanhaConcluida ? 'epilogo' : 'acampamento');
    } catch {
      avisar(t('camp.saveError'), 'erro');
      navegar(jogo.getSnapshot().campanhaConcluida ? 'epilogo' : 'acampamento');
    } finally {
      definirOcupado(false);
    }
  };

  const tentarNovamente = () => {
    const resultado = jogo.reiniciarBatalha();
    if (resultado.ok) navegar('combate');
    else avisar(t(resultado.erro), 'erro');
  };

  return (
    <div className={vitoria ? 'resultado resultado--vitoria' : 'resultado resultado--derrota'}>
      <Cenario tipo={vitoria ? 'vitoria' : 'derrota'} />
      <div className="resultado__conteudo">
        <motion.div
          className="resultado__emblema"
          initial={{ scale: 0.3, opacity: 0, rotate: vitoria ? -20 : 0 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.2 }}
        >
          <Icone nome={vitoria ? 'coroa' : 'caveira'} tamanho={64} />
        </motion.div>
        <motion.h1
          className="resultado__titulo"
          initial={{ opacity: 0, letterSpacing: '0.6em', filter: 'blur(12px)' }}
          animate={{ opacity: 1, letterSpacing: '0.12em', filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {t(vitoria ? 'result.victory.title' : 'result.defeat.title')}
        </motion.h1>
        <motion.p className="resultado__subtitulo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          {t(vitoria ? 'result.victory.subtitle' : 'result.defeat.subtitle')}
        </motion.p>
        <Ornamento />

        <Painel className="resultado__resumo" titulo={t('result.summary')} variante="vidro">
          <motion.ul className="resultado__estatisticas" variants={cascata(0.07, 0.9)} initial="oculto" animate="visivel">
            {linhas.map((linha, i) => (
              <motion.li key={linha.rotulo} variants={surgirDeBaixo} className="estatistica">
                <Icone nome={linha.icone} tamanho={20} />
                <span className="estatistica__rotulo">
                  {linha.rotulo}
                  {linha.detalhe && <small>{linha.detalhe}</small>}
                </span>
                <span className="estatistica__valor">
                  <ContadorAnimado valor={linha.valor} atraso={0.9 + i * 0.07} />
                </span>
              </motion.li>
            ))}
          </motion.ul>
          {resumo.espolios.length > 0 && (
            <div className="resultado__espolios">
              <span className="rotulo-secao">{t('result.loot')}</span>
              <div className="resultado__itens">
                {resumo.espolios.map((catalogoId, i) => (
                  <motion.span
                    key={`${catalogoId}-${i}`}
                    className="resultado__item"
                    initial={{ opacity: 0, y: 20, rotate: -10 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ delay: 1.5 + i * 0.12, type: 'spring' }}
                    title={t(`item.${catalogoId}.name`)}
                  >
                    <IlustracaoDeItem catalogoId={catalogoId} tamanho={44} />
                    <small>{t(`item.${catalogoId}.name`)}</small>
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </Painel>

        <motion.div className="resultado__acoes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }}>
          {vitoria ? (
            <Botao variante="primario" icone="avancar" onClick={seguir} disabled={ocupado}>
              {t('result.continue')}
            </Botao>
          ) : (
            <>
              <Botao variante="primario" icone="espadasCruzadas" onClick={tentarNovamente}>
                {t('result.retry')}
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
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
