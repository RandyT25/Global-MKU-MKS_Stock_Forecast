import { useState } from 'react';
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

export default function App() {
  const [page, setPage] = useState('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={setPage} />;
      case 'forecast': return <ForecastEngine />;
      case 'purchasing': return <Purchasing />;
      case 'stock-input': return <StockInput />;
      case 'sales-global': return <SalesGlobal />;
      case 'deliveries': return <Deliveries />;
      case 'pending-pos': return <PendingPOs />;
      case 'new-deals': return <NewDeals />;
      case 'lost-orders': return <LostOrders />;
      case 'stock-health': return <StockHealth />;
      case 'seasonality': return <Seasonality />;
      case 'product-setup': return <ProductSetup />;
      default: return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <Layout activePage={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  );
}
