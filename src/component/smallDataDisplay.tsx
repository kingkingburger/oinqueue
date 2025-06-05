// components/SmallDataDisplay.tsx
import React from "react";

type SmallDataDisplayProps = {
	percentage: number;
};

const SmallDataDisplay = ({ percentage }: SmallDataDisplayProps) => (
	<div className="bg-lime-500 h-16 w-16 md:h-20 md:w-20 flex items-center justify-center rounded-md text-white font-bold text-sm">
		{percentage}%
	</div>
);

export default SmallDataDisplay;
