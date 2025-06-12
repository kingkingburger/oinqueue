"use client";

import type { PerSummonerStats } from "@/component/summonerList";
import { convertChampionNameToKr } from "@/lib/convertChampionName";
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
					acc[laneId][champ] = aggregate;
				}
				return acc;
			}, laneAcc);
		}, {});
	}, [perSummonerStats, top5TierList]);

	/* --------------------- 2) 추천 조합 계산 (Top 3) --------------------- */
	const recommended = useMemo<
		Record<string, { champion: string; winRate: string }[]>
	>(() => {
		return Object.keys(laneNames)
			.map(Number)
			.reduce<Record<string, { champion: string; winRate: string }[]>>(
				(acc, laneId) => {
					const laneName = laneNames[laneId];

					/* ① 1티어 점수 계산  */
					const tierCandidates = (top5TierList[laneId] ?? []).reduce<
						Record<string, { score: number; winRate: number }>
					>((acc, tierChamp, idx) => {
						const champ = tierChamp.championInfo.nameUs;
						const tierScore = (5 - idx) * tierWeight; // 랭킹 역순 가중치
						const wr = Number.parseFloat(tierChamp.winRate.replace("%", ""));
						acc[champ] = { score: tierScore, winRate: wr };
						return acc;
					}, {});

					/* ② 우리 팀 승률 점수 반영 */
					const candidates = Object.entries(
						teamChampStatsByLane[laneId] ?? {},
					).reduce(
						(acc, [champ, stat]) => {
							const winRate = (stat.wins / stat.total) * 100; // 승률
							const teamScore = winRate * teamWeight;
							acc[champ] = acc[champ]
								? { score: acc[champ].score + teamScore, winRate: winRate } // 기존 점수 누적
								: { score: teamScore, winRate: winRate }; // 새로 추가
							return acc;
						},
						{ ...tierCandidates },
					);

					/* ③ 점수 내림차순 정렬 후 Top 3 추출 */
					const top3 = Object.entries(candidates)
						.map(([champ, data]) => ({
							champion: champ,
							winRate: `${data.winRate.toFixed(2)}%`,
							score: data.score,
						}))
						.sort((a, b) => b.score - a.score)
						.slice(0, 3);

					acc[laneName] = top3;
					return acc;
				},
				{},
			);
	}, [tierWeight, teamChampStatsByLane, top5TierList, teamWeight]);

	/* ------------------------------ UI ------------------------------ */
	return (
		<div className="flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-lg shadow-md w-full overflow-x-auto">
			<h2 className="text-xl font-semibold text-gray-800 mb-4">추천 조합</h2>

			{/* 가중치 슬라이더 */}
			<div className="mb-6">
				<label
					htmlFor="tierWeight"
					className="block text-gray-700 font-bold mb-2"
				>
					1티어 비율: {tierWeight}% / 우리팀 숙련도 비율: {teamWeight}%
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

			{/* 라인별 추천 챔피언 3인 */}
			<div className="flex flex-col sm:flex-row gap-6 overflow-x-auto">
				{Object.entries(recommended).map(([lane, list]) => (
					<div
						key={lane}
						className="bg-gray-50 p-4 rounded-md shadow-sm min-w-[180px]"
					>
						<h3 className="text-lg font-medium text-gray-700 mb-3">{lane}</h3>
						<ol className="space-y-1">
							{list.map((item, idx) => (
								<li
									key={item.champion}
									className="flex justify-between text-sm"
								>
									<span>
										{idx + 1}위&nbsp;
										<span className="font-bold">
											{convertChampionNameToKr(item.champion)}
										</span>
									</span>
									<span className="text-gray-600">{item.winRate}</span>
								</li>
							))}
						</ol>
					</div>
				))}
			</div>
		</div>
	);
};
