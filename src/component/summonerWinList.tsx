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

type BottomChampion = {
	name: string;
	winRate: number;
	rank: number;
};

type RateData = {
	summoner: string;
	champions: Champion[];
	top3Champions: TopChampion[];
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

const sortByWinRateDesc = (a: Champion, b: Champion): number =>
	b.winRate - a.winRate;

const sortByWinRateAsc = (a: Champion, b: Champion): number =>
	a.winRate - b.winRate;

const createTopChampion = (champion: Champion, index: number): TopChampion => ({
	name: champion.name,
	winRate: champion.winRate,
	rank: index + 1,
});

const createBottomChampion = (
	champion: Champion,
	index: number,
): BottomChampion => ({
	name: champion.name,
	winRate: champion.winRate,
	rank: index + 1,
});

const getTop3Champions = (champions: Champion[]): TopChampion[] =>
	champions.slice(0, 3).map(createTopChampion);

const getBottom3Champions = (champions: Champion[]): BottomChampion[] =>
	champions.slice(0, 3).map(createBottomChampion);

const processStatsForSummoner = ([summoner, statsObj]: [
	string,
	Record<string, ChampionStats>,
]): RateData => {
	const champions = Object.entries(statsObj)
		.map(createChampion)
		.sort(sortByWinRateDesc);

	return {
		summoner,
		champions,
		top3Champions: getTop3Champions(champions),
		bottom3Champions: getBottom3Champions(
			champions.toSorted(sortByWinRateAsc), // 불변 정렬
		),
	};
};

const transformPerSummonerStats = (
	perSummonerStats: PerSummonerStats,
): RateData[] => Object.entries(perSummonerStats).map(processStatsForSummoner);

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

const getWorstIcon = (rank: number): string => {
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
	`(${wins}승 / ${total}패)`;

// 컴포넌트 렌더링 함수들
const renderTop3Item = ({ name, winRate, rank }: TopChampion) => (
	<div key={name} className="flex flex-row items-center text-sm">
		<span className="text-lg">{getMedalIcon(rank)}</span>
		<span className={`px-2 py-1 rounded ${getRankColor(rank)}`}>
			<div className="flex flex-col">
				<div>{name}</div>
				<div>{formatWinRate(winRate)}</div>
			</div>
		</span>
	</div>
);

const renderTop3Section = (top3Champions: TopChampion[]) => (
	<div className="flex-1 mb-3 p-3 bg-blue-50 rounded-lg">
		<h4 className="text-sm font-medium text-blue-800 mb-2">🏆 Top 3</h4>
		<div className="flex flex-col justify-between">
			{top3Champions.map(renderTop3Item)}
		</div>
	</div>
);

const renderBottom3Item = ({ name, winRate, rank }: BottomChampion) => (
	<div key={name} className="flex items-center text-sm">
		<span className="text-lg">{getWorstIcon(rank)}</span>
		<span className={`px-2 py-1 rounded ${getRankColor(rank)}`}>
			<div className="flex flex-col">
				<div>{name}</div>
				<div>{formatWinRate(winRate)}</div>
			</div>
		</span>
	</div>
);

const renderBottom3Section = (bottom3Champions: BottomChampion[]) => (
	<div className="flex-1 mb-3 p-3 bg-red-50 rounded-lg">
		<h4 className="text-sm font-medium text-red-800 mb-2">💔 Bottom 3</h4>
		<div className="flex flex-col justify-between">
			{bottom3Champions.map(renderBottom3Item)}
		</div>
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
		{champions.slice(0, 6).map(renderChampionItem(top3Champions))}
	</ul>
);

const renderSummonerCard = ({
	summoner,
	champions,
	top3Champions,
	bottom3Champions,
}: RateData) => (
	<div key={summoner} className="flex-1 p-4 bg-white rounded-2xl shadow-md">
		<h3 className="text-lg font-semibold mb-4">{summoner}님의 챔피언 승률</h3>
		{/* Top3, Bottom3 섹션을 가로로 나란히 배치 */}
		<div className="flex gap-4 mb-4">
			{renderTop3Section(top3Champions)}
			{renderBottom3Section(bottom3Champions)}
		</div>
		{/* 상위 6개 챔피언 리스트 */}
		{renderChampionsList(champions, top3Champions)}
	</div>
);

const SummonerWinRateList: React.FC<Props> = ({ perSummonerStats }) => {
	const data = transformPerSummonerStats(perSummonerStats);

	return (
		<div className="flex w-full gap-6 px-4">{data.map(renderSummonerCard)}</div>
	);
};

export default SummonerWinRateList;
