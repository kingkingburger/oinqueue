import { useRiotApiEngine } from "@/lib/utils";

// Riot API가 반환하는 값이 match ID 목록(문자열 배열)이므로 타입을 지정
type MatchIds = string[];

export const getMatchList = async (puuid: string): Promise<MatchIds> => {
	const riotEngine = useRiotApiEngine();

	// 1) ':puuid' 자리에 실제 puuid를 넣고, encodeURIComponent로 안전하게 인코딩
	// 2) searchParams에 start, count, type을 명시
	const result = await riotEngine
		.get<MatchIds>(
			`lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids`,
			{
				searchParams: {
					start: "0",
					count: "10",
					type: "ranked",
				},
			},
		)
		.json();

	// Riot API는 문자열 배열을 반환하므로, 그대로 리턴
	return result;
};
