import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { CLASSES_DISPONIVEIS } from '../../application/JogoService';
import { possuiHabilidadeEspecial } from '../../domain/contracts/ComHabilidadeEspecial';
import type { ClasseJogavel } from '../../domain/world/herois';
import { cascata, surgirDeBaixo } from '../animation/transicoes';
import { Cenario } from '../art/Cenario';
import { IlustracaoDeItem } from '../art/itens';
import { SpriteDePersonagem } from '../art/personagens';
import { Botao } from '../components/Botao';
import { Icone, type NomeDoIcone } from '../components/Icone';
import { Ornamento } from '../components/Painel';
import { useAvisos, useI18n, useNavegacao, useServicos, useSom } from '../store/ContextoDoJogo';

const ICONE_DA_HABILIDADE: Readonly<Record<string, NomeDoIcone>> = {
  'golpe-brutal': 'punho',
  'bola-de-fogo': 'chama',
  'flecha-perfurante': 'flecha',
};

const MAXIMOS = { vida: 45, ataque: 10, mana: 25 };

function Atributo({ icone, rotulo, valor, maximo, cor }: { icone: NomeDoIcone; rotulo: string; valor: number; maximo: number; cor: string }) {
  return (
    <div className="atributo">
      <Icone nome={icone} tamanho={18} style={{ color: cor }} />
      <span className="atributo__rotulo">{rotulo}</span>
      <div className="atributo__trilho">
        <motion.div
          className="atributo__barra"
          style={{ background: cor }}
          initial={{ width: 0 }}
          animate={{ width: `${(valor / maximo) * 100}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="atributo__valor">{valor}</span>
    </div>
  );
}

export function SelecaoDePersonagem() {
  const { jogo } = useServicos();
  const { t } = useI18n();
  const { navegar } = useNavegacao();
  const { avisar } = useAvisos();
  const tocar = useSom();
  const [foco, definirFoco] = useState<ClasseJogavel>('guerreiro');
  const [escolhidos, definirEscolhidos] = useState<ClasseJogavel[]>([]);

  // Lê as capacidades das próprias classes do domínio (não há regra duplicada aqui).
  const classes = useMemo(
    () =>
      CLASSES_DISPONIVEIS.map((definicao) => {
        const amostra = definicao.criar();
        return {
          ...definicao,
          tiposDeArma: amostra.getTiposDeArma(),
          dano: possuiHabilidadeEspecial(amostra) ? amostra.getHabilidade().calcularDano(definicao.ataque) : 0,
        };
      }),
    [],
  );
  const atual = classes.find((classe) => classe.classe === foco)!;
  const recrutado = escolhidos.includes(foco);

  const alternar = (classe: ClasseJogavel) => {
    if (escolhidos.includes(classe)) {
      definirEscolhidos(escolhidos.filter((c) => c !== classe));
      return;
    }
    if (escolhidos.length >= 2) {
      avisar(t('select.full'), 'erro');
      tocar('erro');
      return;
    }
    tocar('equipar');
    definirEscolhidos([...escolhidos, classe]);
  };

  const partir = () => {
    const resultado = jogo.novaPartida(escolhidos);
    if (resultado.ok) navegar('acampamento');
    else avisar(t(resultado.erro), 'erro');
  };

  return (
    <div className="selecao">
      <Cenario tipo="selecao" />
      <header className="selecao__cabecalho">
        <motion.h1 className="titulo-de-tela" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          {t('select.title')}
        </motion.h1>
        <p className="selecao__subtitulo">{t('select.subtitle')}</p>
      </header>

      <div className="selecao__corpo">
        <motion.ul className="selecao__classes" variants={cascata(0.1, 0.2)} initial="oculto" animate="visivel">
          {classes.map((classe) => {
            const escolhido = escolhidos.includes(classe.classe);
            return (
              <motion.li key={classe.classe} variants={surgirDeBaixo}>
                <button
                  type="button"
                  className={[
                    'cartao-classe',
                    classe.classe === foco && 'cartao-classe--foco',
                    escolhido && 'cartao-classe--escolhido',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    tocar('clique');
                    definirFoco(classe.classe);
                  }}
                  onDoubleClick={() => alternar(classe.classe)}
                  aria-pressed={classe.classe === foco}
                >
                  <span className="cartao-classe__retrato">
                    <SpriteDePersonagem aparencia={classe.classe} />
                  </span>
                  <span className="cartao-classe__nome">{t(`class.${classe.classe}.name`)}</span>
                  <span className="cartao-classe__epiteto">{t(`class.${classe.classe}.epithet`)}</span>
                  {escolhido && (
                    <span className="cartao-classe__selo">
                      <Icone nome="check" tamanho={16} />
                    </span>
                  )}
                </button>
              </motion.li>
            );
          })}
        </motion.ul>

        <div className="selecao__palco">
          <AnimatePresence mode="wait">
            <motion.div
              key={foco}
              className="selecao__heroi"
              initial={{ opacity: 0, x: -40, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={`selecao__aura selecao__aura--${foco}`} />
              <SpriteDePersonagem aparencia={foco} className="selecao__sprite" />
              <div className="selecao__pedestal" />
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={foco}
            className="selecao__detalhes painel painel--vidro"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
          >
            <h2 className="selecao__nome">
              {atual.nome}
              <span className="selecao__classe">
                {t(`class.${foco}.name`)} · {t(`class.${foco}.epithet`)}
              </span>
            </h2>
            <p className="selecao__descricao">{t(`class.${foco}.desc`)}</p>
            <Ornamento />
            <h3 className="rotulo-secao">{t('select.attributes')}</h3>
            <Atributo icone="coracao" rotulo={t('stat.hp')} valor={atual.vida} maximo={MAXIMOS.vida} cor="var(--cura)" />
            <Atributo icone="espada" rotulo={t('stat.attack')} valor={atual.ataque} maximo={MAXIMOS.ataque} cor="var(--fogo)" />
            {atual.mana !== undefined && (
              <Atributo icone="gota" rotulo={t('resource.mana')} valor={atual.mana} maximo={MAXIMOS.mana} cor="var(--mana)" />
            )}
            <div className="habilidade-destaque">
              <span className={`habilidade-destaque__icone habilidade-destaque__icone--${atual.habilidadeId}`}>
                <Icone nome={ICONE_DA_HABILIDADE[atual.habilidadeId] ?? 'estrela'} tamanho={30} />
              </span>
              <div>
                <span className="rotulo-secao">{t('select.ability')}</span>
                <strong className="habilidade-destaque__nome">{t(`ability.${atual.habilidadeId}.name`)}</strong>
                <span className="habilidade-destaque__desc">{t(`ability.${atual.habilidadeId}.desc`)}</span>
              </div>
              <span className="habilidade-destaque__dano">{atual.dano}</span>
            </div>
            <p className="selecao__estilo">
              <strong>{t('select.style')}: </strong>
              {t(`class.${foco}.style`)}
            </p>
            <div className="selecao__pros-contras">
              <p>
                <Icone nome="mais" tamanho={16} /> <strong>{t('select.pros')}:</strong> {t(`class.${foco}.pros`)}
              </p>
              <p>
                <Icone nome="fechar" tamanho={16} /> <strong>{t('select.cons')}:</strong> {t(`class.${foco}.cons`)}
              </p>
            </div>
            <div className="selecao__arma">
              <IlustracaoDeItem catalogoId={atual.armaInicial} tamanho={44} />
              <div>
                <span className="rotulo-secao">{t('select.weapon')}</span>
                <strong>{t(`item.${atual.armaInicial}.name`)}</strong>
                <span className="selecao__armas">
                  {t('select.weapons')}: {atual.tiposDeArma.map((tipo) => t(`weaponType.${tipo}`)).join(', ')}
                </span>
              </div>
            </div>
            <Botao variante={recrutado ? 'fantasma' : 'primario'} icone={recrutado ? 'fechar' : 'mais'} onClick={() => alternar(foco)}>
              {recrutado ? t('select.remove') : t('select.pick')}
            </Botao>
          </motion.section>
        </AnimatePresence>
      </div>

      <footer className="selecao__rodape">
        <Botao variante="fantasma" icone="voltar" onClick={() => navegar('menu')}>
          {t('select.back')}
        </Botao>
        <div className="selecao__grupo" aria-live="polite">
          {[0, 1].map((indice) => {
            const classe = escolhidos[indice];
            return (
              <motion.div key={indice} className={classe ? 'vaga vaga--ocupada' : 'vaga'} layout>
                <AnimatePresence mode="popLayout">
                  {classe ? (
                    <motion.div key={classe} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}>
                      <SpriteDePersonagem aparencia={classe} />
                    </motion.div>
                  ) : (
                    <Icone nome="mais" tamanho={22} />
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          <span className="selecao__contagem">{t('select.count', escolhidos.length)}</span>
        </div>
        <Botao variante="primario" icone="espadasCruzadas" disabled={escolhidos.length !== 2} onClick={partir}>
          {t('select.confirm')}
        </Botao>
      </footer>
    </div>
  );
}
