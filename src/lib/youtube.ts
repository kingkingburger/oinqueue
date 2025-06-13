const YT_API_KEY = process.env.NEXT_PUBLIC_LOL_YOUTUBE_API_KEY || "";
const CHANNEL_ID = process.env.NEXT_PUBLIC_MY_CHANNEL_ID || ""; // 본인 채널 ID

export interface TopVideo {
	id: string; // videoId
	title: string;
	thumbnail: string;
}

export async function fetchTopLoLVideo(): Promise<TopVideo | null> {
	try {
		const res = await fetch(
			`https://www.googleapis.com/youtube/v3/search?key=${YT_API_KEY}&channelId=${CHANNEL_ID}&part=snippet&order=date&maxResults=1&q=롤`,
		);

		if (!res.ok) return null;

		const json = await res.json();
		const item = json.items?.[0];

		if (!item?.id?.videoId) return null;

		return {
			id: item.id.videoId,
			title: item.snippet.title,
			thumbnail: item.snippet.thumbnails.high.url,
		};
	} catch {
		return null;
	}
}
