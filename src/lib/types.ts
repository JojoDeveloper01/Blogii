export interface BlogData {
	id: string;
	body?: string; // 🔥 Agora pode ser undefined sem erro
	collection: string;
	data: {
		title: string;
		description: string;
		pubDate: Date;
		image?: string;
	};
}
