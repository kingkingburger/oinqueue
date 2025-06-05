import { useRiotApiEngine } from "@/lib/utils";

interface PlayerResult {
	gameName: string;
	tagName: string;
	puuid: string;
}

export const getRiotSummonerInfo = async (
	gameName: string,
	tagName: string,
) => {
	const riotEngine = useRiotApiEngine();
	return await riotEngine
		.get<PlayerResult>(
			`riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${tagName}`,
		)
		.json();
};

export const getRiotSummonerInfoByPuuid = async (puuid: string) => {
	const riotEngine = useRiotApiEngine();
	return await riotEngine
		.get<PlayerResult>(`riot/account/v1/accounts/by-puuid/${puuid}`)
		.json();
};
