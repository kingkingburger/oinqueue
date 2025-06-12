import { convertChampionNameToKr } from "@/lib/convertChampionName";
import React from "react";

type Participant = {
	riotIdGameName: string;
	riotIdTagline: string;
	championName: string;
	kills: number;
	deaths: number;
	assists: number;
	win: boolean;
};

type PlayHistoryProps = {
	participants: Participant[];
};

export const PlayHistory = ({ participants }: PlayHistoryProps) => {
	const leftColumn = participants.slice(0, 5);
	const rightColumn = participants.slice(5, 10);

	const renderRow = (participant: Participant, key: number) => {
		const rowBgClass = participant.win ? "bg-blue-200" : "bg-red-200";

		return (
			<div
				key={key}
				className={`
          ${rowBgClass}
          flex items-center w-full
          px-3 py-2 gap-x-3
          rounded-md
        `}
			>
				{/* 챔피언 아이콘 */}
				<div
					className="
            flex-shrink-0
            w-12 h-12 sm:w-16 sm:h-16
            bg-amber-600
            flex items-center justify-center
            text-white font-semibold text-sm
          "
				>
					{convertChampionNameToKr(participant.championName)}
					{participant.championName}
				</div>

				{/* 소환사 이름 + KDA */}
				<div className="flex-1 min-w-0 flex flex-col justify-center px-2">
					<span className="truncate font-medium text-white text-sm">
						{participant.riotIdGameName}
					</span>
					<span className="text-xs text-white">
						{participant.kills}/{participant.deaths}/{participant.assists}
					</span>
				</div>
			</div>
		);
	};

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div className="flex flex-col gap-4">
				{leftColumn.map((p, idx) => renderRow(p, idx))}
			</div>
			{rightColumn.length > 0 && (
				<div className="flex flex-col gap-4">
					{rightColumn.map((p, idx) => renderRow(p, idx + 5))}
				</div>
			)}
		</div>
	);
};
