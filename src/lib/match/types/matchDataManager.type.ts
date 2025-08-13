// 데이터베이스 타입 정의

import type { MatchInfoResponse } from "@/lib/riotApi/type/matchInfoResponse";
import type { TimelineDto } from "@/lib/riotApi/type/mathInfoTimeLineResponse";

export interface MatchRecord {
	id?: string;
	puuid: string;
	match_id: string;
	match_info: MatchInfoResponse;
	match_info_timeline: TimelineDto;
	game_creation: number;
	created_at?: string;
	updated_at: string;
}

export interface CachedMatchData {
	matchIds: Set<string>;
	matchInfos: MatchInfoResponse[];
	matchInfoTimeline: TimelineDto[];
	lastUpdated: string | null;
}
