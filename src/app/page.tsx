import { Player } from "@/(main)/(player)/page";
import { DottedSeparator } from "@/component/dotted-separator";
import LargePlaceholderCard from "@/component/largePlaceholderCard";
import { PlayHistory } from "@/component/playHistory";
import { getMatchInfo } from "@/lib/riotApi/getMatchInfo";
import { getMatchList } from "@/lib/riotApi/getMatchList";
import {
	getRiotSummonerInfo,
	getRiotSummonerInfoByPuuid,
} from "@/lib/riotApi/getRiotSummonerInfo";
import type React from "react";

export default async function Home() {
	const gameName = "초코산";
	const tagName = "KR1";

	// ────────────────────────────────────────────────────────────────────────────
	// 1) 소환사 기본 정보 가져오기
	const summonerInfo = await getRiotSummonerInfo(gameName, tagName);

	// 2) 매치 ID 리스트 가져오기 (최대 20개만 사용)
	const allMatchIds = await getMatchList({
		puuid: summonerInfo.puuid,
		count: 10,
	});
	const top20MatchIds = allMatchIds.slice(0, 20);

	// 3) 20개 매치 정보를 병렬로 요청
	const matchInfos20 = await Promise.all(
		top20MatchIds.map((id) => getMatchInfo(id)),
	);
	// ────────────────────────────────────────────────────────────────────────────

	// 4) 챔피언별 승리/총 플레이 횟수 집계
	type ChampionStats = {
		wins: number;
		total: number;
	};
	const championStats: Record<string, ChampionStats> = {};

	matchInfos20.forEach((matchInfo) => {
		matchInfo.info.participants.forEach((p) => {
			const champ = p.championName;
			if (!championStats[champ]) {
				championStats[champ] = { wins: 0, total: 0 };
			}
			championStats[champ].total += 1;
			if (p.win) {
				championStats[champ].wins += 1;
			}
		});
	});

	// 5) 최고 승률 챔피언 계산 (플레이 횟수 0으로 나누는 오류 방지 필요)
	let bestChampion = "";
	let bestWinRate = 0; // 0~1 사이
	Object.entries(championStats).forEach(([champ, stats]) => {
		// 최소 1번 이상 플레이한 챔피언만 계산
		if (stats.total > 0) {
			const winRate = stats.wins / stats.total;
			if (winRate > bestWinRate) {
				bestWinRate = winRate;
				bestChampion = champ;
			}
		}
	});
	// 숫자 퍼센트로 화면에 보여줄 때는 (bestWinRate * 100).toFixed(2) 사용

	// ────────────────────────────────────────────────────────────────────────────
	// 6) 기존처럼 “3개 매치 기록”도 계속 보여줘야 한다면,
	//    추가로 필요한 3개 matchInfo를 따로 가져와 participantsList 생성

	//    만약 3개만 계속 보여줄 거라면 아래처럼 다시 뽑아도 되지만,
	//    이미 matchInfos20[0..2]가 있으니 재활용할 수 있어요.
	const matchInfos3 = matchInfos20.slice(0, 3);

	const participantsList = matchInfos3.map((matchInfo) =>
		matchInfo.info.participants.map((p) => ({
			riotIdGameName: p.riotIdGameName,
			riotIdTagline: p.riotIdTagline,
			championName: p.championName,
			kills: p.kills,
			deaths: p.deaths,
			assists: p.assists,
			win: p.win, // 승패 여부 포함
		})),
	);
	// participantsList: ParticipantInfo[][], 길이 3 (각각 10명씩)
	// ────────────────────────────────────────────────────────────────────────────

	// ────────────────────────────────────────────────────────────────────────────
	// 7) 더미 데이터 (이하 기존 UI용)
	const productComboData = [20, 25, 30, 20, 5];
	const ratioData = [15, 20, 25, 10, 30];
	const recommendedComboData = [10, 15, 20, 25, 30];
	const bottomCardSectionData = [22, 28, 35, 15, 0];
	const bottomRecommendedComboData = [10, 15, 20, 25, 30];

	const SmallDataDisplay = ({ percentage }: { percentage: number }) => (
		<div className="bg-lime-500 h-16 w-16 md:h-20 md:w-20 flex items-center justify-center rounded-md text-white font-bold text-sm">
			{percentage}%
		</div>
	);
	const CardSection = ({ title, data }: { title: string; data: number[] }) => (
		<div className="bg-gray-300 p-4 rounded-lg flex flex-col">
			<h3 className="text-gray-700 text-md font-semibold mb-4">{title}</h3>
			<div className="grid grid-cols-5 gap-2 justify-items-center">
				{data.map((percentage, index) => (
					<SmallDataDisplay key={index} percentage={percentage} />
				))}
			</div>
		</div>
	);
	// ────────────────────────────────────────────────────────────────────────────

	return (
		<div className="min-h-screen bg-gray-100 p-6 font-sans">
			{/* Main Content Grid */}
			<div className="mt-4 grid grid-cols-12 gap-4">
				{/* Top row - 제목 */}
				<div className="mx-2 my-2">최근전적</div>

				{/* ─────────── 20게임 요약: 최고 승률 챔피언 ─────────── */}
				<div className="col-span-12 bg-white rounded-lg shadow-sm p-4 mb-4">
					<h1 className="text-2xl font-semibold text-gray-800 mb-2">
						최근 20게임 중 승률이 가장 높은 챔피언
					</h1>
					{bestChampion ? (
						<p className="text-lg text-gray-700">
							챔피언: <span className="font-bold">{bestChampion}</span> (
							<span className="font-bold">
								{(bestWinRate * 100).toFixed(2)}%
							</span>
							)
						</p>
					) : (
						<p className="text-lg text-gray-700">데이터가 없습니다.</p>
					)}
				</div>
				{/* ──────────────────────────────────────────────────────────────── */}

				{/* “매치 기록(3개)” 섹션 */}
				<div className="col-span-12 bg-gray-300 rounded-lg h-auto">
					<Player gameName={gameName} tagName={tagName} />

					<header className="px-4 mb-6 flex items-center gap-x-2">
						<h1 className="text-2xl font-semibold text-gray-800">매치 기록</h1>
						<DottedSeparator className="bg-black" direction="vertical" />
						<p className="text-sm text-gray-500">최근 3개 매치를 확인하세요.</p>
					</header>

					<div className="px-4">
						<div className="flex w-full items-stretch justify-between px-4 gap-x-4">
							{participantsList.map((participants, idx) => {
								const matchId = top20MatchIds[idx]; // 3개 매치 ID
								return (
									<div key={matchId} className="min-w-[300px]">
										{/* 매치 번호 헤더 */}
										<h2 className="text-xl font-semibold text-gray-700 mb-2">
											매치 {idx + 1}
										</h2>
										<PlayHistory participants={participants} />
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{/* Middle row - 기존 카드 섹션 */}
				<div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<div className="col-span-1 md:col-span-1 lg:col-span-1">
						<CardSection title="상품별 추천 조합" data={productComboData} />
					</div>
					<div className="col-span-1 md:col-span-1 lg:col-span-1">
						<CardSection title="비율" data={ratioData} />
					</div>
					<div className="col-span-1 md:col-span-2 lg:col-span-1">
						<LargePlaceholderCard className="h-full min-h-[160px] md:min-h-0" />
					</div>
				</div>

				{/* Bottom row - 기존 카드 섹션 */}
				<div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
					<div className="col-span-1 md:col-span-1">
						<CardSection
							title="가장 해를 덜 입은 밴프"
							data={bottomCardSectionData}
						/>
					</div>
					<div className="col-span-1 md:col-span-1">
						<CardSection title="추천 조합" data={bottomRecommendedComboData} />
					</div>
				</div>
			</div>
		</div>
	);
}
