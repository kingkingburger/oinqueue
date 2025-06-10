import type React from "react";

export type ChampionStats = { wins: number; total: number };
export type PerSummonerStats = Record<string, Record<string, ChampionStats>>;

type Props = {
	perSummonerStats: PerSummonerStats;
};

type Champion = {
	name: string;
	wins: number;
	total: number;
	winRate: number;
};

type TopChampion = {
	name: string;
	winRate: number;
	rank: number;
};

type WinRateData = {
	summoner: string;
	champions: Champion[];
	top3Champions: TopChampion[];
};

// 순수 함수들
const calculateWinRate = (wins: number, total: number): number =>
	total > 0 ? wins / total : 0;

const createChampion = ([name, { wins, total }]: [
	string,
	ChampionStats,
]): Champion => ({
	name,
	wins,
	total,
	winRate: calculateWinRate(wins, total),
});

const sortByWinRateDesc = (a: Champion, b: Champion): number =>
	b.winRate - a.winRate;

const createTopChampion = (champion: Champion, index: number): TopChampion => ({
	name: champion.name,
	winRate: champion.winRate,
	rank: index + 1,
});

const getTop3Champions = (champions: Champion[]): TopChampion[] =>
	champions.slice(0, 3).map(createTopChampion);

const processStatsForSummoner = ([summoner, statsObj]: [
	string,
	Record<string, ChampionStats>,
]): WinRateData => {
	const champions = Object.entries(statsObj)
		.map(createChampion)
		.sort(sortByWinRateDesc);

	return {
		summoner,
		champions,
		top3Champions: getTop3Champions(champions),
	};
};

const transformPerSummonerStats = (
	perSummonerStats: PerSummonerStats,
): WinRateData[] =>
	Object.entries(perSummonerStats).map(processStatsForSummoner);

// 스타일링 함수들
const getRankColor = (rank: number): string => {
	const colorMap: Record<number, string> = {
		1: "font-bold text-yellow-600 bg-yellow-50",
		2: "font-bold text-gray-600 bg-gray-50",
		3: "font-bold text-orange-600 bg-orange-50",
	};
	return colorMap[rank] || "text-gray-700";
};

const getMedalIcon = (rank: number): string => {
	const medalMap: Record<number, string> = {
		1: "🥇",
		2: "🥈",
		3: "🥉",
	};
	return medalMap[rank] || "";
};

const formatWinRate = (winRate: number): string =>
	`${(winRate * 100).toFixed(1)}%`;

const formatGameRecord = (wins: number, total: number): string =>
	`(${wins}승 / ${total}패)`;

// 컴포넌트 렌더링 함수들
const renderTop3Item = ({ name, winRate, rank }: TopChampion) => (
	<div key={name} className="text-xs">
		<span className="inline-block w-4">{rank}위</span>
		<span className={`px-1 rounded ${getRankColor(rank)}`}>
			{name}: {formatWinRate(winRate)}
		</span>
	</div>
);

const renderTop3Section = (top3Champions: TopChampion[]) => (
	<div className="mb-3 p-2 bg-blue-50 rounded">
		<h4 className="text-sm font-medium text-blue-800 mb-1">🏆 Top 3</h4>
		<div className="space-y-1">{top3Champions.map(renderTop3Item)}</div>
	</div>
);

const findTopChampionByName =
	(top3Champions: TopChampion[]) =>
	(name: string): TopChampion | undefined =>
		top3Champions.find((tc) => tc.name === name);

const renderChampionItem =
	(top3Champions: TopChampion[]) =>
	({ name, wins, total, winRate }: Champion) => {
		const findTopChampion = findTopChampionByName(top3Champions);
		const topChampion = findTopChampion(name);
		const isTop3 = Boolean(topChampion);
		const rankColor =
			isTop3 && topChampion ? getRankColor(topChampion.rank) : "text-gray-700";

		return (
			<li key={name} className={`px-2 py-1 rounded ${rankColor}`}>
				{isTop3 && topChampion && (
					<span className="inline-block w-6 text-xs">
						{getMedalIcon(topChampion.rank)}
					</span>
				)}
				<span>
					{name}: {formatWinRate(winRate)} {formatGameRecord(wins, total)}
				</span>
			</li>
		);
	};

const renderChampionsList = (
	champions: Champion[],
	top3Champions: TopChampion[],
) => (
	<ul className="space-y-1">
		{champions.map(renderChampionItem(top3Champions))}
	</ul>
);

const renderSummonerCard = ({
	summoner,
	champions,
	top3Champions,
}: WinRateData) => (
	<div
		key={summoner}
		className="flex-1 min-w-0 p-4 bg-white rounded-lg shadow-sm"
	>
		<h3 className="text-lg font-semibold mb-2">{summoner}님의 챔피언 승률</h3>
		{renderTop3Section(top3Champions)}
		{renderChampionsList(champions, top3Champions)}
	</div>
);

const SummonerWinRateList: React.FC<Props> = ({ perSummonerStats }) => {
	const data = transformPerSummonerStats(perSummonerStats);

	return (
		<div className="flex w-screen gap-4">{data.map(renderSummonerCard)}</div>
	);
};

export default SummonerWinRateList;
