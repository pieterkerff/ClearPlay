import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthDetails from '../Auth/AuthDetails';
import './SideBar.css';

interface SideBarProps {
    activeView: 'home' | 'search' | 'library'; // Add more views as needed
    onSetView: (view: 'home' | 'search' | 'library') => void;
    isLoggedIn: boolean;
}

const SideBar: React.FC<SideBarProps> = ({ activeView, onSetView }) => {
    const { currentUser } = useAuth();

    return (
        <aside className="App-sidebar">
            <div className="sidebar-header">
                <h1>ClearPlay</h1>
            </div>
            <nav className="sidebar-nav">
                <ul>
                    <li>
                        <button
                            onClick={() => onSetView('home')}
                            className={`nav-link ${activeView === 'home' ? 'active' : ''}`}
                        >
                            Home
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => onSetView('search')}
                            className={`nav-link ${activeView === 'search' ? 'active' : ''}`}
                        >
                            Search
                        </button>
                    </li>
                    {currentUser && (
                        <li>
                            <button
                                onClick={() => onSetView('library')} // Placeholder for now
                                className={`nav-link ${activeView === 'library' ? 'active' : ''}`}
                                disabled // Disable library until implemented
                            >
                                Your Library
                            </button>
                        </li>
                    )}
                </ul>
            </nav>

            {currentUser && (
                <div className="sidebar-user-section">
                    <AuthDetails />
                </div>
            )}
        </aside>
    );
};

export default SideBar;