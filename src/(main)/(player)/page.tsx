import { getMatchResult } from "@/lib/getMatchList";
import { getRiotSummonerInfo } from "@/lib/getRiotSummonerInfo";
import type React from "react";

interface PlayerProps {
	gameName: string;
	tagName: string;
}

export const Player: React.FC<PlayerProps> = async ({ gameName, tagName }) => {
	const summonerInfo = await getRiotSummonerInfo(gameName, tagName);
	const matchIds = await getMatchResult(summonerInfo.puuid);

	console.log("matchIds = ", matchIds);
	return <div>player layout</div>;
};
