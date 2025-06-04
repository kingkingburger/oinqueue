import { useRiotApiEngine } from "@/lib/utils";

interface PlayerResult {
	gameName: string;
	tagName: string;
	puuid: string;
}

export const getRiotPuuid = async (gameName: string, tagName: string) => {
	const riotEngine = useRiotApiEngine();
	const result = await riotEngine
		.get<PlayerResult>(
			`riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${tagName}`,
		)
		.json();

	return result.puuid;
};
