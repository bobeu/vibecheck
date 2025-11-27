// Minimal AsyncStorage stub for web builds to satisfy libraries expecting RN AsyncStorage
// This avoids bundling react-native packages in Next.js while providing no-op storage.

const AsyncStorage = {
  getItem: async (_key: string): Promise<string | null> => null,
  setItem: async (_key: string, _value: string): Promise<void> => {},
  removeItem: async (_key: string): Promise<void> => {},
  clear: async (): Promise<void> => {},
  // Optional sync-like API some SDKs may check
  // @ts-ignore
  getAllKeys: async (): Promise<string[]> => [],
};

export default AsyncStorage;