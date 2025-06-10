import type { BlogData } from "@lib/types";

const DB_NAME = 'blogiiDB';
const DB_VERSION = 2;
const STORE_BLOGS = 'blogs';

export interface IBlogDatabase {
    getBlog(id: string): Promise<BlogData | null>;
    saveBlog(blog: BlogData): Promise<void>;
    getAllBlogs(): Promise<BlogData[]>;
    deleteBlog(id: string): Promise<void>;
    close(): Promise<void>;
}

export class BlogDatabase implements IBlogDatabase {
    private static instance: BlogDatabase;
    private db: IDBDatabase | null = null;
    private connecting: Promise<void> | null = null;

    private constructor() { }

    static getInstance(): BlogDatabase {
        if (!BlogDatabase.instance) {
            BlogDatabase.instance = new BlogDatabase();
        }
        return BlogDatabase.instance;
    }

    public async init(): Promise<void> {
        if (this.db) return;
        if (this.connecting) return this.connecting;

        this.connecting = new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = () => {
                    console.error('Error opening database:', request.error);
                    reject(request.error);
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    resolve();
                };

                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    const oldVersion = event.oldVersion;
                    
                    // Create blogs store if it doesn't exist
                    if (!db.objectStoreNames.contains(STORE_BLOGS)) {
                        db.createObjectStore(STORE_BLOGS, { keyPath: 'id' });
                    }

                    // Handle migration from old stores
                    if (oldVersion < 2) {
                        // Delete old stores if they exist
                        if (db.objectStoreNames.contains('drafts')) {
                            db.deleteObjectStore('drafts');
                        }
                        if (db.objectStoreNames.contains('tempBlog')) {
                            db.deleteObjectStore('tempBlog');
                        }
                    }
                };
            } catch (err) {
                console.error('Error in init:', err);
                reject(err);
            }
        });

        return this.connecting;
    }

    async getBlog(id: string): Promise<BlogData | null> {
        await this.init();
        if (!this.db) throw new Error("Database not initialized");

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_BLOGS], 'readonly');
            const store = transaction.objectStore(STORE_BLOGS);
            const request = store.get(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || null);
        });
    }

    async saveBlog(blog: BlogData): Promise<void> {
        await this.init();
        if (!this.db) throw new Error("Database not initialized");

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_BLOGS], 'readwrite');
            const store = transaction.objectStore(STORE_BLOGS);
            const request = store.put(blog);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async getAllBlogs(): Promise<BlogData[]> {
        await this.init();
        if (!this.db) throw new Error("Database not initialized");

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_BLOGS], 'readonly');
            const store = transaction.objectStore(STORE_BLOGS);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    async deleteBlog(id: string): Promise<void> {
        await this.init();
        if (!this.db) throw new Error("Database not initialized");

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_BLOGS], 'readwrite');
            const store = transaction.objectStore(STORE_BLOGS);
            const request = store.delete(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    // Limpar cache quando necessário
    async close(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.connecting = null;
        }
    }
}

export const localBlogDB = BlogDatabase.getInstance();

if (typeof window !== 'undefined') {
    localBlogDB.init().then(() => {
    }).catch(error => {
    });

    window.addEventListener('unload', () => {
        if (localBlogDB['db']) {
            localBlogDB['db'].close();
        }
    });
}
