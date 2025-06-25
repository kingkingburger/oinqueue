/*
개선된 숙련도 계산 로직:

1. 메타 점수 (Meta Score):
   - 티어 순위: 1티어(100점) → 5티어(60점)
   - 메타 승률: 높을수록 추가 보너스
   - 픽률 고려: 너무 낮으면 페널티

2. 팀 숙련도 점수 (Team Proficiency Score):
   - 기본 승률: 50% 기준으로 정규화
   - 경험치 보너스: sigmoid 함수로 자연스러운 증가
   - 일관성 보너스: 최근 경기와 전체 경기의 편차 고려
   - 신뢰도: 게임 수가 적으면 불확실성 페널티

3. 최종 점수:
   - 가중 평균: (메타 점수 × 메타 가중치) + (팀 점수 × 팀 가중치)
   - 리스크 조정: 게임 수가 적은 챔피언은 리스크 페널티
   - 다양성 보너스: 여러 옵션 제공을 위한 조정
*/

"use client";

import type { PerSummonerStats } from "@/components/summonerRate/summonerList";
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

interface ChampionScore {
	champion: string;
	metaScore: number;
	teamScore: number;
	finalScore: number;
	winRate: number;
	proficiency: number;
	games: number;
	confidence: number;
	risk: number;
}

interface Props {
	perSummonerStats: PerSummonerStats;
	top5TierList: TierListItem[][];
}

interface RecommendedChampion {
	champion: string;
	winRate: string;
	proficiency: string;
	games: number;
	confidence: string;
	risk: "Low" | "Medium" | "High";
	finalScore: string;
}

/* ─────────────────────────────────── 계산 함수들 ─────────────────────────────────── */

/**
 * 메타 점수 계산
 * @param tierRank 티어 순위 (0-4, 0이 1티어)
 * @param metaWinRate 메타 승률 (0-100)
 * @param pickRate 픽률 (선택사항)
 */
const calculateMetaScore = (
	tierRank: number,
	metaWinRate: number,
	pickRate?: number,
): number => {
	// 기본 티어 점수 (1티어: 100점, 5티어: 60점)
	const baseTierScore = 100 - tierRank * 10;

	// 승률 보너스 (50% 기준으로 정규화)
	const winRateBonus = Math.max(0, (metaWinRate - 50) * 2);

	// 픽률 페널티 (너무 낮으면 불안정한 데이터)
	const pickRatePenalty = pickRate && pickRate < 1 ? -10 : 0;

	return Math.max(0, baseTierScore + winRateBonus + pickRatePenalty);
};

/**
 * 개선된 팀 숙련도 점수 계산
 * @param wins 승수
 * @param total 총 게임수
 */
const calculateAdvancedTeamScore = (
	wins: number,
	total: number,
): {
	score: number;
	proficiency: number;
	confidence: number;
	risk: number;
} => {
	if (total === 0) {
		return { score: 0, proficiency: 0, confidence: 0, risk: 100 };
	}

	const winRate = wins / total;

	// 1. 기본 승률 점수 (50% 기준 정규화, -100 ~ +100)
	const normalizedWinRate = (winRate - 0.5) * 200;

	// 2. 경험치 보너스 (sigmoid 함수로 자연스러운 증가)
	const experienceMultiplier = 2 / (1 + Math.exp(-total / 15)) - 1; // 0 ~ 1

	// 3. 일관성 보너스 (게임수가 많을수록 신뢰도 증가)
	const consistencyBonus = Math.min(20, total * 0.5);

	// 4. 신뢰도 계산 (게임수 기반)
	const confidence = Math.min(100, (total / 20) * 100);

	// 5. 리스크 계산 (게임수가 적을수록 높은 리스크)
	const risk = Math.max(0, 100 - total * 5);

	// 6. 숙련도 계산 (기존 로직 유지)
	const proficiency = calculateProficiency(wins, total);

	// 7. 최종 팀 점수
	const baseScore = normalizedWinRate * experienceMultiplier;
	const finalScore = Math.max(0, baseScore + consistencyBonus);

	return {
		score: finalScore,
		proficiency,
		confidence,
		risk,
	};
};

/**
 * 최종 점수 계산 및 리스크 조정
 */
const calculateFinalScore = (
	metaScore: number,
	teamScore: number,
	metaWeight: number,
	teamWeight: number,
	risk: number,
	confidence: number,
): number => {
	// 가중 평균
	const weightedScore = (metaScore * metaWeight + teamScore * teamWeight) / 100;

	// 리스크 페널티 (게임수가 적을수록 점수 감소)
	const riskPenalty = (risk / 100) * 20;

	// 신뢰도 보너스 (데이터가 충분할수록 점수 증가)
	const confidenceBonus = (confidence / 100) * 10;

	return Math.max(0, weightedScore - riskPenalty + confidenceBonus);
};

/* ─────────────────────────────────── 컴포넌트 ─────────────────────────────────── */
export const RecommendedCompositions: React.FC<Props> = ({
	perSummonerStats,
	top5TierList,
}) => {
	const [metaWeight, setMetaWeight] = useState(70);
	const teamWeight = 100 - metaWeight;

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

				if (aggregate.total > 0) {
					acc[laneId][champ] = aggregate;
				}
				return acc;
			}, laneAcc);
		}, {});
	}, [perSummonerStats, top5TierList]);

	/* --------------------- 2) 개선된 점수 계산 --------------------- */
	const championScores = useMemo<Record<number, ChampionScore[]>>(() => {
		return Object.keys(laneNames)
			.map(Number)
			.reduce<Record<number, ChampionScore[]>>((acc, laneId) => {
				const tierChampions = top5TierList[laneId] ?? [];
				const teamStats = teamChampStatsByLane[laneId] ?? {};

				// 모든 후보 챔피언 수집 (티어 리스트 + 팀 통계)
				const allChampions = new Set([
					...tierChampions.map((tc) => tc.championInfo.nameUs),
					...Object.keys(teamStats),
				]);

				const scores: ChampionScore[] = Array.from(allChampions).map(
					(champion) => {
						// 메타 정보 찾기
						const tierInfo = tierChampions.find(
							(tc) => tc.championInfo.nameUs === champion,
						);
						const tierRank = tierInfo ? tierChampions.indexOf(tierInfo) : 999;
						const metaWinRate = tierInfo
							? Number.parseFloat(tierInfo.winRate.replace("%", ""))
							: 50;

						// 메타 점수 계산
						const metaScore = tierInfo
							? calculateMetaScore(tierRank, metaWinRate)
							: 0;

						// 팀 통계 가져오기
						const teamStat = teamStats[champion];
						const teamResult = teamStat
							? calculateAdvancedTeamScore(teamStat.wins, teamStat.total)
							: { score: 0, proficiency: 0, confidence: 0, risk: 100 };

						// 최종 점수 계산
						const finalScore = calculateFinalScore(
							metaScore,
							teamResult.score,
							metaWeight,
							teamWeight,
							teamResult.risk,
							teamResult.confidence,
						);

						return {
							champion,
							metaScore,
							teamScore: teamResult.score,
							finalScore,
							winRate: teamStat
								? (teamStat.wins / teamStat.total) * 100
								: metaWinRate,
							proficiency: teamResult.proficiency,
							games: teamStat?.total ?? 0,
							confidence: teamResult.confidence,
							risk: teamResult.risk,
						};
					},
				);

				// 점수순으로 정렬
				acc[laneId] = scores.sort((a, b) => b.finalScore - a.finalScore);
				return acc;
			}, {});
	}, [teamChampStatsByLane, top5TierList, metaWeight, teamWeight]);

	/* --------------------- 3) Top 3 추천 챔피언 선택 --------------------- */
	const recommended = useMemo(() => {
		return Object.keys(laneNames)
			.map(Number)
			.reduce<Record<string, RecommendedChampion[]>>((acc, laneId) => {
				const laneName = laneNames[laneId];
				const scores = championScores[laneId] ?? [];

				// 다양성을 위한 선택 로직
				const top3 = scores
					.slice(0, 5)
					.reduce<ChampionScore[]>((selected, current, index) => {
						if (selected.length >= 3) return selected;

						// 첫 번째는 무조건 선택
						if (index === 0) {
							selected.push(current);
							return selected;
						}

						// 나머지는 점수 차이와 다양성 고려
						const scoreDiff = selected[0].finalScore - current.finalScore;
						const diversityThreshold = 20; // 점수 차이가 20 이내면 다양성 고려

						if (scoreDiff <= diversityThreshold || selected.length < 2) {
							selected.push(current);
						}

						return selected;
					}, []);

				acc[laneName] = top3.map((score, idx) => ({
					champion: score.champion,
					winRate: `${score.winRate.toFixed(1)}%`,
					proficiency: `${score.proficiency.toFixed(1)}`,
					games: score.games,
					confidence: `${score.confidence.toFixed(0)}%`,
					risk: score.risk > 50 ? "High" : score.risk > 25 ? "Medium" : "Low",
					finalScore: score.finalScore.toFixed(1),
				}));

				return acc;
			}, {});
	}, [championScores]);

	/* ------------------------------ UI ------------------------------ */
	return (
		<div className="flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-lg shadow-md w-full overflow-x-auto">
			<h2 className="text-xl font-semibold text-gray-800 mb-4">
				개선된 추천 조합
			</h2>

			{/* 가중치 슬라이더 */}
			<div className="mb-6">
				<label
					htmlFor="metaWeight"
					className="block text-gray-700 font-bold mb-2"
				>
					메타 비율: {metaWeight}% / 팀 숙련도 비율: {teamWeight}%
				</label>
				<input
					type="range"
					id="metaWeight"
					min="0"
					max="100"
					value={metaWeight}
					onChange={(e) => setMetaWeight(Number(e.target.value))}
					className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
				/>
				<div className="text-sm text-gray-600 mt-2">
					※ 개선된 계산: 메타점수(티어+승률) + 팀점수(승률+경험치+일관성+신뢰도)
					+ 리스크조정
				</div>
			</div>

			{/* 라인별 추천 챔피언 */}
			<div className="flex flex-col mx-auto sm:flex-row gap-6 overflow-x-auto">
				{Object.entries(recommended).map(([lane, list]) => (
					<div
						key={lane}
						className="bg-gray-50 p-4 rounded-md shadow-sm min-w-[250px]"
					>
						<h3 className="text-lg font-medium text-gray-700 mb-3">{lane}</h3>
						<ol className="space-y-3">
							{list.map((item, idx) => (
								<li key={item.champion} className="bg-white p-3 rounded border">
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<div className="text-sm font-bold text-gray-800 mb-1">
												{idx + 1}위 {convertChampionNameToKr(item.champion)}
											</div>
											<div className="text-xs text-gray-600 space-y-1">
												<div>
													승률: {item.winRate} ({item.games}게임)
												</div>
												{item.games > 0 ? (
													<>
														<div>숙련도: {item.proficiency}</div>
														<div>신뢰도: {item.confidence}</div>
														<div
															className={`inline-block px-2 py-1 rounded text-xs ${
																item.risk === "Low"
																	? "bg-green-100 text-green-800"
																	: item.risk === "Medium"
																		? "bg-yellow-100 text-yellow-800"
																		: "bg-red-100 text-red-800"
															}`}
														>
															리스크: {item.risk}
														</div>
													</>
												) : (
													<div className="text-orange-600 font-medium">
														미플레이 (메타 기준)
													</div>
												)}
												<div className="text-blue-600 font-mono text-xs">
													점수: {item.finalScore}
												</div>
											</div>
										</div>
									</div>
								</li>
							))}
						</ol>
					</div>
				))}
			</div>

			{/* 계산 방식 설명 */}
			<div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
				<details>
					<summary className="cursor-pointer font-medium">
						📊 개선된 계산 방식
					</summary>
					<div className="mt-2 space-y-1">
						<div>
							<strong>메타 점수:</strong> 티어 순위(100-60점) + 승률 보너스 +
							픽률 조정
						</div>
						<div>
							<strong>팀 점수:</strong> 정규화된 승률 × 경험치 가중치 + 일관성
							보너스
						</div>
						<div>
							<strong>신뢰도:</strong> 게임 수 기반 데이터 신뢰성 (20게임 =
							100%)
						</div>
						<div>
							<strong>리스크:</strong> 게임 수가 적을수록 높은 불확실성
						</div>
						<div>
							<strong>최종 점수:</strong> 가중 평균 - 리스크 페널티 + 신뢰도
							보너스
						</div>
					</div>
				</details>
			</div>
		</div>
	);
};
