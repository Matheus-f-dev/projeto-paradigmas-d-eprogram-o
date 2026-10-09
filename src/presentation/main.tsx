import '@fontsource/cinzel/500.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel-decorative/700.css';
import '@fontsource/eb-garamond/400.css';
import '@fontsource/eb-garamond/500.css';
import '@fontsource/eb-garamond/400-italic.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/componentes.css';
import './styles/telas.css';
import './styles/combate.css';
import './styles/laboratorio.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { EventosDoJogo } from '../application/eventosDoJogo';
import { JogoService } from '../application/JogoService';
import { EventBus } from '../events/EventBus';
import { PortugueseMessageProvider } from '../i18n/provedores';
import { criarRepositorios } from '../infrastructure/persistence/repositorios';
import { App } from './App';
import { SoundEngine } from './audio/SoundEngine';
import { ConsoleOutputChannel, TextCombatNotifier } from './output/OutputChannel';
import { ProvedorDoJogo } from './store/ContextoDoJogo';

// Composition root: aqui as implementações concretas são escolhidas e injetadas.
const repositorios = criarRepositorios({ rpg: window.rpg, localStorage: window.localStorage });
const barramento = new EventBus<EventosDoJogo>();
const jogo = new JogoService({ progresso: repositorios.progresso, barramento });
const som = new SoundEngine();

// Em desenvolvimento, o console exibe o "System.out.println" do PDF — agora
// como mais um assinante (OutputChannel), sem tocar no domínio.
if (import.meta.env.DEV) {
  const notificadorDeConsole = new TextCombatNotifier(new ConsoleOutputChannel(), new PortugueseMessageProvider());
  barramento.on('combate', (evento) => notificadorDeConsole.notify(evento));
}

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <ProvedorDoJogo servicos={{ jogo, barramento, repositorios, som }}>
      <App />
    </ProvedorDoJogo>
  </StrictMode>,
);
