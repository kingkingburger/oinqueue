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
	return <div>player layout</div>;
};
