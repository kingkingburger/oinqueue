// 데이터 변환 유틸리티 함수들

import type { MatchRecord } from "@/lib/match/types/matchDataManager.type";
import type { MatchInfoResponse } from "@/lib/riotApi/type/matchInfoResponse";
import type { TimelineDto } from "@/lib/riotApi/type/mathInfoTimeLineResponse";

// DB 레코드를 매치 정보로 변환
export const transformToMatchInfo = (record: MatchRecord): MatchInfoResponse =>
	record.match_info;

export const transformToMatchInfoTimeline = (
	record: MatchRecord,
): TimelineDto => record.match_info_timeline;

// 매치 레코드 배열에서 매치 ID Set 생성
export const createMatchIdSet = (records: MatchRecord[]): Set<string> =>
	new Set(records.map((record) => record.match_id));

// 레코드들 중 가장 최근 업데이트 시간 반환
export const getLastUpdated = (records: MatchRecord[]): string | null =>
	records.length > 0
		? Math.max(
				...records.map((r) => new Date(r.updated_at).getTime()),
			).toString()
		: null;

// 매치 데이터를 전부 가져오는 함수
// 데이터가 너무 커서 부하가 걸림, 최적화한 방안을 사용하느라 deprecated 처리
// const createMatchRecord = (
// 	puuid: string,
// 	matchId: string,
// 	matchInfo: MatchInfoResponse,
// 	matchInfoTimeline: { matchId: string; matchInfo: TimelineDto },
// ): Omit<MatchRecord, "id" | "created_at" | "updated_at"> => ({
// 	puuid,
// 	match_id: matchId,
// 	match_info: matchInfo,
// 	match_info_timeline: matchInfoTimeline.matchInfo,
// 	game_creation: matchInfo.info.gameCreation,
// });

/**
 * 기존 매치 데이터를 데이터베이스에서 로드, 최적화 함수를 사용함에 따라 deprecated 처리
 * @param puuid 플레이어의 고유 식별자
 * @returns 캐시된 매치 데이터
 */
// const loadExistingMatchData = async (
// 	puuid: string,
// ): Promise<CachedMatchData> => {
// 	const { data: records, error } = await supabase
// 		.from("match_cache")
// 		.select(
// 			"puuid, match_id, match_info, match_info_timeline, game_creation, updated_at",
// 		)
// 		.eq("puuid", puuid)
// 		.order("game_creation", { ascending: false });
//
// 	if (error) {
// 		console.error("매치 데이터 로드 실패:", error);
// 		return {
// 			matchIds: new Set(),
// 			matchInfos: [],
// 			matchInfoTimeline: [],
// 			lastUpdated: null,
// 		};
// 	}
//
// 	const matchRecords = records || [];
//
// 	return {
// 		matchIds: createMatchIdSet(matchRecords),
// 		matchInfos: matchRecords.map(transformToMatchInfo),
// 		matchInfoTimeline: matchRecords.map(transformToMatchInfoTimeline),
// 		lastUpdated: getLastUpdated(matchRecords),
// 	};
// };
