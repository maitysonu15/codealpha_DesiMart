import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { auth } from '../config/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

const DEFAULT_USERS = [
  {
    id: 'user-demo-1',
    name: 'Demo User',
    email: 'user@desimart.com',
    password: 'password123',
    mobile: '9876543210',
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103',
    createdAt: '2026-01-15'
  },
  {
    id: 'user-demo-2',
    name: 'Priya Sharma',
    email: 'priya@desimart.com',
    password: 'password123',
    mobile: '9988776655',
    address: '12-B, Connaught Place, New Delhi - 110001',
    createdAt: '2026-02-10'
  }
];

export function AuthProvider({ children }) {
  const { showToast } = useToast();

  // Load registered users from localStorage or default seed
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('desimart_registered_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse registered users from localStorage', e);
    }
    return DEFAULT_USERS;
  });

  // Load current active session user from localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('desimart_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to parse active user session', e);
      return null;
    }
  });

  // Persist registered users array whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('desimart_registered_users', JSON.stringify(users));
    } catch (e) {
      console.error('Failed to persist users to localStorage', e);
    }
  }, [users]);

  // Persist active session whenever currentUser changes
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('desimart_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('desimart_current_user');
      }
    } catch (e) {
      console.error('Failed to persist current user session', e);
    }
  }, [currentUser]);

  // Email/Mobile & Password Login
  const login = (emailOrMobile, password) => {
    const clean = emailOrMobile.trim().toLowerCase();
    const match = users.find(
      (u) => (u.email.toLowerCase() === clean || u.mobile === clean) && u.password === password
    );

    if (match) {
      setCurrentUser(match);
      const firstName = match.name.split(' ')[0];
      showToast(`Welcome back, ${firstName}!`, 'success');
      return { success: true, user: match };
    } else {
      showToast('Invalid email/mobile or password.', 'error');
      return { success: false, message: 'Invalid credentials. Please check your password.' };
    }
  };

  // Quick Login via OTP
  const loginWithOtp = (identifier) => {
    const clean = identifier.trim().toLowerCase();
    let match = users.find(
      (u) => u.email.toLowerCase() === clean || u.mobile === clean
    );

    if (!match) {
      // Create new user account if not existing
      const isEmail = clean.includes('@');
      match = {
        id: `user-${Date.now()}`,
        name: isEmail ? clean.split('@')[0] : 'Shopper',
        email: isEmail ? clean : `${clean}@desimart.in`,
        mobile: !isEmail ? clean : '',
        password: 'password123',
        address: '',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setUsers((prev) => [...prev, match]);
    }

    setCurrentUser(match);
    const firstName = match.name.split(' ')[0];
    showToast(`Signed in with OTP! Welcome, ${firstName}.`, 'success');
    return { success: true, user: match };
  };

  // Register New Account
  const register = (name, email, password, mobile = '', address = '') => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();

    const exists = users.some(
      (u) => u.email.toLowerCase() === cleanEmail || (cleanMobile && u.mobile === cleanMobile)
    );

    if (exists) {
      showToast('An account with this email or mobile number already exists.', 'error');
      return { success: false, message: 'Account already exists. Please Sign In.' };
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      password,
      address: address.trim(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    const firstName = name.trim().split(' ')[0];
    showToast(`Welcome to DesiMart, ${firstName}! Account created.`, 'success');
    return { success: true, user: newUser };
  };

  // Reset / Forgot Password
  const resetPassword = (identifier, newPassword) => {
    const clean = identifier.trim().toLowerCase();
    const match = users.find(
      (u) => u.email.toLowerCase() === clean || u.mobile === clean
    );

    if (!match) {
      showToast('No user found matching this email or mobile.', 'error');
      return { success: false, message: 'Account not found.' };
    }

    const updatedUser = { ...match, password: newPassword };
    setUsers((all) => all.map((u) => (u.id === match.id ? updatedUser : u)));
    
    if (currentUser && currentUser.id === match.id) {
      setCurrentUser(updatedUser);
    }

    showToast('Password updated successfully! Please Sign In.', 'success');
    return { success: true, message: 'Password reset completed.' };
  };

  // Update Profile Info (Name, Email, Mobile, Address)
  const updateUserProfile = (updates) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setUsers((all) => all.map((u) => (u.id === currentUser.id ? updated : u)));
    showToast('Profile details updated successfully!', 'success');
  };

  // Change Password for Logged In User
  const changePassword = (currentPassword, newPassword) => {
    if (!currentUser) return { success: false, message: 'Not logged in' };
    if (currentUser.password !== currentPassword) {
      showToast('Current password does not match.', 'error');
      return { success: false, message: 'Current password incorrect.' };
    }

    updateUserProfile({ password: newPassword });
    showToast('Your password has been changed successfully!', 'success');
    return { success: true };
  };

  // Real-world Firebase Google Social Sign-In
  const socialLogin = async (provider = 'Google') => {
    if (provider === 'Google') {
      const googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: 'select_account' });

      try {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;

        const userProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Google User',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || '',
          mobile: fbUser.phoneNumber || '',
          address: '',
          createdAt: new Date().toISOString().split('T')[0],
          isSocial: true,
          provider: 'Google'
        };

        setUsers((prev) => {
          const existing = prev.find((u) => u.email === fbUser.email || u.id === fbUser.uid);
          if (existing) {
            return prev.map((u) => (u.email === fbUser.email || u.id === fbUser.uid ? { ...u, ...userProfile } : u));
          }
          return [...prev, userProfile];
        });

        setCurrentUser(userProfile);
        const firstName = userProfile.name.split(' ')[0];
        showToast(`Signed in with Google as ${firstName}!`, 'success');
        return { success: true, user: userProfile };
      } catch (error) {
        console.error('Firebase Google Sign-In error:', error);
        if (error.code === 'auth/popup-closed-by-user') {
          showToast('Google Sign-In popup was closed.', 'info');
          return { success: false, message: 'Popup closed' };
        } else if (error.code === 'auth/cancelled-popup-request') {
          return { success: false, message: 'Cancelled' };
        } else {
          showToast(`Google Sign-In failed: ${error.message || 'Authentication error'}`, 'error');
          return { success: false, message: error.message };
        }
      }
    }
  };

  // Logout Session
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase SignOut warning:', e);
    }
    setCurrentUser(null);
    showToast('You have been signed out.', '');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        loginWithOtp,
        register,
        resetPassword,
        updateUserProfile,
        changePassword,
        socialLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
