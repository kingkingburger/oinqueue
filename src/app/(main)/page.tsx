import React, { Suspense } from "react";

import Loading from "@/app/(main)/loading";
import HomeContent from "@/components/home";

export default async function Home() {
	return (
		<Suspense fallback={<Loading />}>
			<HomeContent />
		</Suspense>
	);
}
