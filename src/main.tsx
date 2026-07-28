import { render } from 'preact';
import '@fontsource-variable/inter';
import '@fontsource-variable/literata';
import './styles/global.css';
import { App } from './App';
import { applyAppearance } from './lib/prefs';

applyAppearance();

render(<App />, document.getElementById('app')!);
