import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SmartBottleAnalyzer from './pages/SmartBottleAnalyzer';
import Inventory from './pages/Inventory';

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/smart-bottle" element={<SmartBottleAnalyzer />} />
                <Route path="/inventory" element={<Inventory />} />
            </Routes>
        </Router>
    );
}
