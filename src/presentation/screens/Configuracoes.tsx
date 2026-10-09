import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { IDIOMAS } from '../../i18n/MessageProvider';
import type { IntensidadeDeEfeitos, VelocidadeDeCombate } from '../../shared/contratosDePersistencia';
import { cascata, surgirDeBaixo } from '../animation/transicoes';
import { Cenario } from '../art/Cenario';
import { Botao } from '../components/Botao';
import { Icone, type NomeDoIcone } from '../components/Icone';
import { Ornamento, Painel } from '../components/Painel';
import { useConfiguracoes, useI18n, useNavegacao, useServicos } from '../store/ContextoDoJogo';

const NOMES_DOS_IDIOMAS = { pt: 'Português', en: 'English', zh: '中文' } as const;

function Linha({ icone, titulo, dica, children }: { icone: NomeDoIcone; titulo: string; dica?: string; children: ReactNode }) {
  return (
    <motion.div className="ajuste" variants={surgirDeBaixo}>
      <div className="ajuste__rotulo">
        <Icone nome={icone} />
        <div>
          <span className="ajuste__titulo">{titulo}</span>
          {dica && <span className="ajuste__dica">{dica}</span>}
        </div>
      </div>
      <div className="ajuste__controle">{children}</div>
    </motion.div>
  );
}

function Segmentado<T extends string>({ valor, opcoes, aoMudar, rotulo }: { valor: T; opcoes: readonly { valor: T; texto: string }[]; aoMudar: (valor: T) => void; rotulo: string }) {
  return (
    <div className="segmentado" role="radiogroup" aria-label={rotulo}>
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          role="radio"
          aria-checked={opcao.valor === valor}
          className={opcao.valor === valor ? 'segmentado__opcao segmentado__opcao--ativa' : 'segmentado__opcao'}
          onClick={() => aoMudar(opcao.valor)}
        >
          {opcao.texto}
        </button>
      ))}
    </div>
  );
}

export function Configuracoes() {
  const { config, atualizar } = useConfiguracoes();
  const { t } = useI18n();
  const { navegar, anterior } = useNavegacao();
  const { som } = useServicos();

  return (
    <div className="tela-simples">
      <Cenario tipo="selecao" />
      <div className="tela-simples__conteudo">
        <Painel className="configuracoes" titulo={t('settings.title')}>
          <Ornamento />
          <motion.div variants={cascata(0.06, 0.1)} initial="oculto" animate="visivel" className="configuracoes__lista">
            <Linha icone="globo" titulo={t('settings.language')}>
              <Segmentado
                rotulo={t('settings.language')}
                valor={config.idioma}
                opcoes={IDIOMAS.map((idioma) => ({ valor: idioma, texto: NOMES_DOS_IDIOMAS[idioma] }))}
                aoMudar={(idioma) => atualizar({ idioma })}
              />
            </Linha>
            <Linha icone="som" titulo={t('settings.volume')}>
              <input
                className="deslizante"
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(config.volume * 100)}
                aria-label={t('settings.volume')}
                onChange={(evento) => atualizar({ volume: Number(evento.target.value) / 100 })}
              />
              <span className="ajuste__valor">{Math.round(config.volume * 100)}%</span>
              <Botao variante="fantasma" icone="play" onClick={() => som.tocar('vitoria')} silencioso>
                {t('settings.volumeTest')}
              </Botao>
            </Linha>
            <Linha icone="estrela" titulo={t('settings.effects')}>
              <Segmentado<IntensidadeDeEfeitos>
                rotulo={t('settings.effects')}
                valor={config.efeitos}
                opcoes={(['completo', 'reduzido', 'minimo'] as const).map((valor) => ({ valor, texto: t(`settings.effects.${valor}`) }))}
                aoMudar={(efeitos) => atualizar({ efeitos })}
              />
            </Linha>
            <Linha icone="olho" titulo={t('settings.reducedMotion')} dica={t('settings.reducedMotionHint')}>
              <Segmentado
                rotulo={t('settings.reducedMotion')}
                valor={config.reduzirMovimento ? 'sim' : 'nao'}
                opcoes={[
                  { valor: 'nao', texto: t('settings.off') },
                  { valor: 'sim', texto: t('settings.on') },
                ]}
                aoMudar={(valor) => atualizar({ reduzirMovimento: valor === 'sim' })}
              />
            </Linha>
            <Linha icone="ampulheta" titulo={t('settings.speed')}>
              <Segmentado<VelocidadeDeCombate>
                rotulo={t('settings.speed')}
                valor={config.velocidade}
                opcoes={(['normal', 'rapida'] as const).map((valor) => ({ valor, texto: t(`settings.speed.${valor}`) }))}
                aoMudar={(velocidade) => atualizar({ velocidade })}
              />
            </Linha>
          </motion.div>
          <div className="configuracoes__acoes">
            <Botao variante="primario" icone="voltar" onClick={() => navegar(anterior && anterior !== 'configuracoes' ? anterior : 'menu')}>
              {t('settings.back')}
            </Botao>
          </div>
        </Painel>
      </div>
    </div>
  );
}
