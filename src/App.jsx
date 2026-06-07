import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { storage, KEYS } from './storage';
import { supabase } from './supabaseClient';
import BottomNav from './components/ui/BottomNav';
import ToastContainer, { showToast } from './components/ui/Toast';
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
  const [items, setItems] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [allocs, setAllocs] = useState([]);
  const [savedStores, setSavedStores] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const loadedUserRef = useRef(null);

  // Load the signed-in user's data from Supabase; reload on login, clear on logout.
  useEffect(() => {
    let active = true;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        loadedUserRef.current = null;
        if (active) { setItems([]); setSupplies([]); setAllocs([]); setDataLoading(false); }
        return;
      }
      if (loadedUserRef.current === user.id) { if (active) setDataLoading(false); return; }
      loadedUserRef.current = user.id;
      if (active) setDataLoading(true);
      try {
        const [i, s, a, st] = await Promise.all([
          storage.get(KEYS.items),
          storage.get(KEYS.supplies),
          storage.get(KEYS.allocs),
          storage.get(KEYS.savedStores),
        ]);
        if (active) { setItems(i); setSupplies(s); setAllocs(a); setSavedStores(st); }
      } catch (e) {
        console.error(e);
        showToast('Failed to load your data', 'error');
      } finally {
        if (active) setDataLoading(false);
      }
    }

    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') load();
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const saveItems = useCallback(async (val) => {
    setItems(val);
    try { await storage.set(KEYS.items, val); }
    catch (e) { console.error(e); showToast('Failed to save changes', 'error'); }
  }, []);

  const saveSupplies = useCallback(async (val) => {
    setSupplies(val);
    try { await storage.set(KEYS.supplies, val); }
    catch (e) { console.error(e); showToast('Failed to save changes', 'error'); }
  }, []);

  const saveAllocs = useCallback(async (val) => {
    setAllocs(val);
    try { await storage.set(KEYS.allocs, val); }
    catch (e) { console.error(e); showToast('Failed to save changes', 'error'); }
  }, []);

  const saveSavedStores = useCallback((val) => {
    setSavedStores(val);
    storage.set(KEYS.savedStores, val);
  }, []);

  if (dataLoading) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner spinner-dark" />
      </div>
    );
  }

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
