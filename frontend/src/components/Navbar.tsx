import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';

const Navbar = () => {
    const location = useLocation();
    const { isAuthenticated, user, logout } = useAuth();

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <span className="logo-icon">⚡</span>
                    <span className="logo-text">Django React</span>
                </Link>

                <ul className="navbar-menu">
                    <li>
                        <Link
                            to="/"
                            className={`navbar-link ${isActive('/') ? 'active' : ''}`}
                        >
                            Home
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/about"
                            className={`navbar-link ${isActive('/about') ? 'active' : ''}`}
                        >
                            About
                        </Link>
                    </li>
                    {isAuthenticated && (
                        <li>
                            <Link
                                to="/dashboard"
                                className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
                            >
                                Dashboard
                            </Link>
                        </li>
                    )}
                </ul>

                <div className="navbar-actions">
                    {isAuthenticated ? (
                        <div className="user-menu">
                            <span className="user-email">{user?.email}</span>
                            <button className="btn-secondary" onClick={logout}>Logout</button>
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="btn-secondary">Sign In</Link>
                            <Link to="/register" className="btn-primary">Get Started</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
