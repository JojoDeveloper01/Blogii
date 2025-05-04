// Global configuration that can be used both on server and client side
export const globalConfig = {
    // Site information
    site: {
        name: "MyBlogii",
        description: "Your personal blog platform",
        url: import.meta.env.PUBLIC_SITE_URL || "http://localhost:4321",
    },

    // Feature flags
    features: {
        enableComments: true,
        enableSearch: true,
        enableDarkMode: true,
    },

    // API endpoints
    api: {
        baseUrl: import.meta.env.PUBLIC_API_URL || "http://localhost:4321/api",
    },

    // Social media links
    social: {
        twitter: "https://twitter.com/yourusername",
        github: "https://github.com/yourusername",
    },

    // Theme configuration
    theme: {
        primaryColor: "#3B82F6",
        secondaryColor: "#10B981",
    },
} as const;

// Type for the global config
export type GlobalConfig = typeof globalConfig;

// Helper function to get a nested value from the config
export function getConfig<T extends keyof GlobalConfig>(
    key: T
): GlobalConfig[T] {
    return globalConfig[key];
}

// Helper function to get a deeply nested value
export function getNestedConfig<T extends keyof GlobalConfig, K extends keyof GlobalConfig[T]>(
    section: T,
    key: K
): GlobalConfig[T][K] {
    return globalConfig[section][key];
} 