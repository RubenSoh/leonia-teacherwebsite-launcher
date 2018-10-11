import { loadSpreadsheets } from "./loadSpreedsheets";

async function onmessage(event) {
	const [spreadsheets, cache, liveUpdate] = event.data;

	const loader = loadSpreadsheets(spreadsheets, {
		"getItem": (key) => cache[key],
		"setItem": (key, value) => {
			postMessage({
				"status": "store",
				"key": key,
				"value": value
			});
		}
	}, liveUpdate);

	console.log("Worker thread has been started");

	loader.on("update", (result, loaded) => {
		postMessage({
			"status": "update",
			"state": {
				"result": result,
				"loaded": loaded
			}
		});
	});

	loader.once("finished", (result, loaded) => {
		postMessage({
			"status": "finish",
			"state": {
				"result": result,
				"loaded": loaded
			}
		});
	});
}

self.addEventListener("message", onmessage);


