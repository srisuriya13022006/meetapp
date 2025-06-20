import { Link } from 'react-router-dom';
import '../styles/navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar" >
      <Link to="/">Home</Link>
      <Link to="/chat" style={{ margin: '0 10px', color: 'white' }}>Chat</Link>
      <Link to="/meet" style={{ margin: '0 10px', color: 'white' }}>Meet</Link>
    </nav>
  );
}
