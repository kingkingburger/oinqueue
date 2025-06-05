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
				className={`${rowBgClass} w-full flex items-center px-3 gap-x-4 h-16 rounded-md`}
			>
				{/* 왼쪽: 챔피언 이름 */}
				<div className="w-16 h-16 bg-amber-600 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
					{participant.championName}
				</div>

				{/* 오른쪽: 소환사 이름 + KDA를 세로 정렬 */}
				<div className=" flex flex-col justify-center items-start px-2 h-16 rounded-md">
					{/* 1) 이름 영역: 고정 너비로 truncate */}
					<span className="block w-36 truncate font-medium text-white text-sm">
						{participant.riotIdGameName}
					</span>
					{/* 2) KDA: 이름 바로 아래에 배치 */}
					<span className="text-xs text-white">
						{participant.kills}/{participant.deaths}/{participant.assists}
					</span>
				</div>
			</div>
		);
	};

	return (
		<div className="flex flex-row gap-x-4 items-start">
			{/* 왼쪽 그룹: 5개 행 */}
			<div className="flex flex-col gap-y-4">
				{leftColumn.map((p, idx) => renderRow(p, idx))}
			</div>

			{/* 오른쪽 그룹: 5개 행 */}
			<div className="flex flex-col gap-y-4">
				{rightColumn.map((p, idx) => renderRow(p, idx + 5))}
			</div>
		</div>
	);
};
