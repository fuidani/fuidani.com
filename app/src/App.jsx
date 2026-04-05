import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import RefinePage from './pages/RefinePage';
import ResultsPage from './pages/ResultsPage';
import ReportPage from './pages/ReportPage';

function App() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const root = document.documentElement;
    const visualViewport = window.visualViewport;

    const syncViewportHeight = () => {
      const nextHeight = visualViewport?.height ?? window.innerHeight;
      root.style.setProperty('--app-height', `${Math.round(nextHeight)}px`);
    };

    syncViewportHeight();
    window.addEventListener('resize', syncViewportHeight);
    visualViewport?.addEventListener('resize', syncViewportHeight);
    visualViewport?.addEventListener('scroll', syncViewportHeight);

    return () => {
      window.removeEventListener('resize', syncViewportHeight);
      visualViewport?.removeEventListener('resize', syncViewportHeight);
      visualViewport?.removeEventListener('scroll', syncViewportHeight);
    };
  }, []);

  return (
    <BrowserRouter>
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
