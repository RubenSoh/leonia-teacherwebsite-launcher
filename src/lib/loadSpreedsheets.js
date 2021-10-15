import EventEmitter from "events";

import { getSpreadsheet } from "./getSpreadsheet";

export function loadSpreadsheets(spreadsheets, storage, cacheOnly) {
	// eslint-disable-next-line
	let localStorage = typeof localStorage === "undefined" ? storage : localStorage;

	const emitter = new EventEmitter();

	let cachedSheets = JSON.parse(localStorage.getItem("spreadsheets")) || {};

	let loaded = 0;
	let liveLoadingStartTime = Date.now();

	spreadsheets.forEach(spreadsheet => setTimeout(() => {
		let cacheSpreadsheetLoadingStartTime = Date.now();
		let json = cachedSheets[spreadsheet.id];

		if (json) {
			if (cacheOnly) loaded++;

			console.info(`[CACHE] Loaded ${spreadsheet.name} in ${Date.now() - cacheSpreadsheetLoadingStartTime}ms`);

			if (cacheOnly && loaded < spreadsheets.length) {
				emitter.emit("update", parseCleanJsonToResults(spreadsheet, json, true), loaded);
			} else if (cacheOnly && loaded === spreadsheets.length) {
				emitter.emit("finished", parseCleanJsonToResults(spreadsheet, json, true), loaded);
			} else if (!cacheOnly) {
				emitter.emit("update", parseCleanJsonToResults(spreadsheet, json, true), loaded);
			} else {
				throw new Error("This should not be thrown, under any circumstance.");
			}
		}
	}, 1));

	if (!cacheOnly) {
		spreadsheets.forEach(async spreadsheet => {
			let liveSpreadsheetLoadingStartTime = Date.now();
			let json = await getSpreadsheet(spreadsheet.id, spreadsheet.sheet_name);
			cachedSheets[spreadsheet.id] = json;

			loaded++;
			if (loaded < spreadsheets.length) {
				console.info(`[LIVE] Loaded ${spreadsheet.name} in ${Date.now() - liveSpreadsheetLoadingStartTime}ms`);
				emitter.emit("update", parseCleanJsonToResults(spreadsheet, json), loaded);
			} else {
				cachedSheets["date"] = Date.now();
				localStorage.setItem("spreadsheets", JSON.stringify(cachedSheets));

				console.info(`[LIVE] Loaded ${spreadsheet.name} in ${Date.now() - liveSpreadsheetLoadingStartTime}ms`);
				console.info(`[LIVE] Loaded ${loaded} spreadsheets in ${Date.now() - liveLoadingStartTime}ms`);

				emitter.emit("finished", parseCleanJsonToResults(spreadsheet, json), loaded);
			}
		});
	}

	return emitter;
}

/**
 * @private
 *
 * @param spreadsheet
 * @param json
 * @param cache
 * @return {Array}
 */
export function parseCleanJsonToResults(spreadsheet, json, cache) {
	let results = [];

	cache = cache || false;

	for (let row of json) {
		if (!(row[spreadsheet.first_name] && row[spreadsheet.last_name])) continue;
		results.push({
			"cache": cache,
			"spreadsheetId": spreadsheet.id,
			"spreadsheetName": spreadsheet.name,
			"name": `${row[spreadsheet.first_name]} ${row[spreadsheet.last_name]}`,
			"websiteUrl": row[spreadsheet.website_url],
			"email": row[spreadsheet.email]
		});
	}

	return results;
}

/**
 * @private
 *
 * @param results
 * @return {*}
 */
export function clarifyNames(results) {
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
		}
		return elem;
	});

	return newResults;
}
