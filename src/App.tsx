import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ForecastEngine } from './pages/ForecastEngine';
import { Purchasing } from './pages/Purchasing';
import { StockInput } from './pages/StockInput';
import { NewDeals } from './pages/NewDeals';
import { LostOrders } from './pages/LostOrders';
import { StockHealth } from './pages/StockHealth';
import { Seasonality } from './pages/Seasonality';
import { ProductSetup } from './pages/ProductSetup';
import { SalesGlobal } from './pages/SalesGlobal';
import { Deliveries } from './pages/Deliveries';
import { PendingPOs } from './pages/PendingPOs';

const VALID_PAGES = new Set([
  'dashboard','forecast','purchasing','stock-input','sales-global',
  'deliveries','pending-pos','new-deals','lost-orders','stock-health',
  'seasonality','product-setup',
]);

function getPageFromHash(): string {
  const hash = window.location.hash.slice(1);
  return VALID_PAGES.has(hash) ? hash : 'dashboard';
}

export default function App() {
  const [page, setPage] = useState(getPageFromHash);

  const navigate = (p: string) => {
    window.location.hash = p;
    setPage(p);
  };

  useEffect(() => {
    const handler = () => setPage(getPageFromHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'dashboard':    return <Dashboard onNavigate={navigate} />;
      case 'forecast':     return <ForecastEngine />;
      case 'purchasing':   return <Purchasing />;
      case 'stock-input':  return <StockInput />;
      case 'sales-global': return <SalesGlobal />;
      case 'deliveries':   return <Deliveries />;
      case 'pending-pos':  return <PendingPOs />;
      case 'new-deals':    return <NewDeals />;
      case 'lost-orders':  return <LostOrders />;
      case 'stock-health': return <StockHealth />;
      case 'seasonality':  return <Seasonality />;
      case 'product-setup':return <ProductSetup />;
      default:             return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <Layout activePage={page} onNavigate={navigate}>
      {renderPage()}
    </Layout>
  );
}
