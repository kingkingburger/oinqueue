import SmallDataDisplay from "@/component/smallDataDisplay";
// components/CardSection.tsx
import React from "react";

type CardSectionProps = {
	title: string;
	data: number[];
};

const CardSection = ({ title, data }: CardSectionProps) => (
	<div className="bg-gray-300 p-4 rounded-lg flex flex-col">
		<h3 className="text-gray-700 text-md font-semibold mb-4">{title}</h3>
		<div className="grid grid-cols-5 gap-2 justify-items-center">
			{data.map((percentage, index) => (
				<SmallDataDisplay key={index} percentage={percentage} />
			))}
		</div>
	</div>
);

export default CardSection;
