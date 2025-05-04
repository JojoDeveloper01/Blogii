import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface DraftPost {
    id: string;
    title: string;
    content: string;
    coverImage?: string;
    createdAt: Date;
    updatedAt: Date;
    isPublished: boolean;
    authorId?: string; // será preenchido quando o usuário fizer login
}

interface DraftStore {
    drafts: DraftPost[];
    currentDraft: DraftPost | null;
    addDraft: (draft: Omit<DraftPost, 'id' | 'createdAt' | 'updatedAt' | 'isPublished'>) => void;
    updateDraft: (id: string, updates: Partial<DraftPost>) => void;
    deleteDraft: (id: string) => void;
    setCurrentDraft: (draft: DraftPost | null) => void;
    publishDraft: (id: string) => Promise<void>;
}

export const useDraftStore = create<DraftStore>()(
    persist(
        (set, get) => ({
            drafts: [],
            currentDraft: null,

            addDraft: (draftData: Omit<DraftPost, 'id' | 'createdAt' | 'updatedAt' | 'isPublished'>) => {
                const newDraft: DraftPost = {
                    ...draftData,
                    id: crypto.randomUUID(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isPublished: false,
                };
                set((state) => ({
                    drafts: [...state.drafts, newDraft],
                    currentDraft: newDraft,
                }));
            },

            updateDraft: (id: string, updates: Partial<DraftPost>) => {
                set((state) => ({
                    drafts: state.drafts.map((draft) =>
                        draft.id === id
                            ? { ...draft, ...updates, updatedAt: new Date() }
                            : draft
                    ),
                    currentDraft:
                        state.currentDraft?.id === id
                            ? { ...state.currentDraft, ...updates, updatedAt: new Date() }
                            : state.currentDraft,
                }));
            },

            deleteDraft: (id: string) => {
                set((state) => ({
                    drafts: state.drafts.filter((draft) => draft.id !== id),
                    currentDraft: state.currentDraft?.id === id ? null : state.currentDraft,
                }));
            },

            setCurrentDraft: (draft: DraftPost | null) => {
                set({ currentDraft: draft });
            },

            publishDraft: async (id: string) => {
                const draft = get().drafts.find((d) => d.id === id);
                if (!draft) return;

                try {
                    const response = await fetch('/api/posts', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(draft),
                    });

                    if (!response.ok) throw new Error('Failed to publish post');

                    set((state) => ({
                        drafts: state.drafts.filter((d) => d.id !== id),
                        currentDraft: state.currentDraft?.id === id ? null : state.currentDraft,
                    }));
                } catch (error) {
                    console.error('Error publishing draft:', error);
                    throw error;
                }
            },
        }),
        {
            name: 'blog-drafts',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ drafts: state.drafts }),
        }
    )
); 