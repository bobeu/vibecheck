import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp,
  query,
  orderBy 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously,
  onAuthStateChanged 
} from 'firebase/auth';

declare global {
  var __app_id: string;
  var __firebase_config: any;
  var __initial_auth_token: string;
}

export interface WatchlistItem {
  tokenId: string;
  name: string;
  vibrancyScore?: number;
  isPremiumSlot: boolean;
  addedAt: any;
}

export interface PurchasedReport {
  tokenSymbol: string;
  purchasedAt: any;
  transactionHash: string;
}

class FirebaseService {
  private app: any;
  private db: any;
  private auth: any;
  private userId: string | null = null;
  private authInitialized = false;
  private onAuthChangeCallbacks: ((userId: string | null) => void)[] = [];

  constructor() {
    this.initializeFirebase();
  }

  private async initializeFirebase() {
    try {
      // Initialize Firebase with global config
      const firebaseConfig = typeof window !== 'undefined' ? 
        (window as any).__firebase_config : null;
      
      if (!firebaseConfig) {
        console.warn('Firebase config not available, using mock data');
        this.authInitialized = true;
        return;
      }

      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);

      // Set up auth state listener
      onAuthStateChanged(this.auth, (user) => {
        this.userId = user?.uid || null;
        this.authInitialized = true;
        
        // Notify all callbacks
        this.onAuthChangeCallbacks.forEach(callback => {
          callback(this.userId);
        });
      });

      // Attempt authentication
      await this.authenticate();
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      this.authInitialized = true;
    }
  }

  private async authenticate() {
    try {
      const initialToken = typeof window !== 'undefined' ? 
        (window as any).__initial_auth_token : null;

      if (initialToken) {
        await signInWithCustomToken(this.auth, initialToken);
      } else {
        await signInAnonymously(this.auth);
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      // Fallback to anonymous auth
      try {
        await signInAnonymously(this.auth);
      } catch (fallbackError) {
        console.error('Anonymous auth failed:', fallbackError);
      }
    }
  }

  onAuthChange(callback: (userId: string | null) => void) {
    this.onAuthChangeCallbacks.push(callback);
    
    // If auth is already initialized, call immediately
    if (this.authInitialized) {
      callback(this.userId);
    }
  }

  getCurrentUserId(): string | null {
    return this.userId;
  }

  isReady(): boolean {
    return this.authInitialized;
  }

  private getAppId(): string {
    return typeof window !== 'undefined' ? 
      (window as any).__app_id || 'vibecheck-dev' : 'vibecheck-dev';
  }

  private getUserPath(collection: string): string {
    return `artifacts/${this.getAppId()}/users/${this.userId}/${collection}`;
  }

  // Watchlist operations
  async getWatchlist(): Promise<WatchlistItem[]> {
    if (!this.db || !this.userId) {
      return JSON.parse(localStorage.getItem('watchlist') || '[]');
    }

    try {
      const watchlistRef = collection(this.db, this.getUserPath('watchlist'));
      const q = query(watchlistRef, orderBy('addedAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as WatchlistItem[];
    } catch (error) {
      console.error('Failed to get watchlist:', error);
      return JSON.parse(localStorage.getItem('watchlist') || '[]');
    }
  }

  async addToWatchlist(tokenId: string, name: string, isPremium: boolean = false): Promise<boolean> {
    if (!this.db || !this.userId) {
      // Fallback to localStorage
      const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
      const newItem = {
        tokenId,
        name,
        isPremiumSlot: isPremium,
        addedAt: new Date().toISOString()
      };
      watchlist.push(newItem);
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
      return true;
    }

    try {
      const docRef = doc(this.db, this.getUserPath('watchlist'), tokenId);
      await setDoc(docRef, {
        tokenId,
        name,
        isPremiumSlot: isPremium,
        addedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      return false;
    }
  }

  async removeFromWatchlist(tokenId: string): Promise<boolean> {
    if (!this.db || !this.userId) {
      // Fallback to localStorage
      const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
      const filtered = watchlist.filter((item: any) => item.tokenId !== tokenId);
      localStorage.setItem('watchlist', JSON.stringify(filtered));
      return true;
    }

    try {
      const docRef = doc(this.db, this.getUserPath('watchlist'), tokenId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      return false;
    }
  }

  // Real-time watchlist listener
  subscribeToWatchlist(callback: (watchlist: WatchlistItem[]) => void): () => void {
    if (!this.db || !this.userId) {
      // Fallback: call once with localStorage data
      const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
      callback(watchlist);
      return () => {};
    }

    try {
      const watchlistRef = collection(this.db, this.getUserPath('watchlist'));
      const q = query(watchlistRef, orderBy('addedAt', 'desc'));
      
      return onSnapshot(q, (snapshot) => {
        const watchlist = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as WatchlistItem[];
        callback(watchlist);
      });
    } catch (error) {
      console.error('Failed to subscribe to watchlist:', error);
      return () => {};
    }
  }

  // Premium status operations
  async setPremiumStatus(active: boolean, transactionHash?: string): Promise<boolean> {
    if (!this.db || !this.userId) {
      localStorage.setItem('premiumWatchlist', JSON.stringify({
        active,
        purchasedAt: new Date().toISOString(),
        transactionHash,
        maxTokens: 5
      }));
      return true;
    }

    try {
      const docRef = doc(this.db, this.getUserPath('settings'), 'premium');
      await setDoc(docRef, {
        active,
        purchasedAt: serverTimestamp(),
        transactionHash,
        maxTokens: 5
      });
      return true;
    } catch (error) {
      console.error('Failed to set premium status:', error);
      return false;
    }
  }

  async getPremiumStatus(): Promise<boolean> {
    if (!this.db || !this.userId) {
      const premium = JSON.parse(localStorage.getItem('premiumWatchlist') || 'null');
      return premium && premium.active;
    }

    try {
      const docRef = doc(this.db, this.getUserPath('settings'), 'premium');
      const snapshot = await getDocs(collection(this.db, this.getUserPath('settings')));
      const premiumDoc = snapshot.docs.find(d => d.id === 'premium');
      return premiumDoc?.data()?.active || false;
    } catch (error) {
      console.error('Failed to get premium status:', error);
      return false;
    }
  }

  // Purchased reports operations
  async addPurchasedReport(tokenSymbol: string, transactionHash: string): Promise<boolean> {
    if (!this.db || !this.userId) {
      const purchased = JSON.parse(localStorage.getItem('purchasedReports') || '[]');
      purchased.push({
        tokenSymbol,
        purchasedAt: new Date().toISOString(),
        transactionHash
      });
      localStorage.setItem('purchasedReports', JSON.stringify(purchased));
      return true;
    }

    try {
      const docRef = doc(this.db, this.getUserPath('reports'), tokenSymbol);
      await setDoc(docRef, {
        tokenSymbol,
        purchasedAt: serverTimestamp(),
        transactionHash
      });
      return true;
    } catch (error) {
      console.error('Failed to add purchased report:', error);
      return false;
    }
  }

  async hasReportAccess(tokenSymbol: string): Promise<boolean> {
    if (!this.db || !this.userId) {
      const purchased = JSON.parse(localStorage.getItem('purchasedReports') || '[]');
      return purchased.some((report: any) => report.tokenSymbol === tokenSymbol);
    }

    try {
      const docRef = doc(this.db, this.getUserPath('reports'), tokenSymbol);
      const snapshot = await getDocs(collection(this.db, this.getUserPath('reports')));
      return snapshot.docs.some(d => d.id === tokenSymbol);
    } catch (error) {
      console.error('Failed to check report access:', error);
      return false;
    }
  }
}

export const firebaseService = new FirebaseService();
