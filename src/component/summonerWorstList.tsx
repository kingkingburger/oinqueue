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

type BottomChampion = {
	name: string;
	winRate: number;
	rank: number;
};

type WinRateData = {
	summoner: string;
	champions: Champion[];
	bottom3Champions: BottomChampion[];
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

const sortByWinRateAsc = (a: Champion, b: Champion): number =>
	a.winRate - b.winRate;

const createBottomChampion = (
	champion: Champion,
	index: number,
): BottomChampion => ({
	name: champion.name,
	winRate: champion.winRate,
	rank: index + 1,
});

const getBottom3Champions = (champions: Champion[]): BottomChampion[] =>
	champions.slice(0, 3).map(createBottomChampion);

const processStatsForSummoner = ([summoner, statsObj]: [
	string,
	Record<string, ChampionStats>,
]): WinRateData => {
	const champions = Object.entries(statsObj)
		.map(createChampion)
		.sort(sortByWinRateAsc);

	return {
		summoner,
		champions,
		bottom3Champions: getBottom3Champions(champions),
	};
};

const transformPerSummonerStats = (
	perSummonerStats: PerSummonerStats,
): WinRateData[] =>
	Object.entries(perSummonerStats).map(processStatsForSummoner);

// 스타일링 함수들
const getRankColor = (rank: number): string => {
	const colorMap: Record<number, string> = {
		1: "font-bold text-red-600 bg-red-50",
		2: "font-bold text-orange-600 bg-orange-50",
		3: "font-bold text-yellow-600 bg-yellow-50",
	};
	return colorMap[rank] || "text-gray-700";
};

const getMedalIcon = (rank: number): string => {
	const medalMap: Record<number, string> = {
		1: "💀",
		2: "😵",
		3: "😰",
	};
	return medalMap[rank] || "";
};

const formatWinRate = (winRate: number): string =>
	`${(winRate * 100).toFixed(1)}%`;

const formatGameRecord = (wins: number, total: number): string =>
	`(${wins}승 / ${total - wins}패)`;

// 컴포넌트 렌더링 함수들
const renderBottom3Item = ({ name, winRate, rank }: BottomChampion) => (
	<div key={name} className="text-xs">
		<span className="inline-block w-4">{rank}위</span>
		<span className={`px-1 rounded ${getRankColor(rank)}`}>
			{name}: {formatWinRate(winRate)}
		</span>
	</div>
);

const renderBottom3Section = (bottom3Champions: BottomChampion[]) => (
	<div className="mb-3 p-2 bg-red-50 rounded">
		<h4 className="text-sm font-medium text-red-800 mb-1">💔 Bottom 3</h4>
		<div className="space-y-1">{bottom3Champions.map(renderBottom3Item)}</div>
	</div>
);

const findBottomChampionByName =
	(bottom3Champions: BottomChampion[]) =>
	(name: string): BottomChampion | undefined =>
		bottom3Champions.find((bc) => bc.name === name);

const renderChampionItem =
	(bottom3Champions: BottomChampion[]) =>
	({ name, wins, total, winRate }: Champion) => {
		const findBottomChampion = findBottomChampionByName(bottom3Champions);
		const bottomChampion = findBottomChampion(name);
		const isBottom3 = Boolean(bottomChampion);
		const rankColor =
			isBottom3 && bottomChampion
				? getRankColor(bottomChampion.rank)
				: "text-gray-700";

		return (
			<li key={name} className={`px-2 py-1 rounded ${rankColor}`}>
				{isBottom3 && bottomChampion && (
					<span className="inline-block w-6 text-xs">
						{getMedalIcon(bottomChampion.rank)}
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
	bottom3Champions: BottomChampion[],
) => (
	<ul className="space-y-1">
		{champions.map(renderChampionItem(bottom3Champions))}
	</ul>
);

const renderSummonerCard = ({
	summoner,
	champions,
	bottom3Champions,
}: WinRateData) => (
	<div
		key={summoner}
		className="flex-1 min-w-0 p-4 bg-white rounded-lg shadow-sm"
	>
		<h3 className="text-lg font-semibold mb-2">{summoner}님의 챔피언 승률</h3>
		{renderBottom3Section(bottom3Champions)}
		{renderChampionsList(champions, bottom3Champions)}
	</div>
);

const SummonerWorstRateList: React.FC<Props> = ({ perSummonerStats }) => {
	const data = transformPerSummonerStats(perSummonerStats);

	return (
		<div className="flex w-screen gap-4">{data.map(renderSummonerCard)}</div>
	);
};

export default SummonerWorstRateList;
