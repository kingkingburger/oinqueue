import CardSection from "@/component/cardSection";
import LargePlaceholderCard from "@/component/largePlaceholderCard";

export default function MainContentGrid() {
	// Dummy data for demonstration
	const productComboData = [20, 25, 30, 20, 5];
	const ratioData = [15, 20, 25, 10, 30];
	const recommendedComboData = [10, 15, 20, 25, 30];
	// 두 번째 이미지에서 보이는 하단 두 섹션의 데이터
	const bottomCardSectionData = [22, 28, 35, 15, 0]; // "가장 해를 덜 입은 밴프"
	const bottomRecommendedComboData = [10, 15, 20, 25, 30]; // "추천 조합" (하단)

	return (
		<div className="grid grid-cols-12 gap-6 h-[calc(100vh-100px)]">
			{" "}
			{/* 100vh에서 헤더와 하단 바 높이만큼 뺌 */}
			{/* Top row - 5 large cards (col-span-8) and 1 large card on the right (col-span-4) */}
			<div className="col-span-12 grid grid-cols-12 gap-6">
				{/* 5 Large Cards */}
				<div className="col-span-8 grid grid-cols-5 gap-6">
					<LargePlaceholderCard className="h-48" />
					<LargePlaceholderCard className="h-48" />
					<LargePlaceholderCard className="h-48" />
					<LargePlaceholderCard className="h-48" />
					<LargePlaceholderCard className="h-48" />
				</div>
				{/* Right Large Placeholder Card */}
				<div className="col-span-4">
					<LargePlaceholderCard className="h-48" />{" "}
					{/* Fixed height for consistency */}
				</div>
			</div>
			{/* Middle/Bottom rows for the specific layout */}
			<div className="col-span-12 grid grid-cols-12 gap-6 flex-grow">
				{" "}
				{/* flex-grow to take remaining height */}
				{/* Left-middle CardSection - "상품별 추천 조합" */}
				<div className="col-span-3">
					{" "}
					{/* Adjusted to fit new column structure */}
					<CardSection
						title="상품별 추천 조합"
						data={productComboData}
						className="h-full"
					/>
				</div>
				{/* Middle Two CardSections - "비율", "추천 조합" */}
				<div className="col-span-6 grid grid-cols-2 gap-6">
					<CardSection title="비율" data={ratioData} className="h-full" />
					<CardSection
						title="추천 조합"
						data={recommendedComboData}
						className="h-full"
					/>
				</div>
				{/* Right Large Placeholder Card (Bottom Right) */}
				<div className="col-span-3">
					<LargePlaceholderCard className="h-full" />{" "}
					{/* This should be the large gray box on the right */}
				</div>
			</div>
			{/* Bottom two CardSections - New row for the layout from the second image */}
			<div className="col-span-12 grid grid-cols-12 gap-6">
				{/* Left Bottom CardSection - "가장 해를 덜 입은 밴프" */}
				<div className="col-span-6">
					<CardSection
						title="가장 해를 덜 입은 밴프"
						data={bottomCardSectionData}
						className="h-full"
					/>
				</div>
				{/* Right Bottom CardSection - "추천 조합" (하단) */}
				<div className="col-span-6">
					<CardSection
						title="추천 조합"
						data={bottomRecommendedComboData}
						className="h-full"
					/>
				</div>
			</div>
		</div>
	);
}
