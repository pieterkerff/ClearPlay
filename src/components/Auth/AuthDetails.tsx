import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthDetails.css'; // Ensure this CSS is appropriate or make specific one

const AuthDetails: React.FC = () => {
    const { currentUser, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            let errorMessage = "Failed to log out";
            if ((error as { code?: string })?.code) {
                errorMessage = `Logout Error: ${(error as Error).message}`;
            } else if (error instanceof Error) {
                errorMessage = `Logout Error: ${error.message}`;
            }
            console.error(errorMessage, error);
            // Consider using a more user-friendly notification system than alert
            alert(errorMessage);
        }
    };

    // This component is only rendered if currentUser exists (controlled by Sidebar)
    if (!currentUser) return null;

    return (
        <div className="auth-details-in-sidebar">
            <div className="user-info-sidebar">
                <span className="user-email-text">{currentUser.email}</span>
            </div>
            <button onClick={handleLogout} className="logout-button-sidebar">
                Logout
            </button>
        </div>
    );
};

export default AuthDetails;