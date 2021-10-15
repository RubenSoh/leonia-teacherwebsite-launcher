import {getSpreadsheet, getSpreadsheetUrl, parseSpreadsheetJson } from "./getSpreadsheet";

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

	it("should validate input", async () => {
		expect(() => getSpreadsheet()).toThrow();
		expect(() => getSpreadsheet("test")).not.toThrow();
	});

});

function verifyData(json) {
	json.forEach(row => {
		expect(row).toHaveProperty("First Name");
		expect(row).toHaveProperty("Last Name");
		expect(row).toHaveProperty("Position");
		expect(row).toHaveProperty("Teacher Websites");

		expect(row).not.toHaveProperty("href");
		expect(row).not.toHaveProperty("rel");
	});
}
