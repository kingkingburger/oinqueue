// response 타입 정의
export interface ChampionInfo {
	nameKr: string;
	nameUs: string;
	nameCn: string;
}

export interface TierListItem {
	count: number;
	pickRate: string;
	banRate: string;
	winRate: string;
	opScore: string;
	opTier: number;
	isHoney: boolean;
	isOp: boolean;
	ranking: number;
	rankingVariation: number;
	updatedAt: string; // 필요하다면 Date로 변환 가능해요
	championId: number;
	laneId: number;
	honeyScore: string;
	overallRanking: number;
	overallRankingVariation: number;
	championInfo: ChampionInfo;
}

export interface TierListResponse {
	data: TierListItem[];
}

// 파라미터 타입 정의
export interface TierListParams {
	region: number;
	version: number;
	tier: number;
	lane: number;
}
