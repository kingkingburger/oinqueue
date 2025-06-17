import { getMatchInfo } from "@/lib/riotApi/getMatchInfo";
import { getMatchList } from "@/lib/riotApi/getMatchList";
import { getMatchTimeLineInfo } from "@/lib/riotApi/getMatchTimeline";
import { getRiotSummonerInfo } from "@/lib/riotApi/getRiotSummonerInfo";
import type { MatchInfoResponse } from "@/lib/riotApi/type/matchInfoResponse";

import type { TimelineDto } from "@/lib/riotApi/type/mathInfoTimeLineResponse";
import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 데이터베이스 타입 정의
interface MatchRecord {
	id: string;
	puuid: string;
	match_id: string;
	match_info: MatchInfoResponse;
	match_info_timeline: TimelineDto;
	game_creation: number;
	created_at: string;
	updated_at: string;
}

interface CachedMatchData {
	matchIds: Set<string>;
	matchInfos: MatchInfoResponse[];
	lastUpdated: string | null;
}

// 데이터 변환 유틸리티 함수들
const createMatchRecord = (
	puuid: string,
	matchId: string,
	matchInfo: MatchInfoResponse,
	matchInfoTimeline: { matchId: string; matchInfo: TimelineDto },
): Omit<MatchRecord, "id" | "created_at" | "updated_at"> => ({
	puuid,
	match_id: matchId,
	match_info: matchInfo,
	match_info_timeline: matchInfoTimeline.matchInfo,
	game_creation: matchInfo.info.gameCreation,
});

// DB 레코드를 매치 정보로 변환
const transformToMatchInfo = (record: MatchRecord): MatchInfoResponse =>
	record.match_info;

// 매치 레코드 배열에서 매치 ID Set 생성
const createMatchIdSet = (records: MatchRecord[]): Set<string> =>
	new Set(records.map((record) => record.match_id));

// 레코드들 중 가장 최근 업데이트 시간 반환
const getLastUpdated = (records: MatchRecord[]): string | null =>
	records.length > 0
		? Math.max(
				...records.map((r) => new Date(r.updated_at).getTime()),
			).toString()
		: null;

// 데이터베이스 접근 함수들

/**
 * 기존 매치 데이터를 데이터베이스에서 로드
 * @param puuid 플레이어의 고유 식별자
 * @returns 캐시된 매치 데이터
 */
const loadExistingMatchData = async (
	puuid: string,
): Promise<CachedMatchData> => {
	const { data: records, error } = await supabase
		.from("match_cache")
		.select("*")
		.eq("puuid", puuid)
		.order("game_creation", { ascending: false });

	if (error) {
		console.error("매치 데이터 로드 실패:", error);
		return {
			matchIds: new Set(),
			matchInfos: [],
			lastUpdated: null,
		};
	}

	const matchRecords = records || [];

	return {
		matchIds: createMatchIdSet(matchRecords),
		matchInfos: matchRecords.map(transformToMatchInfo),
		lastUpdated: getLastUpdated(matchRecords),
	};
};

/**
 * 새로운 매치 정보들을 데이터베이스에 저장
 * @param puuid 플레이어의 고유 식별자
 * @param newMatches 저장할 새로운 매치 정보들
 * @param newMatchTimelines
 */
const saveNewMatchInfos = async (
	puuid: string,
	newMatches: { matchId: string; matchInfo: MatchInfoResponse }[],
	newMatchTimelines: { matchId: string; matchInfo: TimelineDto }[],
): Promise<void> => {
	if (newMatches.length === 0) return;

	const recordsToInsert = newMatches.map(({ matchId, matchInfo }) => {
		const timelineEntry = newMatchTimelines.find((t) => t.matchId === matchId);
		if (!timelineEntry) {
			// 타임라인이 없으면 건너뛰거나, 기본값을 설정할 수 있어요
			throw new Error(`타임라인 정보가 없습니다: ${matchId}`);
		}
		return createMatchRecord(puuid, matchId, matchInfo, timelineEntry);
	});

	const { error } = await supabase.from("match_cache").upsert(recordsToInsert);

	if (error) {
		console.error("매치 데이터 저장 실패:", error);
		throw new Error(`매치 데이터 저장 실패: ${error.message}`);
	}
};

/**
 * Riot API에서 새로운 매치 정보들을 가져옴
 * @param newMatchIds 가져올 매치 ID 목록
 * @returns 매치 정보 배열
 */
const fetchNewMatchInfos = async (
	newMatchIds: string[],
): Promise<MatchInfoResponse[]> => Promise.all(newMatchIds.map(getMatchInfo));

/**
 * Riot API에서 새로운 매치 Timeline 정보를 가져옴
 * @param newMatchIds 가져올 매치 ID 목록
 * @returns 매치 정보 배열
 */
const fetchNewTimelineMatchInfos = async (
	newMatchIds: string[],
): Promise<TimelineDto[]> => Promise.all(newMatchIds.map(getMatchTimeLineInfo));

// 메인 함수

/**
 * 캐시된 매치 정보들을 가져오는 메인 함수
 * - 기존 캐시된 데이터와 새로운 매치를 비교하여 중복 없이 반환
 * - 새로운 매치가 있으면 자동으로 캐시에 저장
 *
 * @param mainGameName 게임 내 닉네임
 * @param mainTagName 태그 이름 (예: KR1)
 * @param requestCount 요청할 매치 개수 (기본값: 50)
 * @returns 최신순으로 정렬된 매치 정보 배열
 */
export const getCachedMatchInfos = async (
	mainGameName: string,
	mainTagName: string,
	requestCount = 50,
): Promise<MatchInfoResponse[]> => {
	try {
		// 플레이어의 PUUID 가져오기
		const { puuid } = await getRiotSummonerInfo(mainGameName, mainTagName);

		// 기존 캐시된 매치 데이터 로드
		const existingData = await loadExistingMatchData(puuid);

		// Riot API에서 최신 매치 ID 목록 가져오기
		const allMatchIds = await getMatchList({ puuid, count: requestCount });

		// 캐시에 없는 새로운 매치 ID만 필터링
		const newMatchIds = allMatchIds.filter(
			(id) => !existingData.matchIds.has(id),
		);

		// 새로운 매치가 없으면 기존 데이터 반환
		if (newMatchIds.length === 0) {
			return existingData.matchInfos;
		}

		// 새로운 매치 정보들을 Riot API에서 가져오기
		const newMatchInfos = await fetchNewMatchInfos(newMatchIds);
		const newMatches = newMatchIds.map((matchId, index) => ({
			matchId,
			matchInfo: newMatchInfos[index],
		}));

		//Timeline 기준으로 매치 정보 가져오기
		const newMatchTimelineInfos = await fetchNewTimelineMatchInfos(newMatchIds);
		const newMatchTimelines = newMatchTimelineInfos.map((matchId, index) => ({
			matchId: matchId.metadata.matchId,
			matchInfo: newMatchTimelineInfos[index],
		}));

		// 새로운 매치 정보들을 데이터베이스에 저장
		await saveNewMatchInfos(puuid, newMatches, newMatchTimelines);

		// 새로운 매치와 기존 매치를 합쳐서 반환
		const allMatchInfos = [...newMatchInfos, ...existingData.matchInfos];

		// 게임 생성 시간 기준으로 최신순 정렬하여 반환
		return allMatchInfos.sort(
			(a, b) => b.info.gameCreation - a.info.gameCreation,
		);
	} catch (error) {
		console.error("getCachedMatchInfos 에러:", error);
		throw error;
	}
};

// 추가 유틸리티 함수들

/**
 * 특정 플레이어의 모든 매치 캐시를 삭제
 * @param puuid 플레이어의 고유 식별자
 */
export const clearMatchCache = async (puuid: string): Promise<void> => {
	const { error } = await supabase
		.from("match_cache")
		.delete()
		.eq("puuid", puuid);

	if (error) {
		console.error("매치 캐시 삭제 실패:", error);
		throw new Error(`매치 캐시 삭제 실패: ${error.message}`);
	}
};

/**
 * 특정 플레이어의 매치 캐시 통계 정보를 가져옴
 * @param puuid 플레이어의 고유 식별자
 * @returns 총 매치 수, 가장 오래된 매치, 가장 최신 매치 정보
 */
export const getMatchCacheStats = async (
	puuid: string,
): Promise<{
	totalMatches: number;
	oldestMatch: string | null;
	newestMatch: string | null;
}> => {
	const { data: records, error } = await supabase
		.from("match_cache")
		.select("game_creation")
		.eq("puuid", puuid)
		.order("game_creation", { ascending: false });

	if (error || !records) {
		return { totalMatches: 0, oldestMatch: null, newestMatch: null };
	}

	return {
		totalMatches: records.length,
		oldestMatch:
			records.length > 0
				? new Date(records[records.length - 1].game_creation).toISOString()
				: null,
		newestMatch:
			records.length > 0
				? new Date(records[0].game_creation).toISOString()
				: null,
	};
};
