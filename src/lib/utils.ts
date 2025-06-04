import ky, { type HTTPError } from "ky";

export const riotApiKey = process.env.RIOT_API_KEY;
export const riotApiUrl = process.env.RIOT_API_URL;

export const useRiotApiEngine = () =>
	ky.create({
		prefixUrl: riotApiUrl,
		timeout: 10000,
		retry: 1,
		hooks: {
			beforeError: [
				async (error: HTTPError<unknown>) => {
					const { response } = error;
					if (response?.body) {
						try {
							const errorData: Record<string, string> = await response.json();
							error.message =
								errorData.detail || errorData.message || error.message;
						} catch (e) {
							error.message = await response.text();
						}
					}
					return error;
				},
			],
		},
	});
