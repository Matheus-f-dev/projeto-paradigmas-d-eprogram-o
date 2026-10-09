import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Cenario } from '../art/Cenario';
import { Botao } from '../components/Botao';
import { Icone } from '../components/Icone';
import { Ornamento } from '../components/Painel';
import { BlocoDeCodigo } from '../lab/BlocoDeCodigo';
import { CONCEITOS, GRUPOS } from '../lab/conceitos';
import { executarDemonstracao } from '../lab/demonstracoes';
import { DiagramaUML } from '../lab/DiagramaUML';
import { obterTrecho } from '../lab/trechos';
import { useI18n, useNavegacao } from '../store/ContextoDoJogo';

/** Laboratório de Programação: os conceitos da disciplina explicados com o código real do jogo. */
export function Laboratorio() {
  const { t, messages } = useI18n();
  const { navegar } = useNavegacao();
  const [selecionadoId, definirSelecionado] = useState(CONCEITOS[0]!.id);
  const [abaDeCodigo, definirAbaDeCodigo] = useState(0);
  const [saida, definirSaida] = useState<{ conceito: string; linhas: string[] } | null>(null);

  const conceito = CONCEITOS.find((c) => c.id === selecionadoId) ?? CONCEITOS[0]!;
  const trechos = useMemo(
    () => conceito.trechos.map((trecho) => ({ ...trecho, codigo: obterTrecho(trecho.arquivo, trecho.regiao) })),
    [conceito],
  );
  const trechoAtual = trechos[Math.min(abaDeCodigo, trechos.length - 1)];

  const selecionar = (id: string) => {
    definirSelecionado(id);
    definirAbaDeCodigo(0);
    definirSaida(null);
  };

  const executar = () => {
    if (!conceito.demonstracao) return;
    definirSaida({ conceito: conceito.id, linhas: executarDemonstracao(conceito.demonstracao, messages) });
  };

  return (
    <div className="laboratorio">
      <Cenario tipo="laboratorio" />
      <header className="laboratorio__cabecalho">
        <Botao variante="fantasma" icone="voltar" onClick={() => navegar('menu')}>
          {t('lab.back')}
        </Botao>
        <div>
          <h1 className="titulo-de-tela">{t('lab.title')}</h1>
          <p className="laboratorio__subtitulo">{t('lab.subtitle')}</p>
        </div>
      </header>

      <div className="laboratorio__corpo">
        <nav className="laboratorio__indice painel painel--pedra" aria-label={t('lab.title')}>
          {GRUPOS.map((grupo) => (
            <div key={grupo} className="indice__grupo">
              <span className="indice__titulo">{t(`lab.group.${grupo}`)}</span>
              {CONCEITOS.filter((c) => c.grupo === grupo).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={c.id === conceito.id ? 'indice__item indice__item--ativo' : 'indice__item'}
                  onClick={() => selecionar(c.id)}
                  aria-current={c.id === conceito.id}
                >
                  <Icone nome={c.icone} tamanho={17} />
                  <span>{t(`lab.${c.id}.title`)}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          <motion.article
            key={conceito.id}
            className="laboratorio__conteudo painel painel--pergaminho-escuro"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="conceito__titulo">
              <Icone nome={conceito.icone} tamanho={28} /> {t(`lab.${conceito.id}.title`)}
            </h2>
            <Ornamento />

            <div className={conceito.diagrama ? 'conceito__colunas conceito__colunas--larga' : 'conceito__colunas'}>
              <div className="conceito__texto">
            <div className="conceito__grade">
              <section className="conceito__secao">
                <h3>{t('lab.explain')}</h3>
                <p>{t(`lab.${conceito.id}.explain`)}</p>
              </section>
              <section className="conceito__secao">
                <h3>{t('lab.game')}</h3>
                <p>{t(`lab.${conceito.id}.game`)}</p>
              </section>
              <section className="conceito__secao">
                <h3>{t('lab.why')}</h3>
                <p>{t(`lab.${conceito.id}.why`)}</p>
              </section>
              <section className="conceito__secao">
                <h3>{t('lab.evidence')}</h3>
                <p>{t(`lab.${conceito.id}.evidence`)}</p>
              </section>
            </div>

            <div className="conceito__meta">
              <div>
                <h3>{t('lab.files')}</h3>
                <ul className="conceito__chips">
                  {conceito.classes.map((classe) => (
                    <li key={classe}>
                      <code>{classe}</code>
                    </li>
                  ))}
                  {[...new Set(conceito.trechos.map((trecho) => trecho.arquivo))].map((arquivo) => (
                    <li key={arquivo} className="conceito__arquivo">
                      <Icone nome="codigo" tamanho={14} /> {arquivo}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>{t('lab.pdf')}</h3>
                <p className="conceito__pdf">
                  <Icone nome="pergaminho" tamanho={16} /> {t(`lab.${conceito.id}.pdf`)}
                </p>
              </div>
            </div>

            <div className="conceito__rodape">
              <section className="conceito__testes">
                <h3>
                  <Icone nome="teste" tamanho={18} /> {t('lab.tests')}
                </h3>
                <ul>
                  {conceito.testes.map((teste) => (
                    <li key={teste}>
                      <Icone nome="check" tamanho={14} /> <code>{teste}</code>
                    </li>
                  ))}
                </ul>
              </section>
              {conceito.demonstracao && (
                <section className="conceito__demo">
                  <Botao variante="primario" icone="play" onClick={executar}>
                    {saida?.conceito === conceito.id ? t('lab.rerun') : t('lab.run')}
                  </Botao>
                  <AnimatePresence>
                    {saida?.conceito === conceito.id && (
                      <motion.div className="console" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }}>
                        <span className="console__titulo">{t('lab.output')}</span>
                        <pre className="console__saida">
                          {saida.linhas.map((linha, i) => (
                            <motion.span key={`${i}-${linha}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                              {linha}
                              {'\n'}
                            </motion.span>
                          ))}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              )}
            </div>
              </div>
              <div className="conceito__codigo">
            {conceito.diagrama ? (
              <section className="conceito__bloco">
                <h3>{t('lab.diagram')}</h3>
                <DiagramaUML />
              </section>
            ) : (
              trechoAtual && (
                <section className="conceito__bloco">
                  <h3>{t('lab.code')}</h3>
                  {trechos.length > 1 && (
                    <div className="abas" role="tablist">
                      {trechos.map((trecho, i) => (
                        <button
                          key={`${trecho.arquivo}-${trecho.regiao}`}
                          type="button"
                          role="tab"
                          aria-selected={i === abaDeCodigo}
                          className={i === abaDeCodigo ? 'aba aba--ativa' : 'aba'}
                          onClick={() => definirAbaDeCodigo(i)}
                        >
                          {trecho.arquivo.split('/').at(-1)}
                          <small> · {trecho.regiao}</small>
                        </button>
                      ))}
                    </div>
                  )}
                  <BlocoDeCodigo arquivo={trechoAtual.arquivo} codigo={trechoAtual.codigo ?? `// região "${trechoAtual.regiao}" não encontrada`} />
                </section>
              )
            )}

              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </div>
  );
}
