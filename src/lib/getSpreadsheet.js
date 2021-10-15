/**
 * @param {String} id Spreadsheet ID
 * @param {String} [key=default] Sheet key
 * @return {Promise<Object>} spreadsheet represented as JSON data
 */
export async function getSpreadsheet(id, key) {
	if (!id) {
		throw new Error("Id must be provided!");
	} else if (typeof id !== "string") {
		throw new Error("Id must be a string!");
	}

	let res = await fetch(`https://opensheet.vercel.app/${id}/${encodeURI(key)}`)
		.then(res => res.json())

	console.log(res)
	console.log(`https://opensheet.vercel.app/${id}/${encodeURI(key)}`)
	return res
}
