import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Sensors } from './pages/Sensors';
import { SensorDetail } from './pages/SensorDetail';
import { Readings } from './pages/Readings';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sensors" element={<Sensors />} />
          <Route path="/sensors/:serialNumber" element={<SensorDetail />} />
          <Route path="/readings" element={<Readings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
