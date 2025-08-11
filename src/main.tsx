import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN_HERE", // You get this from Sentry dashboard
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0, // 1.0 = capture all transactions, lower in production if needed
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
