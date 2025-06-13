/*
숙련도 계산 로직:

경험치 보너스: 50게임을 기준으로 경험치를 계산 (최대 1.0)
일관성 보너스: 10게임 이상 플레이했을 때 완전한 보너스, 그 이하는 비례적 감소
최종 숙련도: 승률 × 경험치 × 일관성 × 100

🔄 점수 계산 방식 변경

숙련도 × (팀 가중치 / 100)
*/

"use client";

import type { PerSummonerStats } from "@/component/summonerList";
import { calculateProficiency } from "@/lib/calculateProficiency";
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
		Record<
			string,
			{
				champion: string;
				winRate: string;
				proficiency: string;
				games: number;
			}[]
		>
	>(() => {
		return Object.keys(laneNames)
			.map(Number)
			.reduce<
				Record<
					string,
					{
						champion: string;
						winRate: string;
						proficiency: string;
						games: number;
					}[]
				>
			>((acc, laneId) => {
				const laneName = laneNames[laneId];

				/* ① 1티어 점수 계산  */
				const tierCandidates = (top5TierList[laneId] ?? []).reduce<
					Record<
						string,
						{
							score: number;
							winRate: number;
							proficiency: number;
							games: number;
						}
					>
				>((acc, tierChamp, idx) => {
					const champ = tierChamp.championInfo.nameUs;
					const tierScore = (5 - idx) * tierWeight; // 랭킹 역순 가중치
					const wr = Number.parseFloat(tierChamp.winRate.replace("%", ""));
					acc[champ] = {
						score: tierScore,
						winRate: wr,
						proficiency: 0,
						games: 0,
					};
					return acc;
				}, {});

				/* ② 우리 팀 숙련도 점수 반영 */
				const candidates = Object.entries(
					teamChampStatsByLane[laneId] ?? {},
				).reduce(
					(acc, [champ, stat]) => {
						const winRate = (stat.wins / stat.total) * 100;
						const proficiency = calculateProficiency(stat.wins, stat.total);
						const teamScore = proficiency * (teamWeight / 100); // 숙련도 기반 점수

						acc[champ] = acc[champ]
							? {
									score: acc[champ].score + teamScore,
									winRate: winRate,
									proficiency: proficiency,
									games: stat.total,
								}
							: {
									score: teamScore,
									winRate: winRate,
									proficiency: proficiency,
									games: stat.total,
								};
						return acc;
					},
					{ ...tierCandidates },
				);

				/* ③ 점수 내림차순 정렬 후 Top 3 추출 */
				const top3 = Object.entries(candidates)
					.map(([champ, data]) => ({
						champion: champ,
						winRate: `${data.winRate.toFixed(1)}%`,
						proficiency: `${data.proficiency.toFixed(1)}`,
						games: data.games,
						score: data.score,
					}))
					.sort((a, b) => b.score - a.score)
					.slice(0, 3);

				acc[laneName] = top3;
				return acc;
			}, {});
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
				<div className="text-sm text-gray-600 mt-2">
					※ 숙련도 = 승률 × 경험치(게임수) × 일관성 보너스
				</div>
			</div>

			{/* 라인별 추천 챔피언 3인 */}
			<div className="flex flex-col mx-auto sm:flex-row gap-6 overflow-x-auto">
				{Object.entries(recommended).map(([lane, list]) => (
					<div
						key={lane}
						className="bg-gray-50 p-4 rounded-md shadow-sm min-w-[200px]"
					>
						<h3 className="text-lg font-medium text-gray-700 mb-3">{lane}</h3>
						<ol className="space-y-2">
							{list.map((item, idx) => (
								<li key={item.champion} className="bg-white p-2 rounded border">
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<div className="text-sm font-bold text-gray-800">
												{idx + 1}위 {convertChampionNameToKr(item.champion)}
											</div>
											<div className="text-xs text-gray-600 mt-1">
												{item.games > 0 ? (
													<>
														승률: {item.winRate} ({item.games}게임)
														<br />
														숙련도: {item.proficiency}
													</>
												) : (
													<>
														메타 승률: {item.winRate}
														<br />
														<span className="text-orange-600">미플레이</span>
													</>
												)}
											</div>
										</div>
									</div>
								</li>
							))}
						</ol>
					</div>
				))}
			</div>
		</div>
	);
};
