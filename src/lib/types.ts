import type { Signal } from "@builder.io/qwik";

export interface PostData {
    id: string;
    title: string;
    blog_id: string;
    status?: string;
    content?: string;
    created_at?: Date | string;
    updated_at?: Date | string;
}

export interface BlogData {
    collection?: string;
    id: string;
    user_id?: string;
    title: string;
    description?: string;
    body?: string;
    image?: string;
    posts?: PostData[];
    pubDate?: Date;
    created_at?: Date | string;
    updatedDate?: Date;
}

export interface BlogCookieItem {
	id: string;
	title: string;
	posts: Array<{
		id: string;
		title: string;
	}>;
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

export interface UserInfo {
  id: string;
  email: string;
  name?: string | null;
}