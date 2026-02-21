import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wxhioiyilbgxvksxusya.supabase.co';
// Export the anon key so it can be used in other files if needed (e.g. for manual headers)
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4aGlvaXlpbGJneHZrc3h1c3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4ODkyMDQsImV4cCI6MjA4NjQ2NTIwNH0.MH32Bbu9AnprKBVG_4FgCfWG0NZk_g76uKMBuT5PbJI';

const CustomStorage = {
  getItem: (key: string) => {
    if (typeof window !== 'undefined') {
      return AsyncStorage.getItem(key);
    }
    return Promise.resolve(null);
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      return AsyncStorage.setItem(key, value);
    }
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      return AsyncStorage.removeItem(key);
    }
    return Promise.resolve();
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: CustomStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
