import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, pin: string) => Promise<void>;
    signOut: () => Promise<void>;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                setLoading(false);
            }
        });

        // 2. Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (sbUser: SupabaseUser) => {
        try {
            // Try getting profile
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sbUser.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
            }

            const rawRole = data?.role || 'worker';
            // Normalize: "admin" -> "Admin", "worker" -> "Worker"
            const role = (rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase()) as UserRole;
            const name = data?.name || sbUser.email?.split('@')[0] || 'User';

            setUser({
                id: sbUser.id,
                name: name,
                role: role,
                pin: data?.pin_code || '' // Optional mapping
            });
        } catch (e) {
            console.error("Auth profile fetch error", e);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, pin: string) => {
        // Use Supabase Auth with Password (where pin is the password)
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: pin
        });
        if (error) throw error;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            signIn,
            signOut,
            isAdmin: user?.role === UserRole.ADMIN
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
