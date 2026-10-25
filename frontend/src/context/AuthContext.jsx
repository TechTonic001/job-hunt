/* oxlint-disable react/only-export-components */
import { createContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

export const AuthContext = createContext({
  user: null,
  loading: true,
  getIdToken: async () => null,
  signOutUser: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getIdToken = async (forceRefresh = false) => {
    if (!user) return null;
    return await user.getIdToken(forceRefresh);
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, getIdToken, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
