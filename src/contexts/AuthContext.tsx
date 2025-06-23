import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    AuthError
} from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase'; // Your firebase.ts initialization

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signup: (email: string, password: string) => Promise<User | null>;
    login: (email: string, password: string) => Promise<User | null>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const signup = async (email: string, password: string): Promise<User | null> => {
        try {
            const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
            return userCredential.user;
        } catch (error) {
            // Handle specific Firebase error codes if needed
            console.error("Signup error:", (error as AuthError).message);
            throw error; // Re-throw to be caught by the form
        }
    };

    const login = async (email: string, password: string): Promise<User | null> => {
        try {
            const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
            return userCredential.user;
        } catch (error) {
            console.error("Login error:", (error as AuthError).message);
            throw error;
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await signOut(firebaseAuth);
        } catch (error) {
            console.error("Logout error:", (error as AuthError).message);
            throw error;
        }
    };

    useEffect(() => {
        // onAuthStateChanged returns an unsubscribe function
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    const value: AuthContextType = {
        currentUser,
        loading,
        signup,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};