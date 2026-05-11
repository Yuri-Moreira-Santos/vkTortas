import { HashRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/layout/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { Compras } from './pages/Compras';
import { Vendas } from './pages/Vendas';
import { Receitas } from './pages/Receitas';

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-stone-50">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/receitas" element={<Receitas />} />
        </Routes>
        <BottomNav />
      </div>
    </HashRouter>
  );
}
