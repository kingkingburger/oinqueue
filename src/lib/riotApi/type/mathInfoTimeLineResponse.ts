export interface TimelineDto {
	metadata: MetadataTimeLineDto;
	info: InfoTimeLineDto;
}

export interface MetadataTimeLineDto {
	dataVersion: string;
	matchId: string;
	participants: string[]; // PUUID 목록
}

export interface InfoTimeLineDto {
	endOfGameResult: string; // 게임 종료 결과
	frameInterval: number; // 프레임 간격(ms)
	gameId: number; // 게임 ID
	participants: ParticipantTimeLineDto[];
	frames: FramesTimeLineDto[];
}

export interface ParticipantTimeLineDto {
	participantId: number; // 참가자 번호
	puuid: string; // 참가자 PUUID
}

export interface FramesTimeLineDto {
	events: EventsTimeLineDto[];
	participantFrames: ParticipantFramesDto;
	timestamp: number; // 해당 프레임의 시간(ms)
}

export interface EventsTimeLineDto {
	timestamp: number; // 이벤트 발생 시간(ms)
	realTimestamp: number; // 실제 절대 시간(ms)
	type: string; // 이벤트 타입 식별자
}

export interface ParticipantFramesDto {
	[participantId: string]: ParticipantFrameDto;
}

export interface ParticipantFrameDto {
	championStats: ChampionStatsDto;
	currentGold: number;
	damageStats: DamageStatsDto;
	goldPerSecond: number;
	jungleMinionsKilled: number;
	level: number;
	minionsKilled: number;
	participantId: number;
	position: PositionDto;
	timeEnemySpentControlled: number;
	totalGold: number;
	xp: number;
}

export interface ChampionStatsDto {
	abilityHaste: number;
	abilityPower: number;
	armor: number;
	armorPen: number;
	armorPenPercent: number;
	attackDamage: number;
	attackSpeed: number;
	bonusArmorPenPercent: number;
	bonusMagicPenPercent: number;
	ccReduction: number;
	cooldownReduction: number;
	health: number;
	healthMax: number;
	healthRegen: number;
	lifesteal: number;
	magicPen: number;
	magicPenPercent: number;
	magicResist: number;
	movementSpeed: number;
	omnivamp: number;
	physicalVamp: number;
	power: number;
	powerMax: number;
	powerRegen: number;
	spellVamp: number;
}

export interface DamageStatsDto {
	magicDamageDone: number;
	magicDamageDoneToChampions: number;
	magicDamageTaken: number;
	physicalDamageDone: number;
	physicalDamageDoneToChampions: number;
	physicalDamageTaken: number;
	totalDamageDone: number;
	totalDamageDoneToChampions: number;
	totalDamageTaken: number;
	trueDamageDone: number;
	trueDamageDoneToChampions: number;
	trueDamageTaken: number;
}

export interface PositionDto {
	x: number;
	y: number;
}
