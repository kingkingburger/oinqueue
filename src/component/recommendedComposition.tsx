"use client";

import type { PerSummonerStats } from "@/component/summonerList";
import type { TierListItem } from "@/lib/topTierData/types";
import type React from "react";
import { useMemo, useState } from "react";

/* ─────────────────────────────────── 상수 & 타입 ─────────────────────────────────── */
const laneNames: Record<number, string> = {
	0: "탑",
	1: "정글",
	2: "미드",
	3: "원딜",
	4: "서포터",
};

type LaneStats = Record<
	number,
	Record<string, { wins: number; total: number }>
>;

interface Props {
	perSummonerStats: PerSummonerStats;
	top5TierList: TierListItem[][];
}

/* ─────────────────────────────────── 컴포넌트 ─────────────────────────────────── */
export const RecommendedCompositions: React.FC<Props> = ({
	perSummonerStats,
	top5TierList,
}) => {
	const [tierWeight, setTierWeight] = useState(70);
	const teamWeight = 100 - tierWeight;

	/* --------------------- 1) 우리 팀 챔피언 통계 집계 --------------------- */
	const teamChampStatsByLane = useMemo<LaneStats>(() => {
		return top5TierList.reduce<LaneStats>((laneAcc, laneTiers) => {
			return laneTiers.reduce<LaneStats>((acc, tierChamp) => {
				const champ = tierChamp.championInfo.nameUs;
				const laneId = tierChamp.laneId;

				/* 누적 객체 초기화 */
				if (!acc[laneId]) acc[laneId] = {};

				const aggregate = Object.values(perSummonerStats).reduce(
					(agg, summonerChamps) => {
						const stat = summonerChamps[champ];
						if (stat) {
							agg.wins += stat.wins;
							agg.total += stat.total;
						}
						return agg;
					},
					{ wins: 0, total: 0 },
				);

				if (aggregate.total) {
					/* spread 없이 직접 대입 */
					acc[laneId][champ] = aggregate;
				}
				return acc;
			}, laneAcc);
		}, {});
	}, [perSummonerStats, top5TierList]);

	/* --------------------- 2) 추천 조합 계산 --------------------- */
	const recommended = useMemo<
		Record<string, { champion: string; winRate: string }>
	>(() => {
		return Object.keys(laneNames)
			.map(Number)
			.reduce<Record<string, { champion: string; winRate: string }>>(
				(acc, laneId) => {
					const laneName = laneNames[laneId];

					/* 후보 점수 사전 */
					const candidates: Record<string, { score: number; winRate: number }> =
						{};

					/* ① 1티어 점수 */
					(top5TierList[laneId] ?? []).reduce<void>((_, tierChamp, idx) => {
						const champ = tierChamp.championInfo.nameUs;
						const tierScore = (5 - idx) * tierWeight; // 랭킹 역순 점수
						const wr = Number.parseFloat(tierChamp.winRate.replace("%", ""));
						candidates[champ] = { score: tierScore, winRate: wr };
						return;
					}, undefined);

					/* ② 우리 팀 승률 점수 */
					Object.entries(teamChampStatsByLane[laneId] ?? {}).reduce<void>(
						(_, [champ, stat]) => {
							const wr = (stat.wins / stat.total) * 100;
							const teamScore = wr * teamWeight;
							if (!candidates[champ]) {
								candidates[champ] = { score: teamScore, winRate: wr };
							} else {
								candidates[champ].score += teamScore;
								candidates[champ].winRate = wr; // 팀 데이터로 업데이트
							}
							return;
						},
						undefined,
					);

					/* ③ 최고 점수 챔피언 탐색 */
					const best = Object.entries(candidates).reduce<
						[string, { score: number; winRate: number }]
					>(
						(bestSoFar, curr) =>
							curr[1].score > bestSoFar[1].score ? curr : bestSoFar,
						["없음", { score: -1, winRate: 0 }],
					);

					acc[laneName] = {
						champion: best[0],
						winRate: `${best[1].winRate.toFixed(2)}%`,
					};
					return acc;
				},
				{},
			);
	}, [tierWeight, teamChampStatsByLane, top5TierList, teamWeight]);

	/* ------------------------------ UI ------------------------------ */
	return (
		<div className="flex w-screen gap-4 bg-white p-6 rounded-lg shadow-md">
			<h2 className="text-xl font-semibold text-gray-800 mb-4">추천 조합</h2>

			<div className="mb-4">
				<label
					htmlFor="tierWeight"
					className="block text-gray-700 font-bold mb-2"
				>
					1티어 비율: {tierWeight}% / 우리팀 비율: {teamWeight}%
				</label>
				<input
					type="range"
					id="tierWeight"
					min="0"
					max="100"
					value={tierWeight}
					onChange={(e) => setTierWeight(Number(e.target.value))}
					className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
				/>
			</div>

			<div className="flex flex-row gap-4">
				{Object.entries(recommended).map(([lane, data]) => (
					<div key={lane} className="bg-gray-50 p-4 rounded-md shadow-sm">
						<h3 className="text-lg font-medium text-gray-700 mb-2">{lane}</h3>
						<p className="text-gray-900">
							챔피언: <span className="font-bold">{data.champion}</span>
						</p>
						<p className="text-gray-600">
							예상 승률: <span className="font-bold">{data.winRate}</span>
						</p>
					</div>
				))}
			</div>
		</div>
	);
};
