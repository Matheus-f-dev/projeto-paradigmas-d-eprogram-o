import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { DadosDeSave } from '../../shared/contratosDePersistencia';
import { cascata, surgirDaEsquerda } from '../animation/transicoes';
import { Cenario } from '../art/Cenario';
import { Botao } from '../components/Botao';
import { Brasao } from '../components/Brasao';
import { Ornamento, Painel } from '../components/Painel';
import { useI18n, useNavegacao, useServicos } from '../store/ContextoDoJogo';

export function MenuPrincipal() {
  const { jogo } = useServicos();
  const { t, idioma } = useI18n();
  const { navegar } = useNavegacao();
  const [save, definirSave] = useState<DadosDeSave | null | undefined>(undefined);
  const [confirmando, definirConfirmando] = useState(false);
  const [carregando, definirCarregando] = useState(false);

  useEffect(() => {
    let ativo = true;
    void jogo.lerSave().then((dados) => ativo && definirSave(dados));
    return () => {
      ativo = false;
    };
  }, [jogo]);

  const dataFormatada = save
    ? new Intl.DateTimeFormat(idioma === 'zh' ? 'zh-CN' : idioma === 'en' ? 'en-GB' : 'pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(save.salvoEm))
    : '';

  const continuar = async () => {
    definirCarregando(true);
    const ok = await jogo.carregarPartida();
    definirCarregando(false);
    if (!ok) {
      definirSave(null);
      return;
    }
    navegar(jogo.getSnapshot().campanhaConcluida ? 'epilogo' : 'acampamento');
  };

  const novaJornada = () => {
    if (save) definirConfirmando(true);
    else navegar('selecao');
  };

  return (
    <div className="menu">
      <Cenario tipo="menu" />
      <div className="menu__conteudo">
        <motion.header
          className="menu__titulo"
          initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <Brasao tamanho={104} className="menu__brasao" />
          </motion.div>
          <h1 className="titulo-do-jogo">{t('app.title')}</h1>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.7 }}>
            <Ornamento className="menu__ornamento" />
          </motion.div>
          <p className="menu__subtitulo">{t('app.subtitle')}</p>
        </motion.header>

        <motion.nav className="menu__opcoes" variants={cascata(0.09, 0.9)} initial="oculto" animate="visivel" aria-label={t('app.title')}>
          <motion.div variants={surgirDaEsquerda}>
            <Botao variante="menu" icone="espadasCruzadas" onClick={novaJornada}>
              {t('menu.newGame')}
            </Botao>
          </motion.div>
          <motion.div variants={surgirDaEsquerda}>
            <Botao
              variante="menu"
              icone="mapa"
              disabled={!save || carregando}
              onClick={continuar}
              detalhe={
                save === undefined
                  ? '…'
                  : save
                    ? save.campanhaConcluida
                      ? t('menu.completedHint', dataFormatada)
                      : t('menu.continueHint', save.estagio + 1, dataFormatada)
                    : t('menu.noSave')
              }
            >
              {t('menu.continue')}
            </Botao>
          </motion.div>
          <motion.div variants={surgirDaEsquerda}>
            <Botao variante="menu" icone="livro" onClick={() => navegar('laboratorio')}>
              {t('menu.lab')}
            </Botao>
          </motion.div>
          <motion.div variants={surgirDaEsquerda}>
            <Botao variante="menu" icone="engrenagem" onClick={() => navegar('configuracoes')}>
              {t('menu.settings')}
            </Botao>
          </motion.div>
          <motion.div variants={surgirDaEsquerda}>
            <Botao variante="menu" icone="pergaminho" onClick={() => navegar('creditos')}>
              {t('menu.credits')}
            </Botao>
          </motion.div>
          {window.rpg && (
            <motion.div variants={surgirDaEsquerda}>
              <Botao variante="menu" icone="porta" onClick={() => window.rpg?.aplicativo.sair()}>
                {t('menu.quit')}
              </Botao>
            </motion.div>
          )}
        </motion.nav>
      </div>
      <motion.footer className="menu__rodape" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1 }}>
        {t('menu.footer')}
      </motion.footer>

      <AnimatePresence>
        {confirmando && (
          <motion.div className="dialogo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.92, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}>
              <Painel className="dialogo__painel" role="alertdialog" aria-modal="true">
                <p className="dialogo__texto">{t('menu.confirmNew')}</p>
                <div className="dialogo__acoes">
                  <Botao variante="fantasma" onClick={() => definirConfirmando(false)}>
                    {t('menu.confirmNo')}
                  </Botao>
                  <Botao
                    variante="perigo"
                    icone="espadasCruzadas"
                    onClick={async () => {
                      await jogo.apagarSave();
                      definirConfirmando(false);
                      navegar('selecao');
                    }}
                  >
                    {t('menu.confirmYes')}
                  </Botao>
                </div>
              </Painel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
