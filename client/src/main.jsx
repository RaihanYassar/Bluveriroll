import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { store } from './store';
import App from './App.jsx';
import './index.css';

const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '496985110038-bqr7glv9gtba59qsbo0ief9r4upe806p.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <Provider store={store}>
        <App />
      </Provider>
    </GoogleOAuthProvider>
  </StrictMode>
);

