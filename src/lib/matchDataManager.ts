import * as fs from "node:fs/promises";
import path from "node:path";
import { getMatchInfo } from "@/lib/riotApi/getMatchInfo";
import { getMatchList } from "@/lib/riotApi/getMatchList";
import { getRiotSummonerInfo } from "@/lib/riotApi/getRiotSummonerInfo";
import type { MatchInfoResponse } from "@/lib/riotApi/type/matchInfoResponse";

interface MatchData {
	matchIds: string[];
	matchInfos: MatchInfoResponse[]; // getMatchInfo 반환 타입에 맞게 수정
	lastUpdated: string;
}

interface CachedMatchData {
	matchIds: Set<string>;
	matchInfos: MatchInfoResponse[];
	lastUpdated: string | null;
}

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureDataDir() {
	try {
		await fs.access(DATA_DIR);
	} catch {
		await fs.mkdir(DATA_DIR, { recursive: true });
	}
}

async function loadExistingMatchData(puuid: string): Promise<CachedMatchData> {
	await ensureDataDir();

	const filePath = path.join(DATA_DIR, `${puuid}_match_data.json`);

	try {
		const data = await fs.readFile(filePath, "utf8");
		const parsed: MatchData = JSON.parse(data);
		return {
			matchIds: new Set(parsed.matchIds || []),
			matchInfos: parsed.matchInfos || [],
			lastUpdated: parsed.lastUpdated,
		};
	} catch {
		return {
			matchIds: new Set(),
			matchInfos: [],
			lastUpdated: null,
		};
	}
}

async function saveMatchData(
	puuid: string,
	matchIds: Set<string>,
	matchInfos: MatchInfoResponse[],
) {
	await ensureDataDir();

	const filePath = path.join(DATA_DIR, `${puuid}_match_data.json`);

	const dataToSave: MatchData = {
		matchIds: Array.from(matchIds),
		matchInfos: matchInfos,
		lastUpdated: new Date().toISOString(),
	};

	await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2));
}

export async function getCachedMatchInfos(
	mainGameName: string,
	mainTagName: string,
	requestCount = 50,
) {
	const { puuid } = await getRiotSummonerInfo(mainGameName, mainTagName);
	const existingData = await loadExistingMatchData(puuid);

	const allMatchIds = await getMatchList({ puuid, count: requestCount });
	const newMatchIds = allMatchIds.filter(
		(id) => !existingData.matchIds.has(id),
	);

	let newMatchInfos: MatchInfoResponse[] = [];
	if (newMatchIds.length > 0) {
		newMatchInfos = await Promise.all(
			newMatchIds.map((id) => getMatchInfo(id)),
		);

		const updatedMatchInfos = [...newMatchInfos, ...existingData.matchInfos];
		const updatedMatchIds = new Set([...newMatchIds, ...existingData.matchIds]);

		await saveMatchData(puuid, updatedMatchIds, updatedMatchInfos);
	}

	const allMatchInfos =
		newMatchIds.length > 0
			? [...newMatchInfos, ...existingData.matchInfos]
			: existingData.matchInfos;

	return allMatchInfos.sort(
		(a, b) => b.info.gameCreation - a.info.gameCreation,
	);
}
