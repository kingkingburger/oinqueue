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
	matchInfoTimeline: TimelineDto[];
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

const transformToMatchInfoTimeline = (record: MatchRecord): TimelineDto =>
	record.match_info_timeline;

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
			matchInfoTimeline: [],
			lastUpdated: null,
		};
	}

	const matchRecords = records || [];

	return {
		matchIds: createMatchIdSet(matchRecords),
		matchInfos: matchRecords.map(transformToMatchInfo),
		matchInfoTimeline: matchRecords.map(transformToMatchInfoTimeline),
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
// const fetchNewMatchInfos = async (
// 	newMatchIds: string[],
// ): Promise<MatchInfoResponse[]> => Promise.all(newMatchIds.map(getMatchInfo));

/**
 * Riot API에서 새로운 매치 Timeline 정보를 가져옴
 * @param newMatchIds 가져올 매치 ID 목록
 * @returns 매치 정보 배열
 */
// const fetchNewTimelineMatchInfos = async (
// 	newMatchIds: string[],
// ): Promise<TimelineDto[]> => Promise.all(newMatchIds.map(getMatchTimeLineInfo));

// 메인 함수

/**
 * 딜레이를 추가하는 헬퍼 함수
 * @param ms 밀리초 단위
 */
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * 캐시된 매치 정보들을 가져오는 메인 함수 (최종 수정본)
 * - getMatchInfo, getMatchTimeLineInfo를 직접 사용하여 API 속도 제한을 준수
 *
 * @param puuid riot에서 고유값으로 사용하는 puuid
 * @param requestCount 요청할 매치 개수 (기본값: 50)
 * @returns 최신순으로 정렬된 매치 정보 배열
 */
export const getCachedMatchInfos = async (
	puuid: string,
	requestCount = 50,
): Promise<{
	matchInfos: MatchInfoResponse[];
	matchTimelines: TimelineDto[];
}> => {
	try {
		// 1. 기존 캐시 데이터 로드 및 업데이트 시간 확인
		const existingData = await loadExistingMatchData(puuid);
		const fifteenMinutes = 15 * 60 * 1000;
		if (
			existingData.lastUpdated &&
			new Date().getTime() - new Date(existingData.lastUpdated).getTime() <
				fifteenMinutes
		) {
			return {
				matchInfos: existingData.matchInfos,
				matchTimelines: existingData.matchInfoTimeline,
			};
		}

		// 2. 최신 매치 ID 목록 가져오기
		const allMatchIds = await getMatchList({ puuid, count: requestCount });
		await delay(1200); // API 호출 후 잠시 대기

		const newMatchIds = allMatchIds.filter(
			(id) => !existingData.matchIds.has(id),
		);

		if (newMatchIds.length === 0) {
			return {
				matchInfos: existingData.matchInfos,
				matchTimelines: existingData.matchInfoTimeline,
			};
		}

		// 3. 새로운 매치 정보들을 '하나의 루프'에서 순차적으로 가져오기 (핵심 변경사항)
		const newMatchInfosArr: MatchInfoResponse[] = [];
		const newTimelinesArr: TimelineDto[] = [];

		for (const matchId of newMatchIds) {
			try {
				console.log(`- ${matchId} 데이터 가져오는 중...`);

				// 매치 정보 가져오기
				const matchInfo = await getMatchInfo(matchId);
				newMatchInfosArr.push(matchInfo);
				await delay(1200); // API 요청 속도 제한을 위한 딜레이 (필수)

				// 타임라인 정보 가져오기
				const timeline = await getMatchTimeLineInfo(matchId);
				newTimelinesArr.push(timeline);
				await delay(1200); // API 요청 속도 제한을 위한 딜레이 (필수)
			} catch (err) {
				console.error(
					`- ${matchId} 처리 중 에러 발생, 다음으로 넘어갑니다:`,
					err,
				);
				// 특정 매치에서 404(Not Found) 등 에러 발생 시 건너뛰고 계속 진행
			}
		}

		// 4. 새 데이터를 DB 형식에 맞게 변환하고 저장
		const newMatches = newMatchInfosArr.map((info) => ({
			matchId: info.metadata.matchId,
			matchInfo: info,
		}));
		const newTimelines = newTimelinesArr.map((timeline) => ({
			matchId: timeline.metadata.matchId,
			matchInfo: timeline,
		}));

		if (newMatches.length > 0) {
			await saveNewMatchInfos(puuid, newMatches, newTimelines);
		}

		// 5. 기존 데이터와 새 데이터를 합쳐서 반환
		const combinedInfos = [
			...existingData.matchInfos,
			...newMatchInfosArr,
		].sort((a, b) => b.info.gameCreation - a.info.gameCreation);

		const combinedTimelines = [
			...existingData.matchInfoTimeline,
			...newTimelines.map((t) => t.matchInfo),
		].sort(
			(a, b) => b.metadata.matchId.localeCompare(a.metadata.matchId), // matchId 기준 혹은 timestamp 기준으로 정렬
		);

		return {
			matchInfos: combinedInfos,
			matchTimelines: combinedTimelines,
		};
	} catch (error) {
		console.error("getCachedMatchInfos 전역 에러:", error);
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
