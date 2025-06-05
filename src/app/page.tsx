// page.tsx
import { Player } from "@/(main)/(player)/page";
import type React from "react";

import { getMatchInfo } from "@/lib/riotApi/getMatchInfo";
import { getMatchList } from "@/lib/riotApi/getMatchList";
import {
	getRiotSummonerInfo,
	getRiotSummonerInfoByPuuid,
} from "@/lib/riotApi/getRiotSummonerInfo";

import CardSection from "@/component/cardSection";
import ChampionSummary from "@/component/championSummary";
import LargePlaceholderCard from "@/component/largePlaceholderCard";
import RecentMatches from "@/component/recentMatches";
import { mainGameName, mainNames, mainTagName } from "@/constant/basic";

export default async function Home() {
	// ───────────────────────────────────────────────────────────
	// 데이터 Fetch & 가공 (모두 선언형으로만 표현)
	// ───────────────────────────────────────────────────────────

	// 1) 소환사 puuid 조회
	const { puuid } = await getRiotSummonerInfo(mainGameName, mainTagName);

	// 2) 매치 ID 리스트(최대 20개 → matchCount 10)
	const allMatchIds = await getMatchList({ puuid, count: 10 });
	const top10MatchIds = allMatchIds.slice(0, 20);

	// 3) 10개 matchInfo 병렬 요청
	const matchInfos10 = await Promise.all(
		top10MatchIds.map((id) => getMatchInfo(id)),
	);

	type ChampionStats = { wins: number; total: number };

	// 4) “특정 소환사 대상 목록” 필터 → 챔피언별 통계 accumulate
	type PerSummonerStats = Record<string, Record<string, ChampionStats>>;

	const perSummonerStats: PerSummonerStats = matchInfos10
		.flatMap((mi) => mi.info.participants)
		.filter((p) => mainNames.some((name) => p.riotIdGameName.includes(name)))
		.reduce<PerSummonerStats>((acc, p) => {
			const summoner = p.riotIdGameName;
			const champ = p.championName;
			const won = p.win ? 1 : 0;

			const prevStats = acc[summoner] ?? {};
			const prevChampionStats = prevStats[champ] ?? { wins: 0, total: 0 };

			return {
				...acc,
				[summoner]: {
					...prevStats,
					[champ]: {
						wins: prevChampionStats.wins + won,
						total: prevChampionStats.total + 1,
					},
				},
			};
		}, {});

	type BestPerSummoner = Record<
		string,
		{ champion: string; winRate: number; stats: ChampionStats }
	>;

	const bestPerSummoner: BestPerSummoner = Object.entries(
		perSummonerStats,
	).reduce((acc, [summoner, statsObj]) => {
		const bestEntry = Object.entries(statsObj).reduce(
			(best, [champName, champStats]) => {
				const { wins, total } = champStats;
				const rate = total > 0 ? wins / total : 0;
				if (rate > best.winRate) {
					return { champion: champName, winRate: rate, stats: champStats };
				}
				return best;
			},
			{ champion: "", winRate: -1, stats: { wins: 0, total: 0 } },
		);
		return { ...acc, [summoner]: bestEntry };
	}, {} as BestPerSummoner);

	console.log("bestPerSummoner = ", bestPerSummoner);

	// 5) 최근 3개 매치 참가자 목록 준비
	const participantsList = matchInfos10.slice(0, 3).map((mi) =>
		mi.info.participants.map((p) => ({
			riotIdGameName: p.riotIdGameName,
			riotIdTagline: p.riotIdTagline,
			championName: p.championName,
			kills: p.kills,
			deaths: p.deaths,
			assists: p.assists,
			win: p.win,
		})),
	);
	// participantsList: Participant[][] (길이 3, 각각 10명씩)

	// 6) 기존 카드용 더미 데이터
	const productComboData = [20, 25, 30, 20, 5];
	const ratioData = [15, 20, 25, 10, 30];
	const recommendedComboData = [10, 15, 20, 25, 30];
	const bottomCardSectionData = [22, 28, 35, 15, 0];
	const bottomRecommendedComboData = [10, 15, 20, 25, 30];

	// ───────────────────────────────────────────────────────────
	// JSX: UI 컴포넌트 조합 (전부 선언형)
	// ───────────────────────────────────────────────────────────

	return (
		<div className="min-h-screen bg-gray-100 p-6 font-sans">
			<div className="mt-4 grid grid-cols-12 gap-4">
				{/* Top row: 타이틀 */}
				<div className="mx-2 my-2">최근전적</div>

				{/* 3-2) 최근 3개 매치 기록 */}
				<RecentMatches
					participantsList={participantsList}
					matchIds={top10MatchIds}
				/>

				{/* 3-3) Middle row: 카드 섹션들 */}
				<div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{/* 3-1) 소환사별 최고 승률 챔피언 요약 */}
					<div className="col-span-12 overflow-x-auto">
						<h1 className="text-2xl font-semibold text-gray-800 mb-2">
							최근 20게임 중 승률이 가장 높은 챔피언
						</h1>
						<div className="flex flex-row gap-x-4">
							{Object.entries(bestPerSummoner).map(
								([summoner, { champion, winRate }]) => (
									<div key={summoner} className="flex-shrink-0 w-64">
										<ChampionSummary
											summonerName={summoner}
											bestChampion={champion}
											bestWinRate={winRate}
										/>
									</div>
								),
							)}
						</div>
					</div>

					<div className="col-span-1 md:col-span-1 lg:col-span-1">
						<CardSection title="비율" data={ratioData} />
					</div>
					<div className="col-span-1 md:col-span-2 lg:col-span-1">
						<LargePlaceholderCard className="h-full min-h-[160px] md:min-h-0" />
					</div>
				</div>

				{/* 3-4) Bottom row: 카드 섹션들 */}
				<div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
					<div className="col-span-1 md:col-span-1">
						<CardSection
							title="가장 해를 덜 입은 밴프"
							data={bottomCardSectionData}
						/>
					</div>
					<div className="col-span-1 md:col-span-1">
						<CardSection title="추천 조합" data={bottomRecommendedComboData} />
					</div>
				</div>
			</div>
		</div>
	);
}
