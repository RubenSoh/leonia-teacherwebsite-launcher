const gsjson = require('google-spreadsheet-to-json');
import timeout from './timeout'
import credentials from "./hackme";

const MAX_ATTEMPTS = 8;

self.addEventListener("message", onmessage);

async function onmessage(event) {
	let [spreadsheets] = event.data;

	console.log("Worker thread has been started");

	let state = {
		"loaded": 0
	};

	let cachedSheets = {};
	let megaSpreadsheet = [];
	let loadFuncs = [];
	let startTime = Date.now();

	for (let spreadsheet of spreadsheets) {
		loadFuncs.push((async () => {
			// Load results from web
			let spJson;
			let attempt = 1;

			const attemptToGetJson = async () => {
				try {
					if (typeof attempt !== "number" || typeof spreadsheet === "string"/* strange issue with workers */) return;
					console.info(`Attempting to get JSON for ${spreadsheet.id || spreadsheet} on attempt ${attempt} of ${MAX_ATTEMPTS}`);

					spJson = await gsjson({
						spreadsheetId: spreadsheet.id,
						credentials: credentials
					});

					console.info(`Successfully got JSON for ${spreadsheet.id} on attempt ${attempt} of ${MAX_ATTEMPTS}`);
				} catch (e) {}
				if (!spJson) {
					console.error(`Failed to get JSON for ${spreadsheet.id}.`);
					attempt++;
					if (attempt > MAX_ATTEMPTS) return;
					await timeout(500);
					await attemptToGetJson();
				}
			};

			await attemptToGetJson();

			if (!spJson) return;

			for (let row of spJson) {
				if (!(row[spreadsheet.first_name] && row[spreadsheet.last_name])) continue;
				megaSpreadsheet.push({
					"cache": false,
					"spreadsheetId": spreadsheet.id,
					"spreadsheetName": spreadsheet.name,
					"name": `${row[spreadsheet.first_name]} ${row[spreadsheet.last_name]}`,
					"websiteUrl": row[spreadsheet.website_url],
					"email": row[spreadsheets.email]
				});
			}

			megaSpreadsheet = megaSpreadsheet.filter(s => !(s.spreadsheetId === spreadsheet.id && s.cache));

			state = {
				"results": clarifyNames(megaSpreadsheet),
				"loaded": state.loaded + 1
			};

			postMessage({
				"status": "update",
				"state": state
			});

			console.log(`Loaded ${spreadsheet.name}`);

			cachedSheets[spreadsheet.id] = spJson;
		})());
	}

	await Promise.all(loadFuncs);

	console.log(`${state.results.length} entries successfully loaded in ${Date.now() - startTime}ms`);
	cachedSheets["date"] = Date.now();

	postMessage({
		"status": "cache",
		"cacheName": "spreadsheets",
		"toCache": JSON.stringify(cachedSheets)
	});

	postMessage({
		"status": "finish",
		"state": state
	});
}

function clarifyNames(results) {
	let teachers = {};
	let dupes = [];

	results.forEach(elem => {
		if (!teachers[elem.name]) {
			teachers[elem.name] = 0;
		}

		teachers[elem.name]++;
	});

	for (let teacher in teachers) {
		if (teachers[teacher] > 1) {
			dupes.push(teacher);
		}
	}

	let newResults = results.map(elem => {
		if (dupes.includes(elem.name)) {
			elem.name = `${elem.name} [${elem.spreadsheetName}]`;
			console.log(`Duplicate: ${elem.name}`);
		}
		return elem;
	});

	return newResults;
}
