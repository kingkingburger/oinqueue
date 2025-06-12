"use client";

import type { PerSummonerStats } from "@/component/summonerList";
import type { TierListItem } from "@/lib/topTierData/types";
import type React from "react";
import { useMemo, useState } from "react";

// 라인 정보를 위한 임시 매핑 (실제로는 더 정교한 데이터가 필요할 수 있습니다)
const laneNames: Record<number, string> = {
	0: "탑",
	1: "정글",
	2: "미드",
	3: "원딜",
	4: "서포터",
};

interface RecommendedCompositionsProps {
	perSummonerStats: PerSummonerStats;
	top5TierList: TierListItem[][]; // 각 라인별 1티어 챔피언 목록
}

export const RecommendedCompositions: React.FC<
	RecommendedCompositionsProps
> = ({ perSummonerStats, top5TierList }) => {
	const [tierWeight, setTierWeight] = useState(70); // 1티어 챔프 비율 (0-100)
	const teamWeight = 100 - tierWeight; // 우리팀 챔프 승률 비율

	// 우리 팀 챔피언별 라인 및 승률 정보 가공
	const teamChampStatsByLane = useMemo(() => {
		const stats: Record<
			string,
			Record<string, { wins: number; total: number }>
		> = {};

		// perSummonerStats에서 각 소환사의 챔피언 승률을 가져와
		// 해당 챔피언이 주로 가는 라인으로 분류해야 합니다.
		// 이 예시에서는 챔피언의 라인을 알 수 없으므로,
		// 임시로 'unassigned' 라인으로 처리하거나,
		// 외부 데이터를 통해 챔피언별 주 라인 정보를 가져와야 합니다.
		// 여기서는 간단하게 모든 챔피언을 'unassigned' 라인에 넣고,
		// 1티어 리스트에 있는 챔피언이라면 해당 라인에 넣어주는 방식으로 처리합니다.

		// 실제 애플리케이션에서는 챔피언 ID를 기반으로 라인을 매핑하는 데이터가 필요합니다.
		// 예시를 위해 top5TierList의 정보를 활용하여 챔피언의 라인을 추론합니다.
		top5TierList.forEach((laneTiers) => {
			laneTiers.forEach((tierChamp) => {
				const championName = tierChamp.championInfo.nameUs;
				const laneId = tierChamp.laneId;
				if (!stats[laneId]) {
					stats[laneId] = {};
				}

				Object.values(perSummonerStats).forEach((summonerChamps) => {
					if (summonerChamps[championName]) {
						if (!stats[laneId][championName]) {
							stats[laneId][championName] = { wins: 0, total: 0 };
						}
						stats[laneId][championName].wins +=
							summonerChamps[championName].wins;
						stats[laneId][championName].total +=
							summonerChamps[championName].total;
					}
				});
			});
		});

		return stats;
	}, [perSummonerStats, top5TierList]);

	// 추천 조합 계산 로직
	const recommendedCompositions = useMemo(() => {
		const compositions: Record<string, { champion: string; winRate: string }> =
			{};

		Object.keys(laneNames).forEach((laneIdStr) => {
			const laneId = Number(laneIdStr);
			const laneName = laneNames[laneId];

			let bestChamp = "없음";
			let bestScore: -1;
			let bestWinRate = "N/A";

			// 1티어 챔피언 풀
			const currentLaneTierList = top5TierList[laneId] || [];

			// 우리 팀 챔피언 풀 (해당 라인에 대해 승률이 있는 챔피언만 고려)
			const currentLaneTeamChamps = teamChampStatsByLane[laneId] || {};

			// 각 챔피언에 대한 점수 계산 (1티어 가중치 + 우리 팀 승률 가중치)
			const candidateChamps: Record<
				string,
				{ score: number; winRate: number }
			> = {};

			// 1티어 챔피언 점수 부여
			currentLaneTierList.forEach((tierChamp, index) => {
				const championName = tierChamp.championInfo.nameUs;
				// 1티어 챔피언은 opScore를 기반으로 점수 부여 (높을수록 좋음)
				// 혹은 랭킹에 따라 점수 부여 (낮은 랭킹이 높은 점수)
				// 여기서는 간단하게 랭킹을 역순으로 사용하여 높은 랭킹일수록 높은 점수를 줍니다.
				const tierScore = (5 - index) * tierWeight; // 5개 챔피언 중 1위는 5점, 5위는 1점

				if (!candidateChamps[championName]) {
					candidateChamps[championName] = { score: 0, winRate: 0 };
				}
				candidateChamps[championName].score += tierScore;
				candidateChamps[championName].winRate = Number.parseFloat(
					tierChamp.winRate.replace("%", ""),
				);
			});

			// 우리 팀 챔피언 승률 점수 부여
			Object.entries(currentLaneTeamChamps).forEach(([championName, stats]) => {
				if (stats.total > 0) {
					const winRate = (stats.wins / stats.total) * 100;
					// 우리 팀 승률이 높을수록 높은 점수를 줍니다.
					const teamScore = winRate * teamWeight; // 승률에 가중치 곱함

					if (!candidateChamps[championName]) {
						candidateChamps[championName] = { score: 0, winRate: 0 };
					}
					candidateChamps[championName].score += teamScore;
					// 우리 팀 승률 정보가 더 정확하므로 winRate를 업데이트
					candidateChamps[championName].winRate = winRate;
				}
			});

			// 가장 높은 점수를 가진 챔피언 선택
			Object.entries(candidateChamps).forEach(
				([championName, { score, winRate }]) => {
					if (score > bestScore) {
						bestScore = score;
						bestChamp = championName;
						bestWinRate = `${winRate.toFixed(2)}%`;
					}
				},
			);

			compositions[laneName] = { champion: bestChamp, winRate: bestWinRate };
		});

		return compositions;
	}, [tierWeight, teamChampStatsByLane, top5TierList]);

	return (
		<div className="flex w-screen gap-4 bg-white p-6 rounded-lg shadow-md">
			<h2 className="text-xl font-semibold text-gray-800 mb-4">추천 조합</h2>

			<div className="mb-4">
				<label
					htmlFor="tierWeight"
					className="block text-gray-700 font-bold mb-2"
				>
					1티어 챔피언 비율: {tierWeight}% (우리팀 승률 챔피언 비율:{" "}
					{teamWeight}%)
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
				{Object.entries(recommendedCompositions).map(([lane, data]) => (
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
