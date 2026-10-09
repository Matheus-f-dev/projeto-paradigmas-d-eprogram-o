import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { cascata, surgirDeBaixo } from '../animation/transicoes';
import { Cenario } from '../art/Cenario';
import { IlustracaoDeItem } from '../art/itens';
import { SpriteDePersonagem, aparenciaPara } from '../art/personagens';
import { BarraDeStatus } from '../components/BarraDeStatus';
import { Botao } from '../components/Botao';
import { Icone } from '../components/Icone';
import { Ornamento, Painel } from '../components/Painel';
import { PainelDeInventario } from '../components/PainelDeInventario';
import { useAvisos, useI18n, useJogo, useNavegacao, useServicos, useSom } from '../store/ContextoDoJogo';

export function Acampamento() {
  const estado = useJogo();
  const { jogo } = useServicos();
  const { t } = useI18n();
  const { navegar } = useNavegacao();
  const { avisar } = useAvisos();
  const tocar = useSom();
  const [inventarioAberto, definirInventarioAberto] = useState(false);
  const [salvando, definirSalvando] = useState(false);

  if (!estado.emPartida || !estado.estagioId) {
    return (
      <div className="tela-simples">
        <Cenario tipo="acampamento" />
        <div className="tela-simples__conteudo">
          <Botao variante="primario" onClick={() => navegar('menu')}>
            {t('camp.menu')}
          </Botao>
        </div>
      </div>
    );
  }

  const marchar = () => {
    const resultado = jogo.iniciarBatalha();
    if (resultado.ok) navegar('combate');
    else avisar(t(resultado.erro), 'erro');
  };

  const salvar = async () => {
    definirSalvando(true);
    try {
      await jogo.salvar();
      tocar('espolio');
      avisar(t('camp.saved'), 'sucesso');
    } catch {
      avisar(t('camp.saveError'), 'erro');
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <div className="acampamento">
      <Cenario tipo="acampamento" />
      <header className="acampamento__cabecalho">
        <motion.h1 className="titulo-de-tela" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          {t('camp.title')}
        </motion.h1>
        <p className="acampamento__subtitulo">{t('camp.subtitle')}</p>
      </header>

      <div className="acampamento__corpo">
        <motion.section className="acampamento__grupo" variants={cascata(0.12, 0.2)} initial="oculto" animate="visivel" aria-label={t('camp.party')}>
          {estado.grupo.map((heroi) => (
            <motion.article key={heroi.id} className="cartao-heroi painel painel--vidro" variants={surgirDeBaixo}>
              <div className="cartao-heroi__retrato">
                <SpriteDePersonagem aparencia={aparenciaPara(heroi.id, heroi.classe)} />
              </div>
              <div className="cartao-heroi__info">
                <h2 className="cartao-heroi__nome">{heroi.nome}</h2>
                <span className="cartao-heroi__classe">{t(`class.${heroi.classe}.name`)}</span>
                <BarraDeStatus tipo="vida" atual={heroi.vida} maximo={heroi.vidaMaxima} rotulo={t('stat.hp')} />
                {heroi.recurso && (
                  <BarraDeStatus
                    tipo={heroi.recurso.tipo}
                    atual={heroi.recurso.atual}
                    maximo={heroi.recurso.maximo}
                    rotulo={t(`resource.${heroi.recurso.tipo}`)}
                  />
                )}
                <div className="cartao-heroi__stats">
                  <span>
                    <Icone nome="espada" tamanho={16} /> {t('stat.attack')} <strong>{heroi.ataque}</strong>
                  </span>
                  <span>
                    <Icone nome="escudo" tamanho={16} /> {t('stat.defense')} <strong>{heroi.defesa}</strong>
                  </span>
                  {heroi.bonusTemporario > 0 && (
                    <span className="cartao-heroi__bencao">
                      <Icone nome="estrela" tamanho={16} /> +{heroi.bonusTemporario}
                    </span>
                  )}
                </div>
                <div className="cartao-heroi__equipamento">
                  {[heroi.arma, heroi.armadura].map((item, i) => (
                    <span key={i} className="cartao-heroi__item" title={item ? t(`item.${item.catalogoId}.name`) : t('inventory.none')}>
                      {item ? <IlustracaoDeItem catalogoId={item.catalogoId} tamanho={34} /> : <Icone nome={i === 0 ? 'espada' : 'armadura'} tamanho={20} />}
                    </span>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </motion.section>

        <motion.aside className="acampamento__lateral" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <Painel className="destino" titulo={t('camp.next')}>
            <span className="destino__capitulo">{t('stage.label', estado.estagio + 1, estado.totalDeEstagios)}</span>
            <h3 className="destino__nome">{t(`stage.${estado.estagioId}.name`)}</h3>
            <p className="destino__desc">{t(`stage.${estado.estagioId}.desc`)}</p>
            <Ornamento />
            <p className="destino__objetivo">
              <Icone nome="alvo" tamanho={18} /> {t(estado.objetivoDoEstagio ?? 'objective.defeatAll')}
            </p>
          </Painel>

          <AnimatePresence>
            {estado.descansou && (
              <motion.div className="aviso-acampamento" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Icone nome="chama" tamanho={18} /> {t('camp.rested')}
                {estado.recompensasRecentes.length > 0 && (
                  <span className="aviso-acampamento__recompensas">
                    {t('camp.rewards', estado.recompensasRecentes.map((id) => t(`item.${id}.name`)).join(', '))}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="acampamento__acoes">
            <Botao variante="primario" icone="espadasCruzadas" onClick={marchar}>
              {t('camp.march')}
            </Botao>
            <Botao variante="secundario" icone="mochila" onClick={() => definirInventarioAberto(true)} detalhe={`${estado.inventario.length}`}>
              {t('camp.manage')}
            </Botao>
            <Botao variante="secundario" icone="selo" onClick={salvar} disabled={salvando}>
              {t('camp.save')}
            </Botao>
            <Botao variante="fantasma" icone="porta" onClick={() => navegar('menu')}>
              {t('camp.menu')}
            </Botao>
          </div>
        </motion.aside>
      </div>

      <AnimatePresence>{inventarioAberto && <PainelDeInventario aoFechar={() => definirInventarioAberto(false)} />}</AnimatePresence>
    </div>
  );
}
