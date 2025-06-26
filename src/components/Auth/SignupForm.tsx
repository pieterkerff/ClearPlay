import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthForm.css';

const SignupForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await signup(email, password);
            // Signup successful, AuthContext handles the rest
        } catch (err) {
            let friendlyMessage = 'Failed to create an account. Please try again.';

            // Define a type guard for FirebaseError-like objects
            const isFirebaseError = (error: unknown): error is { code: string } =>
                typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code: unknown }).code === 'string';

            // Translate common Firebase error codes into friendly messages
            if (isFirebaseError(err)) {
                switch (err.code) {
                    case 'auth/email-already-in-use':
                        friendlyMessage = 'This email address is already in use by another account.';
                        break;
                    case 'auth/invalid-email':
                        friendlyMessage = 'The email address is not valid.';
                        break;
                    case 'auth/weak-password':
                        friendlyMessage = 'The password is too weak. It must be at least 6 characters long.';
                        break;
                    default:
                        // The default message will be used for other, less common errors
                        console.error("Signup Error:", err); // Log the original error for debugging
                        break;
                }
            } else {
                console.error("Signup Error:", err);
            }
            setError(friendlyMessage);
        }
        setLoading(false);
    };

    return (
        <div className="auth-form-container">
            <h2>Sign Up</h2>
            {error && <p className="auth-error">{error}</p>}
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="signup-email">Email</label>
                    <input
                        type="email"
                        id="signup-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="signup-password">Password</label>
                    <input
                        type="password"
                        id="signup-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="signup-confirm-password">Confirm Password</label>
                    <input
                        type="password"
                        id="signup-confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>
                <button type="submit" className="auth-button" disabled={loading}>
                    {loading ? 'Signing up...' : 'Sign Up'}
                </button>
            </form>
        </div>
    );
};

export default SignupForm;