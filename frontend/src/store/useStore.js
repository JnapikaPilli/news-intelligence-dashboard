import { create } from 'zustand';

export const useStore = create((set) => ({
  // Theme state
  theme: 'dark', // Default to dark for premium look
  initTheme: () => {
    if (!document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('dark');
    }
  },
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),

  // Language state
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),

  // News state
  news: [],
  isLoadingNews: false,
  setNews: (news) => set({ news }),
  setIsLoadingNews: (loading) => set({ isLoadingNews: loading }),

  // Chat/RAG state
  chatHistory: [],
  addChatMessage: (msg) => set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
  setChatHistory: (history) => set({ chatHistory: history }),
  isUploading: false,
  setIsUploading: (uploading) => set({ isUploading: uploading }),
  currentDocumentId: null,
  setCurrentDocumentId: (id) => set({ currentDocumentId: id }),
  isChatLoading: false,
  setIsChatLoading: (loading) => set({ isChatLoading: loading }),

  // Search state
  searchResults: null,
  isSearching: false,
  searchQuery: '',
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
