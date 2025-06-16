/* ─────────────────────────────────── 숙련도 계산 함수 ─────────────────────────────────── */
export const calculateProficiency = (wins: number, total: number): number => {
	if (total === 0) return 0;

	const winRate = wins / total;
	const gameExperience = Math.min(total / 50, 1); // 50게임을 기준으로 경험치 정규화 (0~1)
	const consistencyBonus = total >= 10 ? 1 : total / 10; // 10게임 이상일 때 일관성 보너스

	// 숙련도 = (승률 * 경험치 보너스 * 일관성 보너스) * 100
	return winRate * gameExperience * consistencyBonus * 100;
};
