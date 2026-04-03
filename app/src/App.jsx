import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import RefinePage from './pages/RefinePage';
import ResultsPage from './pages/ResultsPage';
import ReportPage from './pages/ReportPage';

function App() {
  return (
    <BrowserRouter basename="/fuidani.com">
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/refine" element={<RefinePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
