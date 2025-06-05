import React from "react";

type Participant = {
	summonerName: string;
	championName: string;
	kills: number;
	deaths: number;
	assists: number;
	win: boolean; // 승리 여부 추가
};

type PlayHistoryProps = {
	participants: Participant[];
};

export const PlayHistory = ({ participants }: PlayHistoryProps) => {
	// participants 배열 길이가 10이라고 가정
	// 2열 × 5행으로 보여주기 위해, 0~4 인덱스를 왼쪽 열, 5~9 인덱스를 오른쪽 열로 매핑
	const leftColumn = participants.slice(0, 5);
	const rightColumn = participants.slice(5, 10);

	// 한 행(row)을 그리는 함수
	// 배경색은 win 값에 따라 결정 (이겼으면 파란색 계열, 졌으면 붉은색 계열)
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

				{/* 오른쪽: 소환사 이름 + KDA */}
				<div className="bg-blue-300 flex-1 flex flex-col justify-center px-2 h-16 rounded-md">
					<span className="font-medium text-white text-sm">
						{participant.summonerName}
					</span>
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
