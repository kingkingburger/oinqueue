/**
 * 종합 점수를 계산하여 등급 반환
 */
export const calculateGrade = (
	kda: number,
	csPerMin: number,
	winRate: number,
	avgVisionScore: number,
): string => {
	let score = 0;

	// KDA 점수 (40%)
	if (kda >= 3.0) score += 40;
	else if (kda >= 2.0) score += 30;
	else if (kda >= 1.5) score += 20;
	else score += 10;

	// CS 점수 (25%)
	if (csPerMin >= 8.0) score += 25;
	else if (csPerMin >= 6.0) score += 20;
	else if (csPerMin >= 4.0) score += 15;
	else score += 10;

	// 승률 점수 (25%)
	if (winRate >= 70) score += 25;
	else if (winRate >= 60) score += 20;
	else if (winRate >= 50) score += 15;
	else score += 10;

	// 시야 점수 (10%)
	if (avgVisionScore >= 30) score += 10;
	else if (avgVisionScore >= 20) score += 8;
	else if (avgVisionScore >= 15) score += 6;
	else score += 4;

	if (score >= 85) return "S";
	if (score >= 75) return "A+";
	if (score >= 65) return "A";
	if (score >= 55) return "B+";
	if (score >= 45) return "B";
	if (score >= 35) return "C+";
	if (score >= 25) return "C";
	return "D";
};

/**
 * 팀 전체 딜량 기반 등급
 */
export const calculateTeamDamageGrade = (damage: number): string => {
	if (damage >= 35000) return "S";
	if (damage >= 25000) return "A+";
	if (damage >= 20000) return "A";
	if (damage >= 15000) return "B+";
	if (damage >= 12000) return "B";
	if (damage >= 10000) return "C+";
	if (damage >= 8000) return "C";
	return "D";
};

/**
 * 팀 탱킹(받은 피해) 기반 등급
 */
export const calculateTeamTankingGrade = (damageTaken: number): string => {
	if (damageTaken >= 40000) return "S";
	if (damageTaken >= 30000) return "A+";
	if (damageTaken >= 25000) return "A";
	if (damageTaken >= 20000) return "B+";
	if (damageTaken >= 18000) return "B";
	if (damageTaken >= 15000) return "C+";
	if (damageTaken >= 12000) return "C";
	return "D";
};

/**
 * 골드 효율성 기반 등급
 */
export const calculateGoldEfficiencyGrade = (efficiency: number): string => {
	if (efficiency >= 2.0) return "SSS";
	if (efficiency >= 1.8) return "A+";
	if (efficiency >= 1.6) return "A";
	if (efficiency >= 1.4) return "B+";
	if (efficiency >= 1.2) return "B";
	if (efficiency >= 1.0) return "C+";
	if (efficiency >= 0.8) return "C";
	return "D";
};

/**
 * 개인 딜량 기반 등급
 */
export const calculateDamageGrade = (damage: number): string => {
	if (damage >= 35000) return "A+";
	if (damage >= 25000) return "A";
	if (damage >= 20000) return "B+";
	if (damage >= 15000) return "B";
	if (damage >= 12000) return "C+";
	if (damage >= 10000) return "C";
	return "D";
};

/**
 * 개인 탱킹(받은 피해) 기반 등급
 */
export const calculateDamageTakenGrade = (damageTaken: number): string => {
	if (damageTaken >= 35000) return "SSS";
	if (damageTaken >= 25000) return "A+";
	if (damageTaken >= 20000) return "A";
	if (damageTaken >= 15000) return "B+";
	if (damageTaken >= 12000) return "B";
	if (damageTaken >= 10000) return "C+";
	return "C";
};
