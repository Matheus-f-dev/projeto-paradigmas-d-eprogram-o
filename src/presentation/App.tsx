import { AnimatePresence, motion } from 'framer-motion';
import type { ComponentType } from 'react';
import { transicaoDeTela } from './animation/transicoes';
import { Avisos } from './components/Avisos';
import { Acampamento } from './screens/Acampamento';
import { Combate } from './screens/Combate';
import { Configuracoes } from './screens/Configuracoes';
import { Creditos } from './screens/Creditos';
import { Epilogo } from './screens/Epilogo';
import { Laboratorio } from './screens/Laboratorio';
import { MenuPrincipal } from './screens/MenuPrincipal';
import { Resultado } from './screens/Resultado';
import { SelecaoDePersonagem } from './screens/SelecaoDePersonagem';
import { useNavegacao, type Tela } from './store/ContextoDoJogo';

const TELAS: Readonly<Record<Tela, ComponentType>> = {
  menu: MenuPrincipal,
  selecao: SelecaoDePersonagem,
  acampamento: Acampamento,
  combate: Combate,
  resultado: Resultado,
  epilogo: Epilogo,
  configuracoes: Configuracoes,
  creditos: Creditos,
  laboratorio: Laboratorio,
};

export function App() {
  const { tela } = useNavegacao();
  const TelaAtual = TELAS[tela];
  return (
    <div className="aplicativo">
      <AnimatePresence mode="wait">
        <motion.main
          key={tela}
          className={`tela tela--${tela}`}
          variants={transicaoDeTela}
          initial="entrada"
          animate="visivel"
          exit="saida"
        >
          <TelaAtual />
        </motion.main>
      </AnimatePresence>
      <Avisos />
    </div>
  );
}
