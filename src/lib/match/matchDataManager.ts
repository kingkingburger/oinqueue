/**
 * match 데이터를 가져오는 핵심 로직
 */

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
		// 1. [1단계] 메타데이터만 가볍게 로드하여 캐시 유효성 검사
		const existingData = await loadExistingMatchMetadata(puuid);
		const fifteenMinutes = 15 * 60 * 1000;

		if (
			existingData.lastUpdated &&
			new Date().getTime() - existingData.lastUpdated.getTime() < fifteenMinutes
		) {
			console.log("15분 내 업데이트됨. DB에서 최종 데이터를 바로 로드합니다.");
			// [2단계] 캐시가 유효하면 DB에서 전체 데이터를 가져와 즉시 반환
			return await loadAllMatchDataFromDB(puuid, requestCount);
		}

		// 2. 최신 매치 ID 목록 가져오기 (API 호출)
		const allMatchIds = await getMatchList({ puuid, count: requestCount });
		await delay(1200);

		const newMatchIds = allMatchIds.filter(
			(id) => !existingData.matchIds.has(id),
		);

		if (newMatchIds.length === 0) {
			console.log("새로운 매치가 없습니다. DB에서 기존 데이터를 로드합니다.");
			return await loadAllMatchDataFromDB(puuid, requestCount);
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

		// 4. [수정] 새로운 매치 데이터들을 DB에 저장
		if (newMatchInfosArr.length > 0) {
			console.log(
				`[4] ${newMatchInfosArr.length}개의 새로운 매치를 DB에 저장합니다.`,
			);
			// 위에서 만든 저장 함수 호출
			await saveNewMatchesToDB(puuid, newMatchInfosArr, newTimelinesArr);
		}

		// 5. [수정] DB에서 최종 데이터를 로드하여 반환 (메모리 조합 로직 삭제!)
		console.log(
			"[5] 모든 작업을 마치고 DB에서 최종 데이터를 일관성 있게 로드합니다.",
		);
		return await loadAllMatchDataFromDB(puuid, requestCount);
	} catch (error) {
		console.error("getCachedMatchInfos 전역 에러:", error);
		throw error;
	}
};

/**
 * [최적화 1단계] DB에서 캐시된 매치의 메타데이터만 로드 (가벼운 쿼리)
 * - match_id와 game_creation 컬럼만 선택적으로 가져와 초기 확인 속도를 높임.
 *
 * @param puuid 플레이어의 고유 식별자
 * @returns 캐시된 매치 ID Set과 마지막 업데이트 시간
 */
const loadExistingMatchMetadata = async (
	puuid: string,
): Promise<{
	matchIds: Set<string>;
	lastUpdated: Date | null;
}> => {
	// 필요한 최소한의 컬럼만 select
	const { data: records, error } = await supabase
		.from("match_cache")
		.select("match_id, game_creation") // 사용자가 명시한 컬럼명 사용
		.eq("puuid", puuid);

	if (error) {
		console.error("매치 메타데이터 로드 실패:", error);
		return { matchIds: new Set(), lastUpdated: null };
	}

	if (!records || records.length === 0) {
		return { matchIds: new Set(), lastUpdated: null };
	}

	// 가장 최근 게임 생성 시간을 기준으로 lastUpdated 설정
	const lastGameCreation = records.reduce(
		(max, r) => Math.max(max, new Date(r.game_creation).getTime()),
		0,
	);

	return {
		matchIds: new Set(records.map((r) => r.match_id)),
		lastUpdated: new Date(lastGameCreation),
	};
};

/**
 * [최적화 2단계] DB에서 캐시된 모든 매치 정보를 로드 (무거운 쿼리)
 * - 최종적으로 사용자에게 반환할 때 사용.
 *
 * @param puuid 플레이어 고유 식별자
 * @param limit 가져올 개수
 * @returns DB에 저장된 매치 정보와 타임라인
 */
const loadAllMatchDataFromDB = async (
	puuid: string,
	limit: number,
): Promise<{
	matchInfos: MatchInfoResponse[];
	matchTimelines: TimelineDto[];
}> => {
	const { data, error } = await supabase
		.from("match_cache")
		.select("match_info, match_info_timeline") // 실제 데이터가 담긴 JSON 컬럼
		.eq("puuid", puuid)
		.order("game_creation", { ascending: false })
		.limit(limit);

	if (error) {
		console.error("DB에서 전체 매치 데이터 로드 실패:", error);
		return { matchInfos: [], matchTimelines: [] };
	}

	// DB의 match_info, match_info_timeline 컬럼이 실제 API 응답 타입과 일치한다고 가정
	return {
		matchInfos: data?.map((item) => item.match_info) || [],
		matchTimelines: data?.map((item) => item.match_info_timeline) || [],
	};
};

/**
 * 새로운 매치 데이터들을 DB에 한 번에 저장하는 함수
 * @param puuid
 * @param newMatchInfos
 * @param newTimelines
 */
const saveNewMatchesToDB = async (
	puuid: string,
	newMatchInfos: MatchInfoResponse[],
	newTimelines: TimelineDto[],
) => {
	// 타임라인 데이터를 matchId로 쉽게 찾을 수 있도록 Map으로 변환
	const timelineMap = new Map(newTimelines.map((t) => [t.metadata.matchId, t]));

	// DB에 insert할 row 배열 생성
	const newRows = newMatchInfos.map((info) => {
		const matchId = info.metadata.matchId;
		const timeline = timelineMap.get(matchId);

		// Supabase 테이블의 컬럼명에 맞게 객체를 구성합니다.
		return {
			puuid: puuid,
			match_id: matchId,
			match_info: info, // 'match_info' 컬럼에 JSON으로 저장
			match_info_timeline: timeline, // 'match_info_timeline' 컬럼에 JSON으로 저장
			game_creation: new Date(info.info.gameCreation), // 정렬을 위한 시간 정보
		};
	});

	if (newRows.length === 0) return;

	// Supabase에 한 번의 요청으로 모든 신규 데이터 insert
	const { error } = await supabase.from("match_cache").insert(newRows);

	if (error) {
		console.error("새로운 매치 정보 저장 실패:", error);
		// 필요하다면 에러를 throw하여 상위에서 처리
		throw error;
	}
};
