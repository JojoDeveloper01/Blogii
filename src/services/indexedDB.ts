import type { BlogData } from "@lib/types";
import { sanitizeString } from "@lib/utils";

const DB_NAME = 'blogiiDB';
const DB_VERSION = 1;
const STORE_DRAFTS = 'drafts';
const STORE_TEMP = 'tempBlog';

export class BlogDatabase {
    private static instance: BlogDatabase;
    private db: IDBDatabase | null = null;
    private connecting: Promise<void> | null = null;
    private cache: Map<string, any> = new Map();

    private constructor() { }

    static getInstance(): BlogDatabase {
        if (!BlogDatabase.instance) {
            BlogDatabase.instance = new BlogDatabase();
        }
        return BlogDatabase.instance;
    }

    async init(): Promise<void> {
        if (this.db) return;
        if (this.connecting) return this.connecting;

        this.connecting = new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = () => {
                    this.connecting = null;
                    reject(request.error);
                };

                request.onsuccess = () => {
                    this.db = request.result;

                    // Reabrir conexão se fechar inesperadamente
                    this.db.onclose = () => {
                        this.db = null;
                        this.connecting = null;
                    };

                    this.db.onerror = (event) => {
                        console.error("Database error:", event);
                    };

                    resolve();
                };

                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;

                    if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
                        db.createObjectStore(STORE_DRAFTS, { keyPath: 'id', autoIncrement: true });
                    }

                    if (!db.objectStoreNames.contains(STORE_TEMP)) {
                        db.createObjectStore(STORE_TEMP, { keyPath: 'id' });
                    }
                };
            } catch (err) {
                this.connecting = null;
                reject(err);
            }
        });

        return this.connecting;
    }

    async getTempBlog(): Promise<BlogData | null> {
        // Verificar cache primeiro
        if (this.cache.has('tempBlog')) {
            return this.cache.get('tempBlog');
        }

        await this.init();
        if (!this.db) throw new Error("Database not initialized");

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_TEMP], 'readonly');
            const store = transaction.objectStore(STORE_TEMP);
            const request = store.get('temp');

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const result = request.result || null;
                // Armazenar em cache
                this.cache.set('tempBlog', result);
                resolve(result);
            };
        });
    }

    async saveTempBlog(blog: BlogData): Promise<void> {
        await this.init();
        if (!this.db) throw new Error("Database not initialized");

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_TEMP], 'readwrite');
            const store = transaction.objectStore(STORE_TEMP);
            const request = store.put({ ...blog, id: 'temp' });

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                // Atualizar cache
                this.cache.set('tempBlog', blog);
                resolve();
            };
        });
    }

    async saveDraft(draft: BlogData): Promise<number> {
        await this.init();
        if (!this.db) throw new Error("Database not initialized");

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_DRAFTS], 'readwrite');
            const store = transaction.objectStore(STORE_DRAFTS);

            const request = store.add(draft);

            transaction.onerror = () => reject(transaction.error);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result as number);
        });
    }

    async getAllDrafts(): Promise<BlogData[]> {
        await this.init();
        if (!this.db) throw new Error("Database not initialized");

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_DRAFTS], 'readonly');
            const store = transaction.objectStore(STORE_DRAFTS);

            const request = store.getAll();

            transaction.onerror = () => reject(transaction.error);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async validateBlogId(id: string): Promise<boolean> {
        const blog = await this.getTempBlog();
        if (!blog) return false;

        return sanitizeString(blog.data.title, 1) === id;
    }

    // Limpar cache quando necessário
    clearCache() {
        this.cache.clear();
    }

    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.connecting = null;
        }
    }
}

export const blogDB = BlogDatabase.getInstance();

if (typeof window !== 'undefined') {
    blogDB.init().catch(console.error);

    window.addEventListener('unload', () => {
        if (blogDB['db']) {
            blogDB['db'].close();
        }
    });
}
