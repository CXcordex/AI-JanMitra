import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Chat from './pages/Chat';
import Scanner from './pages/Scanner';
import SchemeFinder from './pages/SchemeFinder';
import Login from './pages/Login';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/schemes" element={<SchemeFinder />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
