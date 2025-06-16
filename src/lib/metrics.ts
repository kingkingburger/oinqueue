import type { MatchInfoResponse } from "@/lib/riotApi/type/matchInfoResponse";

export type Metric = {
	key: string;
	label: string;
	value: string | number;
	note?: string;
	highlight?: boolean;
};

export function computeSummonerMetrics(
	matches: MatchInfoResponse[],
	summonerName: string,
): Metric[] {
	const myParts = matches
		.flatMap((m) => m.info.participants)
		.filter((p) => p.riotIdGameName === summonerName);

	const totals = myParts.reduce(
		(acc, p) => ({
			kills: acc.kills + p.kills,
			deaths: acc.deaths + p.deaths,
			assists: acc.assists + p.assists,
			cs: acc.cs + p.totalMinionsKilled + p.neutralMinionsKilled,
			gold: acc.gold + p.goldEarned,
			time: acc.time + p.timePlayed,
		}),
		{ kills: 0, deaths: 0, assists: 0, cs: 0, gold: 0, time: 0 },
	);

	const games = myParts.length || 1;
	const kda = (
		(totals.kills + totals.assists) /
		Math.max(1, totals.deaths)
	).toFixed(2);
	const csPerMin = ((totals.cs / totals.time) * 60).toFixed(2);
	const goldPerMin = ((totals.gold / totals.time) * 60).toFixed(1);

	const grade =
		Number(kda) >= 5
			? "A+"
			: Number(kda) >= 3
				? "B"
				: Number(kda) >= 2
					? "C"
					: "D";

	return [
		{
			key: "grade",
			label: "체급",
			value: `${grade}`,
			note: `평균 KDA ${kda}`,
			highlight: true,
		},
		{ key: "kda", label: "KDA", value: kda, note: "Kills+Assists / Deaths" }, // :contentReference[oaicite:0]{index=0}
		{ key: "cs", label: "분당 CS", value: csPerMin },
		{ key: "gpm", label: "골드/분", value: goldPerMin },
		{ key: "games", label: "표본 경기수", value: games },
	];
}
