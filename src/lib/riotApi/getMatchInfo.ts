import type { MatchInfoResponse } from "@/lib/riotApi/type/matchInfoResponse";
import { useRiotApiEngine } from "@/lib/utils";

export const getMatchInfo = async (
	matchId: string,
): Promise<MatchInfoResponse> => {
	const riotEngine = useRiotApiEngine();

	const result = await riotEngine
		.get<MatchInfoResponse>(
			`lol/match/v5/matches/${encodeURIComponent(matchId)}`,
		)
		.json();

	return result;
};
