export interface BlogData {
	id: string;
	body?: string;
	collection: string;
	data: {
		title: string;
		description: string;
		pubDate: Date;
		image?: string;
	};
}
