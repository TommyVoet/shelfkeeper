import { render } from 'preact';
import '@fontsource-variable/inter';
import '@fontsource-variable/literata';
import './styles/global.css';
import { App } from './App';
import { applyAppearance } from './lib/prefs';
import { init } from './lib/store';

applyAppearance();

// De collectie laadt op de achtergrond; schermen tekenen zichzelf opnieuw
// zodra de gegevens binnen zijn (useStore).
void init().catch((err) => console.error('[store] laden mislukt', err));

render(<App />, document.getElementById('app')!);
