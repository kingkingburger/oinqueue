import MatchCard from "@/component/matchCard";
import type React from "react";

type RecentMatchesProps = {
	participantsList: Array<
		React.ComponentProps<typeof MatchCard>["participants"]
	>;
	matchIds: string[];
};

const RecentMatches = ({ participantsList, matchIds }: RecentMatchesProps) => (
	<div className="col-span-12 bg-gray-300 rounded-lg h-auto">
		<header className="px-4 mb-6 flex items-center gap-x-2">
			<h1 className="text-2xl font-semibold text-gray-800">매치 기록</h1>
			<div className="w-px bg-black h-6" /> {/* 간단한 세로선 대체 */}
			<p className="text-sm text-gray-500">최근 3개 매치를 확인하세요.</p>
		</header>
		<div className="px-4 overflow-x-auto">
			<div className="flex w-full gap-x-4">
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
	</div>
);

export default RecentMatches;
