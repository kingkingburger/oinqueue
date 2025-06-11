import type { TierListItem } from "@/lib/topTierData/types";
import type React from "react";

interface LolpsTierListProps {
	top5TierList: TierListItem[][];
}

const lineName = ["탑", "정글", "미드", "원딜", "서폿"];

const formatWinRate = (winRate: string): string =>
	`${Number.parseFloat(winRate).toFixed(1)}%`;

// 챔피언 하나를 렌더링하는 순수 함수
const renderChampionItem = (item: TierListItem) => (
	<li
		key={item.championId}
		className="flex justify-between text-sm py-1 border-b last:border-none"
	>
		<span>{item.championInfo.nameKr}</span>
		<span>{formatWinRate(item.winRate)}</span>
	</li>
);

// lane별 상위 5개를 렌더링하는 순수 함수
const renderLaneSection = (laneList: TierListItem[], laneIdx: number) => (
	<div
		key={laneIdx}
		className="flex-1 min-w-[180px] p-4 bg-white rounded-lg shadow-sm"
	>
		<h3 className="text-lg font-semibold mb-2">{lineName[laneIdx]}</h3>
		<ul className="space-y-0">{laneList.map(renderChampionItem)}</ul>
	</div>
);

// 메인 컴포넌트: 함수형으로 리스트를 조합
export const LolpsTierList: React.FC<LolpsTierListProps> = ({
	top5TierList,
}) => (
	<div className="flex w-screen gap-4">
		{top5TierList.map(renderLaneSection)}
	</div>
);
