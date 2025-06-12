import { championName } from "@/lib/championName";

export const convertChampionNameToKr = (championNameEg: string) => {
	return championName[championNameEg] || championNameEg;
};
