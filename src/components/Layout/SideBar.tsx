import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthDetails from '../Auth/AuthDetails';
import './SideBar.css';

interface SideBarProps {
    activeView: 'home' | 'search' | 'library';
    onSetView: (view: 'home' | 'search' | 'library') => void;
}

const SideBar: React.FC<SideBarProps> = ({ activeView, onSetView }) => {
    const { currentUser } = useAuth();

    return (
        <aside className="App-sidebar">
            <div className="sidebar-header">
                <h1>MusicHub</h1>
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
                                onClick={() => onSetView('library')}
                                className={`nav-link ${activeView === 'library' ? 'active' : ''}`}
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