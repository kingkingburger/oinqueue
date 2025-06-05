import { PlayHistory } from "@/component/playHistory";
// components/MatchCard.tsx
import type React from "react";

type MatchCardProps = {
	matchIndex: number;
	participants: React.ComponentProps<typeof PlayHistory>["participants"];
	matchId: string;
};

const MatchCard = ({ matchIndex, participants, matchId }: MatchCardProps) => (
	<div key={matchId} className="min-w-[300px]">
		<h2 className="text-xl font-semibold text-gray-700 mb-2">
			매치 {matchIndex + 1}
		</h2>
		<PlayHistory participants={participants} />
	</div>
);

export default MatchCard;
