/**
 *
 * @param {String} id Spreadsheet ID
 * @param {String} [key=default] Sheet key
 * @return {Promise<Object>} spreadsheet represented as JSON data
 */
export async function getSpreadsheet(id, key) {
	let json = await getSpreadsheetJson(id, key);

	return parseSpreadsheetJson(json);
}

export function parseSpreadsheetJson(json) {
	return json.feed.entry.map(entry => {
		let newEntry = {};

		Object.keys(entry)
			.filter(key => key.startsWith("gsx$"))
			.forEach(key => newEntry[key.substring(4)] = entry[key]["$t"]);

		return newEntry;
	});
}

/**
 * @private
 *
 * @param {String} id Spreadsheet ID
 * @param {String} [key=default] Sheet key
 * @return {Promise<Object>} raw JSON query response as a JSON object
 */
export async function getSpreadsheetJson(id, key) {
	let apiUrl = getSpreadsheetUrl(id, key);
	let response = await fetch(apiUrl);

	return await response.json();
}


/**
 * @private
 *
 * @param {String} id Spreadsheet ID
 * @param {String} [key=default] Sheet key
 * @return {String} The URL to query
 */
export function getSpreadsheetUrl(id, key) {
	if (!id) {
		throw new Error("Id must be provided!");
	} else if (typeof id !== "string") {
		throw new Error("Id must be a string!");
	}

	if (!key) {
		key = "default";
	} else if (typeof key !== "string") {
		throw new Error("Key must be a string!");
	}

	return `https://spreadsheets.google.com/feeds/list/${id}/${key}/public/full?alt=json`;
}