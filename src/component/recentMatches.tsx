import MatchCard from "@/component/matchCard";
import type React from "react";

type RecentMatchesProps = {
	participantsList: Array<
		React.ComponentProps<typeof MatchCard>["participants"]
	>;
	matchIds: string[];
};

const RecentMatches = ({ participantsList, matchIds }: RecentMatchesProps) => (
	<div className="bg-gray-300 rounded-lg p-4 overflow-x-auto">
		{/* 헤더 */}
		<div className="flex items-center mb-4">
			<h1 className="text-2xl font-semibold text-gray-800">매치 기록</h1>
			<div className="mx-2 w-px bg-black h-6" />
			<p className="text-sm text-gray-500">
				최근 {participantsList.length}개 매치를 확인하세요.
			</p>
		</div>

		{/* 반응형 그리드 */}
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{participantsList.map((participants, idx) => (
				<MatchCard
					key={matchIds[idx]}
					matchIndex={idx}
					participants={participants}
					matchId={matchIds[idx]}
				/>
			))}
		</div>
	</div>
);

export default RecentMatches;
