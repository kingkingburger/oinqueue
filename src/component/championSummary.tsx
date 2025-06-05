// components/ChampionSummary.tsx
import React from "react";

type ChampionSummaryProps = {
	bestChampion: string;
	bestWinRate: number;
};

const ChampionSummary = ({
	bestChampion,
	bestWinRate,
}: ChampionSummaryProps) => (
	<div className="col-span-12 bg-white rounded-lg shadow-sm p-4 mb-4">
		<h1 className="text-2xl font-semibold text-gray-800 mb-2">
			최근 20게임 중 승률이 가장 높은 챔피언
		</h1>
		{bestChampion ? (
			<p className="text-lg text-gray-700">
				챔피언: <span className="font-bold">{bestChampion}</span> (
				<span className="font-bold">{(bestWinRate * 100).toFixed(2)}%</span>)
			</p>
		) : (
			<p className="text-lg text-gray-700">데이터가 없습니다.</p>
		)}
	</div>
);

export default ChampionSummary;
