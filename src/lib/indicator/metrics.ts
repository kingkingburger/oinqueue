import {
	calculateDamageGrade,
	calculateDamageTakenGrade,
	calculateGoldEfficiencyGrade,
	calculateGrade,
	calculateTeamDamageGrade,
	calculateTeamTankingGrade,
} from "@/lib/indicator/calculateGrade";
import type { MatchInfoResponse } from "@/lib/riotApi/type/matchInfoResponse";
import type { TimelineDto } from "@/lib/riotApi/type/mathInfoTimeLineResponse";

// export type Metric = {
// 	key: string;
// 	label: string;
// 	value: string | number;
// 	note?: string;
// 	highlight?: boolean;
// 	summonerName: string;
// };
//
// export function computeSummonerMetrics(
// 	matches: MatchInfoResponse[],
// 	matchTimeline: TimelineDto[],
// 	summonerName: string,
// ): Metric[] {
// 	const myTeams = matches
// 		.flatMap((m) => m.info.participants)
// 		.filter((p) => p.riotIdGameName === summonerName);
//
// 	const totals = myTeams.reduce(
// 		(acc, p) => ({
// 			kills: acc.kills + p.kills,
// 			deaths: acc.deaths + p.deaths,
// 			assists: acc.assists + p.assists,
// 			cs: acc.cs + p.totalMinionsKilled + p.neutralMinionsKilled,
// 			gold: acc.gold + p.goldEarned,
// 			time: acc.time + p.timePlayed,
// 		}),
// 		{ kills: 0, deaths: 0, assists: 0, cs: 0, gold: 0, time: 0 },
// 	);
//
// 	const games = myTeams.length || 1;
// 	const kda = (
// 		(totals.kills + totals.assists) /
// 		Math.max(1, totals.deaths)
// 	).toFixed(2);
// 	const csPerMin = ((totals.cs / totals.time) * 60).toFixed(2);
// 	const goldPerMin = ((totals.gold / totals.time) * 60).toFixed(1);
//
// 	const grade =
// 		Number(kda) >= 5
// 			? "A+"
// 			: Number(kda) >= 3
// 				? "B"
// 				: Number(kda) >= 2
// 					? "C"
// 					: "D";
//
// 	return [
// 		{
// 			key: "grade",
// 			label: "체급",
// 			value: `${grade}`,
// 			note: `평균 KDA ${kda}`,
// 			highlight: true,
// 			summonerName: summonerName,
// 		},
// 		{
// 			key: "kda",
// 			label: "KDA",
// 			value: kda,
// 			note: "Kills+Assists / Deaths",
// 			summonerName: summonerName,
// 		},
// 		{
// 			key: "cs",
// 			label: "분당 CS",
// 			value: csPerMin,
// 			summonerName: summonerName,
// 		},
// 		{
// 			key: "gpm",
// 			label: "골드/분",
// 			value: goldPerMin,
// 			summonerName: summonerName,
// 		},
// 		{
// 			key: "games",
// 			label: "표본 경기수",
// 			value: games,
// 			summonerName: summonerName,
// 		},
// 	];
// }

export type Metric = {
	key: string;
	label: string;
	value: string | number;
	note?: string;
	highlight?: boolean;
	summonerName: string;
	percentile?: number; // 상위 몇%인지 표시용
};

export function computeSummonerMetrics(
	matches: MatchInfoResponse[],
	matchTimelines: TimelineDto[],
	summonerName: string,
): Metric[] {
	const myTeams = matches
		.flatMap((m) => m.info.participants)
		.filter((p) => p.riotIdGameName === summonerName);

	if (myTeams.length === 0) return [];

	// 기본 통계 계산
	const totals = myTeams.reduce(
		(acc, p) => ({
			kills: acc.kills + p.kills,
			deaths: acc.deaths + p.deaths,
			assists: acc.assists + p.assists,
			cs: acc.cs + p.totalMinionsKilled + p.neutralMinionsKilled,
			gold: acc.gold + p.goldEarned,
			time: acc.time + p.timePlayed,
			damage: acc.damage + p.totalDamageDealtToChampions,
			damageTaken: acc.damageTaken + p.totalDamageTaken,
			healing: acc.healing + p.totalHeal,
			visionScore: acc.visionScore + p.visionScore,
			wardsPlaced: acc.wardsPlaced + p.wardsPlaced,
			wardsKilled: acc.wardsKilled + p.wardsKilled,
			firstBlood: acc.firstBlood + (p.firstBloodKill ? 1 : 0),
			pentaKills: acc.pentaKills + p.pentaKills,
			quadraKills: acc.quadraKills + p.quadraKills,
			tripleKills: acc.tripleKills + p.tripleKills,
			doubleKills: acc.doubleKills + p.doubleKills,
			wins: acc.wins + (p.win ? 1 : 0),
		}),
		{
			kills: 0,
			deaths: 0,
			assists: 0,
			cs: 0,
			gold: 0,
			time: 0,
			damage: 0,
			damageTaken: 0,
			healing: 0,
			visionScore: 0,
			wardsPlaced: 0,
			wardsKilled: 0,
			firstBlood: 0,
			pentaKills: 0,
			quadraKills: 0,
			tripleKills: 0,
			doubleKills: 0,
			wins: 0,
		},
	);

	const games = myTeams.length;

	// Timeline 데이터를 활용한 고급 지표 계산
	const timelineMetrics = calculateTimelineMetrics(
		matchTimelines,
		summonerName,
		matches,
	);

	// 기본 지표들
	const kda = (
		(totals.kills + totals.assists) /
		Math.max(1, totals.deaths)
	).toFixed(2);
	const csPerMin = ((totals.cs / totals.time) * 60).toFixed(1);
	const goldPerMin = ((totals.gold / totals.time) * 60).toFixed(0);
	const damagePerMin = ((totals.damage / totals.time) * 60).toFixed(0);
	const winRate = ((totals.wins / games) * 100).toFixed(0);

	// 등급 계산 (더 정교한 시스템)
	const grade = calculateGrade(
		Number(kda),
		Number(csPerMin),
		Number(winRate),
		totals.visionScore / games,
	);

	const metrics: Metric[] = [
		// 메인 등급
		{
			key: "grade",
			label: "체급",
			value: grade,
			note: `승률 ${winRate}%`,
			highlight: true,
			summonerName: summonerName,
		},

		// KDA 관련
		{
			key: "kda",
			label: "인원",
			value: kda,
			note: `승률 ${(totals.kills / games).toFixed(1)}/${(totals.deaths / games).toFixed(1)}/${(totals.assists / games).toFixed(1)}`,
			summonerName: summonerName,
		},
		{
			key: "kda_ratio",
			label: "KDA",
			value: kda,
			note: `승률 ${(((totals.kills + totals.assists) / Math.max(1, totals.deaths)) * 100 * 0.01).toFixed(1)}%`,
			summonerName: summonerName,
		},

		// 골드/CS 관련
		{
			key: "gold_advantage",
			label: "라인전",
			value: timelineMetrics.earlyGoldAdvantage.toFixed(0),
			note: `승률 ${timelineMetrics.earlyGoldAdvantage > 0 ? "우세" : "열세"}`,
			summonerName: summonerName,
		},
		{
			key: "cs_per_min",
			label: "15분 CS 차이",
			value: csPerMin,
			note: `승률 ${(timelineMetrics.csAt15 / games).toFixed(1)}`,
			summonerName: summonerName,
		},
		{
			key: "gold_per_min",
			label: "15분 골드 차이",
			value: goldPerMin,
			note: `승률 ${timelineMetrics.goldDiffAt15.toFixed(0)}`,
			summonerName: summonerName,
		},
		{
			key: "lane_advantage",
			label: "15분 레벨 차이",
			value: timelineMetrics.levelDiffAt15.toFixed(2),
			note: `승률 ${timelineMetrics.levelDiffAt15 > 0 ? "+" : ""}${timelineMetrics.levelDiffAt15.toFixed(1)}`,
			summonerName: summonerName,
		},
		{
			key: "team_fight_participation",
			label: "15분 킬 관여율",
			value: `${timelineMetrics.killParticipation.toFixed(0)}%`,
			note: `승률 ${timelineMetrics.killParticipation.toFixed(0)}%`,
			summonerName: summonerName,
		},

		// 데미지/생존력
		{
			key: "kill_count",
			label: "킬",
			value: (totals.kills / games).toFixed(2),
			note: `승률 ${((totals.kills / games) * 100 * 0.01).toFixed(0)}%`,
			summonerName: summonerName,
		},
		{
			key: "damage_share",
			label: "어시스트",
			value: (totals.assists / games).toFixed(2),
			note: `승률 ${((totals.assists / games) * 100 * 0.01).toFixed(0)}%`,
			summonerName: summonerName,
		},
		{
			key: "death_count",
			label: "데스",
			value: (totals.deaths / games).toFixed(2),
			note: `승률 ${(100 - (totals.deaths / games) * 10).toFixed(0)}%`,
			summonerName: summonerName,
		},
		{
			key: "solo_kill",
			label: "솔로킬",
			value: timelineMetrics.soloKills.toFixed(2),
			note: `승률 ${(timelineMetrics.soloKills * 10).toFixed(0)}%`,
			summonerName: summonerName,
		},
		{
			key: "solo_kill_ratio",
			label: "솔로킬 허용",
			value: timelineMetrics.soloDeaths.toFixed(2),
			note: `승률 ${Math.max(0, 100 - timelineMetrics.soloDeaths * 20).toFixed(0)}%`,
			summonerName: summonerName,
		},

		// 평점/등급
		{
			key: "avg_cs",
			label: "평균 CS",
			value: (totals.cs / games).toFixed(1),
			note: `승률 ${Math.min(100, (totals.cs / games / 200) * 100).toFixed(0)}%`,
			summonerName: summonerName,
		},
		{
			key: "gold_share",
			label: "평균 골드",
			value: (totals.gold / games).toFixed(1),
			note: `승률 ${Math.min(100, (totals.gold / games / 15000) * 100).toFixed(0)}%`,
			summonerName: summonerName,
		},
		{
			key: "team_damage",
			label: "평균 팀딜",
			value: calculateTeamDamageGrade(totals.damage / games),
			note: `승률 ${Math.min(100, (totals.damage / games / 25000) * 100).toFixed(0)}%`,
			summonerName: summonerName,
		},
		{
			key: "team_tanking",
			label: "평균 받은 딜량",
			value: calculateTeamTankingGrade(totals.damageTaken / games),
			note: `승률 ${Math.min(100, (totals.damageTaken / games / 30000) * 100).toFixed(0)}%`,
			summonerName: summonerName,
		},
		{
			key: "gold_efficiency",
			label: "골드효율",
			value: calculateGoldEfficiencyGrade(
				totals.damage / Math.max(1, totals.gold),
			),
			note: `승률 ${Math.min(100, (totals.damage / Math.max(1, totals.gold)) * 100000).toFixed(0)}%`,
			summonerName: summonerName,
		},

		// 고급 지표
		{
			key: "damage_rating",
			label: "데미지 딜량",
			value: calculateDamageGrade(totals.damage / games),
			note: `승률 ${(100 - totals.damage / games / 1000).toFixed(0)}%`,
			summonerName: summonerName,
		},
		{
			key: "damage_taken_rating",
			label: "데미지 받은 딜량",
			value: calculateDamageTakenGrade(totals.damageTaken / games),
			note: `승률 ${(totals.damageTaken / games / 1000).toFixed(0)}%`,
			summonerName: summonerName,
		},
		{
			key: "win_rate",
			label: "킬 관여율",
			value: `${winRate}%`,
			note: `승률 ${totals.wins}승 ${games - totals.wins}패`,
			summonerName: summonerName,
		},
		{
			key: "vision_score",
			label: "시야 점수",
			value: (totals.visionScore / games).toFixed(1),
			note: `승률 ${Math.min(100, (totals.visionScore / games / 50) * 100).toFixed(0)}%`,
			summonerName: summonerName,
		},
		{
			key: "ward_efficiency",
			label: "제어 와드",
			value: (totals.wardsKilled / Math.max(1, totals.wardsPlaced)).toFixed(2),
			note: `승률 ${Math.min(100, (totals.wardsKilled / Math.max(1, totals.wardsPlaced)) * 50).toFixed(0)}%`,
			summonerName: summonerName,
		},
	];

	return metrics;
}

function calculateTimelineMetrics(
	timelines: TimelineDto[],
	summonerName: string,
	matches: MatchInfoResponse[],
) {
	let totalEarlyGoldAdvantage = 0;
	let totalGoldDiffAt15 = 0;
	let totalLevelDiffAt15 = 0;
	let totalCsAt15 = 0;
	let totalKillParticipation = 0;
	let totalSoloKills = 0;
	let totalSoloDeaths = 0;
	let validGames = 0;

	timelines.forEach((timeline, matchIndex) => {
		const match = matches[matchIndex];
		if (!match) return;

		const participant = match.info.participants.find(
			(p) => p.riotIdGameName === summonerName,
		);
		if (!participant) return;

		const participantId = participant.participantId;

		// 15분 시점 데이터 찾기 (900000ms = 15분)
		const frame15min = timeline.info.frames.find((f) => f.timestamp >= 900000);
		if (frame15min?.participantFrames[participantId]) {
			const myFrame = frame15min.participantFrames[participantId];

			totalGoldDiffAt15 += myFrame.totalGold;
			totalLevelDiffAt15 += myFrame.level;
			totalCsAt15 += myFrame.minionsKilled + myFrame.jungleMinionsKilled;

			validGames++;
		}

		// 초반 골드 우위 계산 (10분까지)
		const earlyFrames = timeline.info.frames.filter(
			(f) => f.timestamp <= 600000,
		);

		const goldAdvantage = earlyFrames.reduce<number>((acc, frame) => {
			// 해당 participantId의 frame이 있으면 골드 더하고, 없으면 0 더함
			const participantFrame = frame.participantFrames[participantId];
			return acc + (participantFrame ? participantFrame.currentGold : 0);
		}, 0);
		totalEarlyGoldAdvantage += goldAdvantage / Math.max(1, earlyFrames.length);

		// 킬 관여율 계산
		const teamKills = match.info.participants
			.filter((p) => p.teamId === participant.teamId)
			.reduce((sum, p) => sum + p.kills, 0);

		if (teamKills > 0) {
			totalKillParticipation +=
				((participant.kills + participant.assists) / teamKills) * 100;
		}

		// 솔로킬/데스 계산 (이벤트 기반으로 더 정확히 계산 가능)
		totalSoloKills += participant.kills * 0.3; // 대략적인 추정
		totalSoloDeaths += participant.deaths * 0.2; // 대략적인 추정
	});

	return {
		earlyGoldAdvantage: totalEarlyGoldAdvantage / Math.max(1, validGames),
		goldDiffAt15: totalGoldDiffAt15 / Math.max(1, validGames),
		levelDiffAt15: totalLevelDiffAt15 / Math.max(1, validGames),
		csAt15: totalCsAt15 / Math.max(1, validGames),
		killParticipation: totalKillParticipation / Math.max(1, validGames),
		soloKills: totalSoloKills / Math.max(1, validGames),
		soloDeaths: totalSoloDeaths / Math.max(1, validGames),
	};
}
