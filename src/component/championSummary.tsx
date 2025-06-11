import React from "react";

type ChampionSummaryProps = {
	summonerName: string;
	bestChampion: string;
	bestWinRate: number;
};

const ChampionSummary = ({
	summonerName,
	bestChampion,
	bestWinRate,
}: ChampionSummaryProps) => (
	<div className="col-span-12 bg-white rounded-lg shadow-sm p-4 mb-4">
		{summonerName}
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
