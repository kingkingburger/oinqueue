import { getRiotPuuid } from "@/lib/getRiotPuuid";
import type React from "react";

interface PlayerProps {
	gameName: string;
	tagName: string;
}

export const Player: React.FC<PlayerProps> = async ({ gameName, tagName }) => {
	const puuid = await getRiotPuuid(gameName, tagName);

	return <div>player layout</div>;
};
