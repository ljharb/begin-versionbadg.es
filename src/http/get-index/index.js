'use strict';

const request = require('request');

async function getVersion(user, repo, defaultBranch = 'master') {
	const url = `https://raw.github.com/${user}/${repo}/${defaultBranch}/package.json`;
	const { version } = await new Promise((resolve, reject) => {
		request.get({ url: url, json: true }, function (err, response, body) {
			if (err || response.statusCode < 200 || response.statusCode > 300) {
				reject([response.statusCode, err || response.body]);
			} else {
				resolve(body);
			}
		});
	});
	return version;
}

async function svgBadge(user, repo) {
	const userValid = typeof user === 'string' && user.length > 0;
	const repoValid = typeof repo === 'string' && repo.length > 0;
	if (!userValid && !repoValid) {
		throw [404];
	}
	if (!userValid) {
		throw [400, 'user param not specified'];
	}
	if (!repoValid) {
		throw [400, 'repo param not specified'];
	}
	const svgFormat = /\.svg$/;
	if (!svgFormat.test(repo)) {
		throw [301, `/${user}/${repo}.svg`];
	}
	const repoSanitized = repo.replace(svgFormat, '');
	const version = await getVersion(user, repoSanitized).catch(() => getVersion(user, repoSanitized, 'main'));
	if (typeof version !== 'string' || version === '') {
		throw [422, `valid version not found in package.json: found ${version}`];
	};
	return {
		headers: {
			'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
			'content-type': 'image/svg+xml',
		},
		statusCode: 200,
		body: `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="10"><text y="9" font-size="12" fill="#2d2d2d" font-family="Arial">v${version}</text></svg>`,
	};
};

exports.handler = async function http(request) {
	const [, user, repo] = request.path.match(/^\/([^\/]+)\/([^\/]+)$/) || [];
	try {
		return await svgBadge(user, repo);
	} catch (e) {
		if (Array.isArray(e)) {
			const [statusCode, data] = e;
			if (statusCode === 301) {
				return {
					headers: {
						Location: data,
					},
					statusCode,
				};
			}
			return {
				statusCode,
				body: data,
			};
		}
	}
};
