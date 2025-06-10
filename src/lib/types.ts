export interface PostData {
    id: string;
    title: string;
    content?: string;
    created_at: Date;
    updated_at?: Date;
}

export interface BlogData {
    id?: string;
    body?: string;
    collection: string;
    data: {
        title: string;
        pubDate: Date;
        updatedDate?: Date,
        description?: string;
        image?: string;
        posts?: PostData[];
    };
}

export interface BlogCookieItem {
	id: string;
	title: string;
	posts: Array<{
		id: string;
		title: string;
	}>;
}