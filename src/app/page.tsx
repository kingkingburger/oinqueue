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

	// 1) 소환사 기본 정보 가져오기
	const summonerInfo = await getRiotSummonerInfo(gameName, tagName);

	// 2) 매치 ID 리스트 가져오기
	const matchIds = await getMatchList(summonerInfo.puuid);

	// 3) 1, 2, 3번째 매치 정보를 병렬로 요청
	const matchInfos = await Promise.all([
		getMatchInfo(matchIds[0]),
		getMatchInfo(matchIds[1]),
		getMatchInfo(matchIds[2]),
	]);

	// 4) 각 매치별 participants 배열만 뽑아서 필요한 필드로 매핑
	//    이번에는 p.win 필드를 함께 전달
	const participantsList = matchInfos.map((matchInfo) =>
		matchInfo.info.participants.map((p) => ({
			summonerName: p.summonerName,
			championName: p.championName,
			kills: p.kills,
			deaths: p.deaths,
			assists: p.assists,
			win: p.win, // 승패 여부 포함
		})),
	);

	// 더미 데이터 (기존 UI 구성 그대로 유지)
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

	return (
		<div className="min-h-screen bg-gray-100 p-6 font-sans">
			{/* Main Content Grid */}
			<div className="mt-4 grid grid-cols-12 gap-4">
				{/* Top row - 제목 */}
				<div className="mx-2 my-2">최근전적</div>

				{/* “매치 기록” 섹션 */}
				<div className="col-span-12 bg-gray-300 rounded-lg h-auto">
					<Player gameName={gameName} tagName={tagName} />

					<header className="px-4 mb-6 flex items-center gap-x-2">
						<h1 className="text-2xl font-semibold text-gray-800">매치 기록</h1>
						<DottedSeparator className="bg-black" direction="vertical" />
						<p className="text-sm text-gray-500">최근 매치를 확인하세요.</p>
					</header>

					{/* ─────────── 수정된 부분: 세 개의 PlayHistory를 가로로 정렬 ─────────── */}
					<div className="px-4">
						<div className="flex w-full items-stretch justify-between px-4">
							{participantsList.map((participants, idx) => {
								// key로 matchIds[idx] 사용
								const matchId = matchIds[idx];
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
					{/* ──────────────────────────────────────────────────────────────── */}
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
