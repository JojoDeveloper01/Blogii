export interface BlogData {
	id?: string; //only has id if it's already saved on DB
	body?: string;
	collection: string;
	data: {
		title: string;
		pubDate: Date;
		updatedDate?: Date,
		description?: string;
		image?: string;
	};
}
