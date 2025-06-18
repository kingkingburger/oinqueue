import { LolpsTierList } from "@/components/lolpsTierList";
import { PerformanceGrid } from "@/components/performanceGrid";
import RecentMatches from "@/components/recentMatches";
import { RecommendedCompositions } from "@/components/recommendedComposition";
import SummonerRateList from "@/components/summonerList";
import { mainGameName, mainNames, mainTagName } from "@/constant/basic";
import { computeSummonerMetrics } from "@/lib/indicator/metrics";
import { getCachedMatchInfos } from "@/lib/matchDataManager";
import { getTierListFromPs } from "@/lib/topTierData/fromPs";
import Link from "next/link";
import React from "react";
import { FaYoutube } from "react-icons/fa";

type ChampionStats = { wins: number; total: number };

// “특정 소환사 대상 목록” 필터 → 챔피언별 통계 accumulate
type PerSummonerStats = Record<string, Record<string, ChampionStats>>;

export default async function HomeContent() {
	// ───────────────────────────────────────────────────────────
	// 데이터 Fetch & 가공
	// ───────────────────────────────────────────────────────────

	const matchCount = 50;
	// 캐시된 매치 데이터 가져오기 (새로운 매치만 API 요청)
	const allMatchInfos = await getCachedMatchInfos(
		mainGameName,
		mainTagName,
		matchCount,
	);

	// db에 있는 match 정보
	const originalMathInfo = allMatchInfos.matchInfos;
	// db에 있는 timeline match 정보
	const timelineMatchInfo = allMatchInfos.matchTimelines;

	// 매치 데이터의 matchId만 추출
	const matchIdsInDb = originalMathInfo.map((match) => match.metadata.matchId);

	// 소환사의 챔피언별 승리, 토탈 계산
	const perSummonerStats: PerSummonerStats = originalMathInfo
		.flatMap((mi) => mi.info.participants)
		.filter((p) => mainNames.some((name) => p.riotIdGameName.includes(name)))
		.reduce<PerSummonerStats>((acc, p) => {
			const summoner = p.riotIdGameName;
			const champ = p.championName;
			const won = p.win ? 1 : 0;

			// acc 객체를 직접 수정
			if (!acc[summoner]) {
				acc[summoner] = {};
			}

			if (!acc[summoner][champ]) {
				acc[summoner][champ] = { wins: 0, total: 0 };
			}

			acc[summoner][champ].wins += won;
			acc[summoner][champ].total += 1;

			return acc;
		}, {});

	// 최근 3개 매치 참가자 목록 준비(화면에 3개만 보여주기 위함)
	const participantsList = originalMathInfo.slice(0, 3).map((mi) =>
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

	// lolps api로 각 라인의 챔피언 승률 5개 가져오기
	const lolPsVersion = process.env.NEXT_PUBLIC_LOL_PS_VERSION;
	// 요청 파라미터 배열 생성
	const params = Array.from({ length: 5 }, (_, idx) => ({
		region: 0,
		version: Number(lolPsVersion),
		tier: 1,
		lane: idx,
	}));

	// lolps api 요청해서 1티어 데이터 가져오기
	const top5TierList = await Promise.all(
		params.map(async (param) => {
			const { data } = await getTierListFromPs(param);
			return data.slice(0, 5);
		}),
	);

	// 우리팀의 지표 계산
	const teamMatric = mainNames.map((name) =>
		computeSummonerMetrics(originalMathInfo, timelineMatchInfo, name),
	);

	return (
		<div className="min-h-screen bg-gray-100 p-6 font-sans">
			<div>
				<Link
					target="_blank"
					className="text-gray-800 inline-flex flex-row gap-2"
					href="https://www.youtube.com/channel/UCK3zw3RDnfqpi5-OwyQ_k9Q"
				>
					<FaYoutube size={24} color={"#FF0000"} />
					바나나 머스탱 유튜브
				</Link>
			</div>

			<div className="mt-4 grid grid-cols-12 gap-4">
				{/* 추천 조합 */}
				<div className="col-span-12">
					<h1 className="text-2xl font-semibold text-gray-800 mb-2">
						오늘의 추천조합
					</h1>
					<RecommendedCompositions
						perSummonerStats={perSummonerStats}
						top5TierList={top5TierList}
					/>
				</div>

				{/* 팀의 지표 */}
				<div className="col-span-12">
					<PerformanceGrid metricsList={teamMatric} />
				</div>

				{/* 챔피언 승률, 숙련도 요약 */}
				<div className="col-span-12">
					<h1 className="text-2xl font-semibold text-gray-800 mb-2">
						최근 {matchCount}게임
					</h1>
					<SummonerRateList perSummonerStats={perSummonerStats} />
				</div>

				{/*lolps의 티어 리스트 보여주기 */}
				<div className="col-span-12">
					<h1 className="text-2xl font-semibold text-gray-800 mb-2">
						lolps의 티어 리스트
					</h1>
					<LolpsTierList top5TierList={top5TierList} />
				</div>

				{/* 최근 3개 매치 기록 */}
				<div className="col-span-12">
					<RecentMatches
						participantsList={participantsList}
						matchIds={matchIdsInDb}
					/>
				</div>
			</div>
		</div>
	);
}
