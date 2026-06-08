import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App.jsx';
import { TierProvider } from './context/TierContext';

createRoot(document.getElementById('root')).render(
  <TierProvider>
    <App />
  </TierProvider>
);
