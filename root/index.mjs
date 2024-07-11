export async function handler() {
	return {
		headers: {
			Location: 'https://github.com/ljharb/versionbadg.es',
		},
		statusCode: 302,
	};
}
