import * as Sentry from "@sentry/react";

// pull DSN from env (safer than hardcoding)
const dsn = import.meta.env.VITE_SENTRY_DSN; // will be undefined locally until you set it

Sentry.init({
  dsn,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0, // capture 100% of transactions (lower later if you want)
  // Optional: session replay (remove if you don't want it)
  // replaysSessionSampleRate: 0.1,
  // replaysOnErrorSampleRate: 1.0,
});

import React from 'react'
import ReactDOM from 'react-dom/client'
import SubnetMasterApp from './SubnetMasterApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SubnetMasterApp />
  </React.StrictMode>,
)
