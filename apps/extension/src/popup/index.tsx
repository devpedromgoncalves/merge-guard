import { createRoot } from 'react-dom/client';
import { Popup } from '../content/components/Popup';
import './popup.css';

createRoot(document.getElementById('app')!).render(<Popup />);
