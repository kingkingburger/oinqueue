import { Player } from "@/(main)/(player)/page";
import { DottedSeparator } from "@/component/dotted-separator";
import LargePlaceholderCard from "@/component/largePlaceholderCard";
import { PlayHistory } from "@/component/playHistory";
import type React from "react";

export default function Home() {
	const gameName = "초코산";
	const tagName = "KR1";

	// 더미 데이터 (실제 애플리케이션에서는 API 호출 등으로 데이터를 가져옵니다)
	const productComboData = [20, 25, 30, 20, 5];
	const ratioData = [15, 20, 25, 10, 30];
	const recommendedComboData = [10, 15, 20, 25, 30];
	const bottomCardSectionData = [22, 28, 35, 15, 0]; // "가장 해를 덜 입은 밴프"
	const bottomRecommendedComboData = [10, 15, 20, 25, 30]; // "추천 조합" (하단)

	// SmallDataDisplay 컴포넌트 내부 코드
	const SmallDataDisplay = ({ percentage }: { percentage: number }) => (
		<div className="bg-lime-500 h-16 w-16 md:h-20 md:w-20 flex items-center justify-center rounded-md text-white font-bold text-sm">
			{percentage}%
		</div>
	);

	// CardSection 컴포넌트 내부 코드
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
				{/* Top row - 5 large cards */}
				<div className="mx-2 my-2">최근전적</div>

				<div className="col-span-12 bg-gray-300 rounded-lg h-128">
					<Player gameName={gameName} tagName={tagName} />

					<header className="px-4 mb-6">
						<h1 className="text-2xl font-semibold text-gray-800">매치 기록</h1>
						<DottedSeparator className="bg-black" direction="vertical" />
						<p className="text-sm text-gray-500">
							최근 매치 목록을 확인하세요.
						</p>
					</header>
					<DottedSeparator className="bg-black" direction="vertical" />
					<div className="flex w-full items-stretch justify-between px-4">
						<PlayHistory />
						{/*<DottedSeparator className="bg-black" direction="vertical" />*/}
						<PlayHistory />
						{/*<DottedSeparator className="bg-blue-300" direction="vertical" />*/}
						<PlayHistory />
					</div>
				</div>

				{/* Middle row - 3 sections: 상품별 추천 조합, 비율, 비어있는 큰 카드 */}
				<div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{/* 상품별 추천 조합 */}
					<div className="col-span-1 md:col-span-1 lg:col-span-1">
						<CardSection title="상품별 추천 조합" data={productComboData} />
					</div>

					{/* 비율 */}
					<div className="col-span-1 md:col-span-1 lg:col-span-1">
						<CardSection title="비율" data={ratioData} />
					</div>

					{/* 비어있는 큰 카드 */}
					<div className="col-span-1 md:col-span-2 lg:col-span-1">
						{/* md:col-span-2 to span across both if only 2 cols */}
						<LargePlaceholderCard className="h-full min-h-[160px] md:min-h-0" />{" "}
						{/* height to match card sections */}
					</div>
				</div>

				{/* Bottom row - 2 sections: 가장 해를 덜 입은 밴프, 추천 조합 */}
				<div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
					{/* 가장 해를 덜 입은 밴프 */}
					<div className="col-span-1 md:col-span-1">
						<CardSection
							title="가장 해를 덜 입은 밴프"
							data={bottomCardSectionData}
						/>
					</div>
					{/* 추천 조합 */}
					<div className="col-span-1 md:col-span-1">
						<CardSection title="추천 조합" data={bottomRecommendedComboData} />
					</div>
				</div>
			</div>
		</div>
	);
}
