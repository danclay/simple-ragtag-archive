const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const { convertInfoJson } = require('./convertJson');

async function processDirectory(mainDir, fixData = false) {
	try {
		const elasticSearchUrl = process.env.ES_BACKEND_URL;
		if (!elasticSearchUrl) {
			console.error('Elasticsearch URL is not set in environment variables');
			return;
		}

		const items = await fs.readdir(mainDir, { withFileTypes: true });
		for (const item of items) {
			if (item.isDirectory()) {
				const dirName = item.name;
				const infoFilePath = path.join(mainDir, dirName, `${dirName}.info.json`);
				const dbFilePath = path.join(mainDir, dirName, `${dirName}.db.json`);
				const liveChatFilePath = path.join(mainDir, dirName, `${dirName}.live_chat.json`);
				const chatFilePath = path.join(mainDir, dirName, `${dirName}.chat.json`);

				if (await fileExists(infoFilePath)) {
					const infoData = await readAndParseJson(infoFilePath);
					if (infoData._type == "video") {
						let dbData;
						if (!(await fileExists(dbFilePath)) || fixData) {
							let dbDataObj;
							if (fixData) {
								if (await fileExists(dbFilePath)) {
									const oldData = await readAndParseJson(dbFilePath);
									dbDataObj = await convertInfoJson(mainDir, dirName, infoData, oldData);
								}
							} else {
								dbDataObj = await convertInfoJson(mainDir, dirName, infoData, undefined);
							}
							dbData = JSON.stringify(dbDataObj, null, 2);
							await fs.writeFile(dbFilePath, dbData);
							console.log(`Wrote ${dbFilePath}`)
						} else {
							dbData = await fs.readFile(dbFilePath, 'utf8');
						}

						await sendToElasticSearch(elasticSearchUrl, dirName, dbData);
					} else if (infoData._type == "playlist") {
						const pfpFilePath = path.join(mainDir, dirName, `${dirName}.jpg`);
						const pfpNewFilePath = path.join(mainDir, dirName, "profile.jpg");
						if (await fileExists(pfpFilePath) && !(await fileExists(pfpNewFilePath))) {
							await fs.rename(pfpFilePath, pfpNewFilePath);
						}
					}
				}

				if (await fileExists(liveChatFilePath)) {
					await fs.rename(liveChatFilePath, chatFilePath);
					console.log(`Renamed ${liveChatFilePath} to ${chatFilePath}`);
				}
			}
		}
	} catch (error) {
		console.error(error);
	}
}

async function sendToElasticSearch(baseUrl, id, data) {
	const url = new URL(`/youtube-archive/_doc/${id}`, baseUrl);

	const options = {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(data)
		}
	};

	const req = http.request(url, options, (res) => {
		console.log(`statusCode: ${res.statusCode}`);
		res.on('data', (d) => {
			process.stdout.write(d);
		});
	});

	req.on('error', (error) => {
		console.error(error);
	});

	req.write(data);
	req.end();
}

async function fileExists(filePath) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function readAndParseJson(filePath) {
	const data = await fs.readFile(filePath, 'utf8');
	return JSON.parse(data);
}

module.exports = { processDirectory, readAndParseJson };