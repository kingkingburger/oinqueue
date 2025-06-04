import React from "react";

type Item = {
	label: string;
};

export const PlayHistory = () => {
	// 5개의 행을 만드는 배열
	const rows = Array.from({ length: 5 }, (_, i) => i);

	// 왼쪽 혹은 오른쪽 그룹에 들어갈 한 행(row) JSX를 반환하는 함수
	const renderRow = (key: number) => (
		<div
			key={key}
			className="bg-gray-300 w-full flex items-center px-3 gap-x-4"
		>
			{/* 이미지 박스 */}
			<div className="w-15 h-15 bg-amber-600 flex items-center justify-center flex-shrink-0">
				이미지 입니다
			</div>

			{/* 텍스트 박스 */}
			<div className="bg-blue-300 flex-1 flex items-center justify-center h-15">
				kda 입니다
			</div>
		</div>
	);

	return (
		<div className="flex flex-row gap-x-4 items-start">
			{/* 왼쪽 그룹: rows 배열을 돌면서 renderRow 호출 */}
			<div className="flex flex-col gap-y-4">
				{rows.map((idx) => renderRow(idx))}
			</div>
			{/* 오른쪽 그룹: 왼쪽과 동일하게 renderRow 호출 */}
			<div className="flex flex-col gap-y-4">
				{rows.map((idx) => renderRow(idx + rows.length))}
				{/* 키 충돌을 피하기 위해 key 값을 offset 처리(idx + 5) */}
			</div>
		</div>
	);
};
