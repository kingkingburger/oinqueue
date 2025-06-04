import { metadata } from "@/app/layout";
import { getMatchInfo } from "@/lib/riotApi/getMatchInfo";
import { getMatchList } from "@/lib/riotApi/getMatchList";
import {
	getRiotSummonerInfo,
	getRiotSummonerInfoByPuuid,
} from "@/lib/riotApi/getRiotSummonerInfo";
import type React from "react";

interface PlayerProps {
	gameName: string;
	tagName: string;
}

export const Player: React.FC<PlayerProps> = async ({ gameName, tagName }) => {
	const summonerInfo = await getRiotSummonerInfo(gameName, tagName);
	const matchIds = await getMatchList(summonerInfo.puuid);
	const matchInfo = await getMatchInfo(matchIds[3]);

	for (const participant of matchInfo.metadata.participants) {
		const summonerInfo = await getRiotSummonerInfoByPuuid(participant);
		// console.log("summonerInfo = ", summonerInfo.gameName);
	}

	return <div>player layout</div>;
};
