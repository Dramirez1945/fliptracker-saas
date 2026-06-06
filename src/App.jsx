import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { storage, KEYS } from './storage';
import { supabase } from './supabaseClient';
import BottomNav from './components/ui/BottomNav';
import ToastContainer from './components/ui/Toast';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import AddItem from './pages/AddItem';
import ItemDetail from './pages/ItemDetail';
import FinishItem from './pages/FinishItem';
import MarkSold from './pages/MarkSold';
import GenerateListing from './pages/GenerateListing';
import Supplies from './pages/Supplies';
import ArchivedSupplies from './pages/ArchivedSupplies';
import EditArchivedSupply from './pages/EditArchivedSupply';
import SalesHistory from './pages/SalesHistory';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

function AppProvider({ children }) {
  const [items, setItems] = useState(() => storage.get(KEYS.items));
  const [supplies, setSupplies] = useState(() => storage.get(KEYS.supplies));
  const [allocs, setAllocs] = useState(() => storage.get(KEYS.allocs));
  const [savedStores, setSavedStores] = useState(() => storage.get(KEYS.savedStores));

  const saveItems = useCallback((val) => {
    setItems(val);
    storage.set(KEYS.items, val);
  }, []);

  const saveSupplies = useCallback((val) => {
    setSupplies(val);
    storage.set(KEYS.supplies, val);
  }, []);

  const saveAllocs = useCallback((val) => {
    setAllocs(val);
    storage.set(KEYS.allocs, val);
  }, []);

  const saveSavedStores = useCallback((val) => {
    setSavedStores(val);
    storage.set(KEYS.savedStores, val);
  }, []);

  return (
    <AppCtx.Provider value={{ items, supplies, allocs, savedStores, saveItems, saveSupplies, saveAllocs, saveSavedStores }}>
      {children}
    </AppCtx.Provider>
  );
}

function Layout() {
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  const onAuth = location.pathname === '/auth';

  if (loading) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner spinner-dark" />
      </div>
    );
  }

  if (!session && !onAuth) return <Navigate to="/auth" replace />;
  if (session && onAuth) return <Navigate to="/" replace />;

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/auth"             element={<Auth />} />
        <Route path="/"                 element={<Dashboard />} />
        <Route path="/inventory"        element={<Inventory />} />
        <Route path="/add"              element={<AddItem />} />
        <Route path="/item/:id"         element={<ItemDetail />} />
        <Route path="/item/:id/finish"  element={<FinishItem />} />
        <Route path="/item/:id/sold"    element={<MarkSold />} />
        <Route path="/item/:id/listing" element={<GenerateListing />} />
        <Route path="/supplies"          element={<Supplies />} />
        <Route path="/supplies/archived"     element={<ArchivedSupplies />} />
        <Route path="/supplies/archived/:id" element={<EditArchivedSupply />} />
        <Route path="/sales"            element={<SalesHistory />} />
      </Routes>
      {session && !onAuth && <BottomNav />}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Layout />
      </AppProvider>
    </BrowserRouter>
  );
}
