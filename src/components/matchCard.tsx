import { PlayHistory } from "@/components/playHistory";
import type React from "react";

type MatchCardProps = {
	matchIndex: number;
	participants: React.ComponentProps<typeof PlayHistory>["participants"];
	matchId: string;
};

const MatchCard = ({ matchIndex, participants, matchId }: MatchCardProps) => (
	<div
		key={matchId}
		className="
		  w-full             /* 부모 너비만큼 늘어남 */
		  min-w-0       /* 최대 너비 300px */
		  flex-shrink         /* 축소 허용 */
		  bg-white            /* 배경 흰색 */
		  border border-gray-200 /* 연한 테두리 */
		  rounded-2xl         /* 둥근 모서리 */
		  shadow-sm hover:shadow-md transition-shadow /* 부드러운 그림자 */
		  p-4                 /* 내부 여백 */
		  flex flex-col       /* 수직 정렬 */
		"
	>
		<h2 className="text-lg font-semibold text-gray-800 truncate mb-2">
			매치 {matchIndex + 1}
		</h2>
		<div className="flex-1 overflow-hidden">
			<PlayHistory participants={participants} />
		</div>
	</div>
);

export default MatchCard;
