import { type ClassValue, clsx } from "clsx";
import ky, { type HTTPError } from "ky";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// 1) 환경변수 이름을 실제 역할에 맞게 교정
// riotApiUrl: Riot API의 기본 URL
// riotApiKey: Riot API 키
export const riotApiUrl = process.env.NEXT_PUBLIC_RIOT_API_URL;
export const riotApiKey = process.env.NEXT_PUBLIC_RIOT_API_KEY;

export const useRiotApiEngine = (cacheStrategy: RequestCache = "default") =>
	ky.create({
		prefixUrl: riotApiUrl,
		timeout: 10000,
		retry: 1,
		searchParams: {
			api_key: riotApiKey || "",
		},
		cache: cacheStrategy, // "default", "no-cache", "reload", "force-cache", "only-if-cached", "no-store" 중 하나
		hooks: {
			beforeError: [
				async (error: HTTPError<unknown>) => {
					const { response } = error;
					if (response?.body) {
						try {
							const errorData: Record<string, string> = await response.json();
							error.message =
								errorData.detail || errorData.message || error.message;
						} catch {
							error.message = await response.text();
						}
					}
					return error;
				},
			],
		},
	});
