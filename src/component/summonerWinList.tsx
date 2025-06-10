import type React from "react";

export type ChampionStats = { wins: number; total: number };
export type PerSummonerStats = Record<string, Record<string, ChampionStats>>;

type Props = {
	perSummonerStats: PerSummonerStats;
};

type WinRateData = {
	summoner: string;
	champions: {
		name: string;
		wins: number;
		total: number;
		winRate: number;
	}[];
	bestChampion: {
		name: string;
		winRate: number;
	};
};

const SummonerWinRateList: React.FC<Props> = ({ perSummonerStats }) => {
	// 1) perSummonerStats → 렌더링용 배열로 변환
	const data: WinRateData[] = Object.entries(perSummonerStats).map(
		([summoner, statsObj]) => {
			// 챔피언별 승률 계산
			const champions = Object.entries(statsObj)
				.map(([name, { wins, total }]) => ({
					name,
					wins,
					total,
					winRate: total > 0 ? wins / total : 0,
				}))
				.sort((a, b) => b.winRate - a.winRate);

			// 가장 높은 승률 챔피언 추출
			const best = champions.reduce(
				(prev, cur) => (cur.winRate > prev.winRate ? cur : prev),
				{ name: "", wins: 0, total: 0, winRate: -1 },
			);

			return {
				summoner,
				champions,
				bestChampion: { name: best.name, winRate: best.winRate },
			};
		},
	);

	return (
		<div className="flex w-screen gap-4">
			{data.map(({ summoner, champions, bestChampion }) => (
				<div
					key={summoner}
					className="flex-1 min-w-0p-4 p-4 bg-white rounded-lg shadow-sm"
				>
					<h3 className="text-lg font-semibold mb-2">
						{summoner}님의 챔피언 승률
					</h3>
					<ul className="space-y-1">
						{champions.map(({ name, wins, total, winRate }) => (
							<li
								key={name}
								className={
									name === bestChampion.name
										? "font-bold text-blue-600"
										: "text-gray-700"
								}
							>
								{name}: {(winRate * 100).toFixed(1)}% ({wins}승 / {total}패)
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	);
};

export default SummonerWinRateList;
