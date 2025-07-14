import type { Signal } from "@builder.io/qwik";

export type BillingCycle = 'free' | 'monthly' | 'yearly' | 'lifetime';

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    billing_cycle: BillingCycle;
    blog_limit: number;
    post_limit: number;
    features: string[];
    created_at: Date | string;
}

export interface PostData {
    id: string;
    title: string;
    title_sanitized: string;
    blog_id: string;
    description?: string;
    status?: string;
    content?: string;
    created_at?: Date | string;
    updated_at?: Date | string;
    thisPostIsNew?: boolean;
    comments_enabled?: boolean;
}

export interface BlogData {
    id: string;
    user_id?: string;
    status?: string;
    title: string;
    title_sanitized: string;
    description?: string;
    body?: string;
    image?: string;
    posts?: PostData[];
    pubDate?: Date;
    created_at?: Date | string;
    updatedDate?: Date;
    theme?: string;
}

export interface BlogCookieItem {
    id: string;
    title: string;
    title_sanitized: string;
    description?: string;
    theme?: string;
    posts: PostData[];
}

export interface UpdateBlogTitleParams {
    isAuthorized: boolean;
    titleValue: string;
    blogId: string;
    showSaveSuccess: Signal<boolean>;
    hasChanges: Signal<boolean>;
    isSaving: Signal<boolean>;
    errorMessage: Signal<string>;
    originalTitle: Signal<string>;
}

export interface UpdatePostTitleParams {
    isAuthorized: boolean;
    blogId: string;
    postId: string;
    titleValue: string;
    showSaveSuccess: Signal<boolean>;
    hasChanges: Signal<boolean>;
    isSaving: Signal<boolean>;
    errorMessage: Signal<string>;
    originalTitle?: Signal<string>;
}

export type UserField = 'name' | 'email' | 'avatar_url' | 'bio' | 'website' | 'social_links' | 'location' | 'skills';

export interface UserInfo {
    id: string;
    email?: string;
    name?: string;
    avatar_url?: string;
    bio?: string;
    website?: string;
    social_links?: Record<string, string>;
    location?: string;
    skills?: string[];
    created_at?: string;
    subscription_plan_id?: string;
    subscription_expires_at?: string | null;
}

export interface CommentWithUser {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    user: {
        name: string;
        avatar_url: string | null;
    };
}