export default function Loading() {
	return (
		<div className="min-h-screen bg-gray-100 p-6 font-sans">
			{/* YouTube 링크 스켈레톤 */}
			<div className="animate-pulse">
				<div className="inline-flex flex-row gap-2 items-center">
					<div className="w-6 h-6 bg-gray-300 rounded" />
					<div className="h-4 bg-gray-300 rounded w-32" />
				</div>
			</div>

			<div className="mt-4 grid grid-cols-12 gap-4">
				{/* 추천 조합 스켈레톤 */}
				<div className="col-span-12 animate-pulse">
					<div className="h-8 bg-gray-300 rounded w-48 mb-2" />
					<div className="h-48 bg-gray-300 rounded" />
				</div>

				{/* 팀의 지표 스켈레톤 (여러 개의 PerformanceGrid) */}
				<div className="col-span-12 animate-pulse space-y-4">
					{/* 첫 번째 팀원 지표 */}
					<div className="h-32 bg-gray-300 rounded" />
					{/* 두 번째 팀원 지표 */}
					<div className="h-32 bg-gray-300 rounded" />
					{/* 세 번째 팀원 지표 */}
					<div className="h-32 bg-gray-300 rounded" />
					{/* 네 번째 팀원 지표 */}
					<div className="h-32 bg-gray-300 rounded" />
					{/* 다섯 번째 팀원 지표 */}
					<div className="h-32 bg-gray-300 rounded" />
				</div>

				{/* 챔피언 승률, 숙련도 요약 스켈레톤 */}
				<div className="col-span-12 animate-pulse">
					<div className="h-8 bg-gray-300 rounded w-40 mb-2" />
					<div className="h-64 bg-gray-300 rounded" />
				</div>

				{/* lolps의 티어 리스트 스켈레톤 */}
				<div className="col-span-12 animate-pulse">
					<div className="h-8 bg-gray-300 rounded w-44 mb-2" />
					<div className="grid grid-cols-5 gap-4">
						{/* 5개 라인에 대한 티어 리스트 */}
						<div className="h-40 bg-gray-300 rounded" />
						<div className="h-40 bg-gray-300 rounded" />
						<div className="h-40 bg-gray-300 rounded" />
						<div className="h-40 bg-gray-300 rounded" />
						<div className="h-40 bg-gray-300 rounded" />
					</div>
				</div>

				{/* 최근 3개 매치 기록 스켈레톤 */}
				<div className="col-span-12 animate-pulse">
					<div className="h-8 bg-gray-300 rounded w-36 mb-2" />
					<div className="space-y-3">
						{/* 첫 번째 매치 */}
						<div className="h-20 bg-gray-300 rounded" />
						{/* 두 번째 매치 */}
						<div className="h-20 bg-gray-300 rounded" />
						{/* 세 번째 매치 */}
						<div className="h-20 bg-gray-300 rounded" />
					</div>
				</div>
			</div>
		</div>
	);
}
