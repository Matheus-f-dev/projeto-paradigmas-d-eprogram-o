import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { ResultadoDeAcao } from '../../application/JogoService';
import type { CombatenteSnapshot, ItemSnapshot } from '../../application/snapshots';
import { IlustracaoDeItem } from '../art/itens';
import { SpriteDePersonagem, aparenciaPara } from '../art/personagens';
import { useAvisos, useI18n, useJogo, useServicos, useSom } from '../store/ContextoDoJogo';
import { BarraDeStatus } from './BarraDeStatus';
import { Botao } from './Botao';
import { Icone } from './Icone';

type Filtro = 'todos' | ItemSnapshot['categoria'];

function descricaoCurta(item: ItemSnapshot, t: (chave: string, ...args: (string | number)[]) => string): string {
  if (item.bonusAtaque !== undefined) return t('inventory.attackBonus', item.bonusAtaque);
  if (item.defesa !== undefined) return t('inventory.defenseBonus', item.defesa);
  return t(`category.${item.categoria}`);
}

/** Inventário compartilhado e equipamentos do grupo (usado no acampamento). */
export function PainelDeInventario({ aoFechar }: { aoFechar: () => void }) {
  const estado = useJogo();
  const { jogo } = useServicos();
  const { t } = useI18n();
  const { avisar } = useAvisos();
  const tocar = useSom();
  const [filtro, definirFiltro] = useState<Filtro>('todos');
  const [selecionadoId, definirSelecionado] = useState<string | null>(null);

  const itens = useMemo(
    () => estado.inventario.filter((item) => filtro === 'todos' || item.categoria === filtro),
    [estado.inventario, filtro],
  );
  const selecionado = estado.inventario.find((item) => item.id === selecionadoId) ?? itens[0] ?? null;

  const executar = (resultado: ResultadoDeAcao, sucesso: string) => {
    if (resultado.ok) {
      tocar('equipar');
      avisar(sucesso, 'sucesso');
    } else {
      tocar('erro');
      avisar(t(resultado.erro), 'erro');
    }
  };

  const nomeDoItem = (item: ItemSnapshot) => t(`item.${item.catalogoId}.name`);

  return (
    <motion.div className="dialogo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section
        className="inventario painel painel--pedra"
        role="dialog"
        aria-modal="true"
        aria-label={t('inventory.title')}
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      >
        <header className="inventario__cabecalho">
          <h2 className="painel__titulo">
            <Icone nome="mochila" /> {t('inventory.title')}
          </h2>
          <Botao variante="fantasma" icone="fechar" onClick={aoFechar}>
            {t('inventory.close')}
          </Botao>
        </header>

        <div className="inventario__corpo">
          {/* Equipamento de cada herói */}
          <div className="inventario__herois">
            {estado.grupo.map((heroi) => (
              <EquipamentoDoHeroi
                key={heroi.id}
                heroi={heroi}
                outro={estado.grupo.find((h) => h.id !== heroi.id) ?? null}
                aoGuardar={(espaco, item) => executar(jogo.guardar(heroi.id, espaco), t('toast.unequipped', heroi.nome, nomeDoItem(item)))}
                aoTransferir={(espaco, item, destino) =>
                  executar(jogo.transferir(heroi.id, destino.id, espaco), t('toast.transferred', destino.nome, nomeDoItem(item)))
                }
              />
            ))}
          </div>

          {/* Itens compartilhados */}
          <div className="inventario__itens">
            <span className="rotulo-secao">{t('inventory.shared')}</span>
            <div className="abas" role="tablist">
              {(['todos', 'arma', 'armadura', 'consumivel'] as const).map((valor) => (
                <button
                  key={valor}
                  role="tab"
                  type="button"
                  aria-selected={filtro === valor}
                  className={filtro === valor ? 'aba aba--ativa' : 'aba'}
                  onClick={() => definirFiltro(valor)}
                >
                  {t(`category.${valor}`)}
                </button>
              ))}
            </div>
            <motion.ul className="grade-itens" layout>
              <AnimatePresence>
                {itens.map((item) => (
                  <motion.li key={item.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
                    <button
                      type="button"
                      className={selecionado?.id === item.id ? 'item-slot item-slot--selecionado' : 'item-slot'}
                      onClick={() => definirSelecionado(item.id)}
                      title={nomeDoItem(item)}
                    >
                      <IlustracaoDeItem catalogoId={item.catalogoId} tamanho={46} />
                      <span className="item-slot__nome">{nomeDoItem(item)}</span>
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
              {itens.length === 0 && <li className="grade-itens__vazio">{t('inventory.empty')}</li>}
            </motion.ul>
          </div>

          {/* Detalhe do item selecionado */}
          <aside className="inventario__detalhe">
            <AnimatePresence mode="wait">
              {selecionado && (
                <motion.div key={selecionado.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                  <div className="detalhe-item__arte">
                    <IlustracaoDeItem catalogoId={selecionado.catalogoId} tamanho={96} />
                  </div>
                  <h3 className="detalhe-item__nome">{nomeDoItem(selecionado)}</h3>
                  <span className="detalhe-item__tipo">{descricaoCurta(selecionado, t)}</span>
                  <p className="detalhe-item__desc">{t(`item.${selecionado.catalogoId}.desc`)}</p>
                  <div className="detalhe-item__acoes">
                    {estado.grupo.map((heroi) => {
                      if (selecionado.categoria === 'consumivel') {
                        const pode = selecionado.alvosValidos?.includes(heroi.id) ?? false;
                        return (
                          <Botao
                            key={heroi.id}
                            variante="secundario"
                            icone="pocao"
                            disabled={!pode}
                            title={pode ? undefined : t('inventory.cannotUse', heroi.nome)}
                            onClick={() => executar(jogo.usarItemNoAcampamento(selecionado.id, heroi.id), t('toast.used', nomeDoItem(selecionado)))}
                          >
                            {t('inventory.use', heroi.nome)}
                          </Botao>
                        );
                      }
                      const pode = selecionado.categoria === 'armadura' || (selecionado.portadoresPossiveis?.includes(heroi.id) ?? false);
                      return (
                        <Botao
                          key={heroi.id}
                          variante="secundario"
                          icone={selecionado.categoria === 'arma' ? 'espada' : 'armadura'}
                          disabled={!pode}
                          title={pode ? undefined : t('inventory.notAllowed', heroi.nome, nomeDoItem(selecionado))}
                          onClick={() => executar(jogo.equipar(heroi.id, selecionado.id), t('toast.equipped', heroi.nome, nomeDoItem(selecionado)))}
                        >
                          {pode ? t('inventory.equip', heroi.nome) : t('inventory.notAllowed', heroi.nome, nomeDoItem(selecionado))}
                        </Botao>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        </div>
      </motion.section>
    </motion.div>
  );
}

function EquipamentoDoHeroi({
  heroi,
  outro,
  aoGuardar,
  aoTransferir,
}: {
  heroi: CombatenteSnapshot;
  outro: CombatenteSnapshot | null;
  aoGuardar: (espaco: 'arma' | 'armadura', item: ItemSnapshot) => void;
  aoTransferir: (espaco: 'arma' | 'armadura', item: ItemSnapshot, destino: CombatenteSnapshot) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="ficha-equipamento">
      <div className="ficha-equipamento__topo">
        <span className="ficha-equipamento__retrato">
          <SpriteDePersonagem aparencia={aparenciaPara(heroi.id, heroi.classe)} />
        </span>
        <div>
          <strong>{heroi.nome}</strong>
          <span className="ficha-equipamento__classe">{t(`class.${heroi.classe}.name`)}</span>
          <span className="ficha-equipamento__stats">
            <Icone nome="espada" tamanho={15} /> {heroi.ataque}
            <Icone nome="escudo" tamanho={15} /> {heroi.defesa}
          </span>
        </div>
      </div>
      <BarraDeStatus tipo="vida" atual={heroi.vida} maximo={heroi.vidaMaxima} compacta rotulo={t('stat.hp')} />
      {(['arma', 'armadura'] as const).map((espaco) => {
        const item = heroi[espaco];
        const podeTransferir = item && outro && (espaco === 'armadura' || outro.tiposDeArma.includes(item.tipoDeArma!));
        return (
          <div key={espaco} className="espaco-equipamento">
            <span className="espaco-equipamento__rotulo">{t(espaco === 'arma' ? 'inventory.weapon' : 'inventory.armor')}</span>
            <div className="espaco-equipamento__item">
              {item ? (
                <>
                  <IlustracaoDeItem catalogoId={item.catalogoId} tamanho={34} />
                  <span>
                    {t(`item.${item.catalogoId}.name`)}
                    <small>{item.bonusAtaque !== undefined ? t('inventory.attackBonus', item.bonusAtaque) : t('inventory.defenseBonus', item.defesa ?? 0)}</small>
                  </span>
                </>
              ) : (
                <span className="espaco-equipamento__vazio">{t('inventory.none')}</span>
              )}
            </div>
            {item && (
              <div className="espaco-equipamento__acoes">
                <button type="button" className="mini-botao" onClick={() => aoGuardar(espaco, item)}>
                  {t('inventory.unequip')}
                </button>
                {outro && (
                  <button type="button" className="mini-botao" disabled={!podeTransferir} onClick={() => aoTransferir(espaco, item, outro)}>
                    {t('inventory.transfer', outro.nome)}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
