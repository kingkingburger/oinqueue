import SmallDataDisplay from "@/component/smallDataDisplay";

interface CardSectionProps {
	title: string;
	data: number[]; // Array of percentages
}

export default function CardSection({ title, data }: CardSectionProps) {
	return (
		<div className="bg-darkCardBg p-4 rounded-lg flex flex-col">
			<h3 className="text-gray-300 text-md font-semibold mb-4">{title}</h3>{" "}
			{/* Text color adjusted */}
			<div className="grid grid-cols-5 gap-2 justify-items-center">
				{data.map((percentage, index) => (
					<SmallDataDisplay key={index} percentage={percentage} />
				))}
			</div>
		</div>
	);
}
