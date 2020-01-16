'use strict';

exports.handler = async function http(request) {
	return {
		statusCode: 200,
		body: request.path,
	};
};
