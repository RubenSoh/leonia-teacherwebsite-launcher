import {getSpreadsheet, getSpreadsheetJson, getSpreadsheetUrl, parseSpreadsheetJson } from "./getSpreadsheet";

import fs from "fs";

const testData1 = fs.readFileSync(`${__dirname}/getSpreadsheet01.testdata.json`, "utf-8");
const testData1Json = JSON.parse(testData1);

describe("Spreadsheet Retrieval", () => {

	beforeEach(() => {
		global.fetch = jest.fn(() => Promise.resolve({
			"json": () => Promise.resolve(testData1Json)
		}));
	});

	it("should correctly retrieve and parse test data", async () => {
		verifyData(await getSpreadsheet("test", "test"))
	});

	it("should correctly parse test data", async () => {
		verifyData(parseSpreadsheetJson(testData1Json));
	});

	it("should validate input", async () => {
		expect(() => getSpreadsheetUrl()).toThrow();
		expect(() => getSpreadsheetUrl("test")).not.toThrow();
	});

});

function verifyData(json) {
	json.forEach(row => {
		expect(row).toHaveProperty("firstname");
		expect(row).toHaveProperty("lastname");
		expect(row).toHaveProperty("phoneext");
		expect(row).toHaveProperty("email");
		expect(row).toHaveProperty("position");

		expect(row).not.toHaveProperty("href");
		expect(row).not.toHaveProperty("rel");
	});
}