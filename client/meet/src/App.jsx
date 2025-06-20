  import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
  import Navbar from './components/Navbar';
  import Home from './pages/Home';
  import Chat from '../src/pages/chat';
  import Meet from '../src/pages/meet';

  function App() {
    return (
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/meet" element={<Meet />} />
        </Routes>
      </Router>
    );
  }

  export default App;
