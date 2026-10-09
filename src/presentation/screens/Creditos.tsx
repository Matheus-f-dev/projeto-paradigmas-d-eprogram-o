import { motion } from 'framer-motion';
import { cascata, surgirDeBaixo } from '../animation/transicoes';
import { Cenario } from '../art/Cenario';
import { Botao } from '../components/Botao';
import { Brasao } from '../components/Brasao';
import { Ornamento, Painel } from '../components/Painel';
import { useI18n, useNavegacao } from '../store/ContextoDoJogo';

export function Creditos() {
  const { t } = useI18n();
  const { navegar } = useNavegacao();
  return (
    <div className="tela-simples">
      <Cenario tipo="acampamento" />
      <div className="tela-simples__conteudo">
        <Painel className="creditos" variante="pergaminho">
          <motion.div variants={cascata(0.12, 0.15)} initial="oculto" animate="visivel" className="creditos__lista">
            <motion.div variants={surgirDeBaixo} className="creditos__brasao">
              <Brasao tamanho={84} />
            </motion.div>
            <motion.h1 variants={surgirDeBaixo} className="titulo-do-jogo titulo-do-jogo--pequeno">
              {t('app.title')}
            </motion.h1>
            <motion.div variants={surgirDeBaixo}>
              <Ornamento />
            </motion.div>
            <motion.h2 variants={surgirDeBaixo} className="creditos__titulo">
              {t('credits.title')}
            </motion.h2>
            {(['credits.project', 'credits.basedOn', 'credits.art', 'credits.tech', 'credits.fonts'] as const).map((chave) => (
              <motion.p key={chave} variants={surgirDeBaixo} className="creditos__linha">
                {t(chave)}
              </motion.p>
            ))}
            <motion.div variants={surgirDeBaixo} className="creditos__acoes">
              <Botao variante="primario" icone="voltar" onClick={() => navegar('menu')}>
                {t('credits.back')}
              </Botao>
            </motion.div>
          </motion.div>
        </Painel>
      </div>
    </div>
  );
}
