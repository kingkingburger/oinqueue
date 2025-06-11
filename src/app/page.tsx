import type React from "react";

import { getMatchInfo } from "@/lib/riotApi/getMatchInfo";
import { getMatchList } from "@/lib/riotApi/getMatchList";
import { getRiotSummonerInfo } from "@/lib/riotApi/getRiotSummonerInfo";

import RecentMatches from "@/component/recentMatches";
import SummonerWinRateList from "@/component/summonerWinList";
import { mainGameName, mainNames, mainTagName } from "@/constant/basic";
import { getTierListFromPs } from "@/lib/topTierData/fromPs";

type ChampionStats = { wins: number; total: number };

// 4) “특정 소환사 대상 목록” 필터 → 챔피언별 통계 accumulate
type PerSummonerStats = Record<string, Record<string, ChampionStats>>;

export default async function Home() {
	// ───────────────────────────────────────────────────────────
	// 데이터 Fetch & 가공
	// ───────────────────────────────────────────────────────────

	// 1) 소환사 puuid 조회
	const { puuid } = await getRiotSummonerInfo(mainGameName, mainTagName);

	// 2) 매치 ID 리스트
	const matchCount = 15;
	const allMatchIds = await getMatchList({ puuid, count: matchCount });
	const top10MatchIds = allMatchIds.slice(0, 20);
	// 3) 10개 matchInfo 병렬 요청
	const matchInfos10 = await Promise.all(
		top10MatchIds.map((id) => getMatchInfo(id)),
	);

	const perSummonerStats: PerSummonerStats = matchInfos10
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

	const lolPsVersion = process.env.NEXT_PUBLIC_LOL_PS_VERSION;
	// lolps api로 각 라인의 챔피언 승률 5개 가져오기
	// 요청 파라미터 배열 생성
	const params = Array.from({ length: 5 }, (_, idx) => ({
		region: 0,
		version: Number(lolPsVersion),
		tier: 1,
		lane: idx,
	}));

	const top5TierList = await Promise.all(
		params.map(async (param) => {
			const { data } = await getTierListFromPs(param);
			return data.slice(0, 5).map(({ championInfo, ...rest }) => ({
				...rest,
				championName: championInfo.nameKr, // nameKr만 championName으로 옮김
			}));
		}),
	);

	return (
		<div className="min-h-screen bg-gray-100 p-6 font-sans">
			<div className="mt-4 grid grid-cols-12 gap-4">
				{/* 최근 3개 매치 기록 */}
				<RecentMatches
					participantsList={participantsList}
					matchIds={top10MatchIds}
				/>

				{/* 챔피언 승률 요약 */}
				<div className="col-span-12">
					<h1 className="text-2xl font-semibold text-gray-800 mb-2">
						최근 {matchCount}게임
					</h1>
					<SummonerWinRateList perSummonerStats={perSummonerStats} />
				</div>
			</div>
		</div>
	);
}
