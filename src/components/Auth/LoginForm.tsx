import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthForm.css';

const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    type AuthError = {
        code?: string;
        message?: string;
        [key: string]: unknown;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            // Login successful, AuthContext handles the rest
        } catch (err) {
            const error = err as AuthError;
            let friendlyMessage = 'An unexpected error occurred. Please try again.';
            
            // Translate common Firebase error codes into friendly messages
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    friendlyMessage = 'Invalid email or password. Please try again.';
                    break;
                case 'auth/too-many-requests':
                    friendlyMessage = 'Access to this account has been temporarily disabled due to many failed login attempts. You can try again later.';
                    break;
                case 'auth/invalid-email':
                    friendlyMessage = 'The email address is not valid.';
                    break;
                default:
                    // The default message will be used for other, less common errors
                    console.error("Login Error:", error); // Log the original error for debugging
                    break;
            }
            setError(friendlyMessage);
        }
        setLoading(false);
    };

    return (
        <div className="auth-form-container">
            <h2>Login</h2>
            {error && <p className="auth-error">{error}</p>}
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="login-email">Email</label>
                    <input
                        type="email"
                        id="login-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="login-password">Password</label>
                    <input
                        type="password"
                        id="login-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="auth-button" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default LoginForm;