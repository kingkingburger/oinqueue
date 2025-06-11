import type { TierListParams, TierListResponse } from "@/lib/topTierData/types";
import ky from "ky";

export const lolpsUrl = process.env.NEXT_PUBLIC_LOL_PS_URL;

export const getTierListFromPs = async ({
	region,
	version,
	tier,
	lane,
}: TierListParams): Promise<TierListResponse> => {
	const url = lolpsUrl;
	if (!url) {
		throw Error("not exist lolpsUrl");
	}
	const result = await ky
		.get(url, { searchParams: { region, version, tier, lane } })
		.json<TierListResponse>();

	return result;
};
