import type { TimelineDto } from "@/lib/riotApi/type/mathInfoTimeLineResponse";
import { useRiotApiEngine } from "@/lib/utils";

export const getMatchTimeLineInfo = async (
	matchId: string,
): Promise<TimelineDto> => {
	const riotEngine = useRiotApiEngine();

	const result = await riotEngine
		.get<TimelineDto>(
			`lol/match/v5/matches/${encodeURIComponent(matchId)}/timeline`,
		)
		.json();

	return result;
};
