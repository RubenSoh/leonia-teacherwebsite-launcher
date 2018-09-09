import React, {Component} from "react";
import timeout from "./timeout.js";
import promisifySetState from 'promisify-setstate';

import "./App.css";

import Results from "./Results.js";
import Config from "./config";
import credentials from "./hackme";

const gsjson = require('google-spreadsheet-to-json');

const MAX_ATTEMPTS = 8;
const CACHE_TIME = 300000;

class App extends Component {

	constructor(props) {
		super(props);

		this.state = {
			"searching": false,
			"results": [
				{
					"name": "Searching for teachers...",
					"websiteUrl": "#"
				}
			],
			"search": [],
			"loaded": 0
		};
	}

	searchUpdate = async (event) => {
		let searchResults = event.target.value === "" ? [] : this.state.results.filter(s =>
			s.name.search(new RegExp(event.target.value, "ig")) !== -1
		);

		this.setState({
			"search": searchResults
		});
	};

	submitCheck = (event) => {
		if (event.key === "Enter") {
			this.resultsRef.setState({
				"modalOpen": true,
				"selected": this.state.search[0]
			});
		}
	};

	async componentDidMount() {
		document.title = Config.title;

		this.loadLiveSpreadsheets(Config.spreadsheets);
		this.loadCachedSpreadsheets(Config.spreadsheets);
	}

	async loadLiveSpreadsheets(spreadsheets) {
		let megaSpreadsheet = [];
		let cachedSheets = JSON.parse(localStorage.getItem("spreadsheets")) || {};
		let startTime = Date.now();

		if (Date.now() - cachedSheets["date"] < CACHE_TIME) {
			console.info(`Cache is less than ${CACHE_TIME/1000} seconds old (${(Date.now() - cachedSheets["date"])/1000}s). Cache will be used.`);
			this.setState({
				"loaded": Number.MAX_VALUE
			});
			return;
		}

		let loadFuncs = [];

		for (let spreadsheet of spreadsheets) {
			loadFuncs.push((async () => {
				// Load results from web
				let spJson;
				let attempt = 1;

				const attemptToGetJson = async () => {
					try {
						console.info(`Attempting to get JSON for ${spreadsheet.id} on attempt ${attempt} of ${MAX_ATTEMPTS}`);

						spJson = await gsjson({
							spreadsheetId: spreadsheet.id,
							credentials: credentials
						});

						console.info(`Successfully got JSON for ${spreadsheet.id} on attempt ${attempt} of ${MAX_ATTEMPTS}`);
					} catch (e) {
					}
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

				this.setState({
					"loaded": this.state.loaded + 1,
					"results": megaSpreadsheet
				}).then(() => {
					this.clarifyNames();
				});

				cachedSheets[spreadsheet.id] = spJson;
			})());
		}

		await Promise.all(loadFuncs);

		console.info(`${this.state.results.length} entries successfully loaded in ${Date.now() - startTime}ms`);

		cachedSheets["date"] = Date.now();
		localStorage.setItem("spreadsheets", JSON.stringify(cachedSheets));
	}

	async loadCachedSpreadsheets(spreadsheets) {
		let megaSpreadsheet = [];
		let cachedSheets = JSON.parse(localStorage.getItem("spreadsheets")) || {};

		let startTime = Date.now();

		for (let spreadsheet of spreadsheets) {
			if (cachedSheets[spreadsheet.id]) {
				for (let row of cachedSheets[spreadsheet.id]) {
					if (!(row[spreadsheet.first_name] && row[spreadsheet.last_name])) continue;
					megaSpreadsheet.push({
						"cache": true,
						"spreadsheetId": spreadsheet.id,
						"spreadsheetName": spreadsheet.name,
						"name": `${row[spreadsheet.first_name]} ${row[spreadsheet.last_name]}`,
						"websiteUrl": row[spreadsheet.website_url],
						"email": row[spreadsheets.email]
					});
				}
			}
		}

		await this.setState({
			"results": megaSpreadsheet
		});

		this.clarifyNames();
		console.info(`[CACHE] ${this.state.results.length} cached entries successfully loaded in ${Date.now() - startTime}ms`);
	}

	clarifyNames() {
		let results = this.state.results;

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

		results = results.map(elem => {
			if (dupes.includes(elem.name)) {
				elem.name = `${elem.name} [${elem.spreadsheetName}]`;
				console.log(`Duplicate: ${elem.name}`);
			}
			return elem;
		});

		this.setState({
			"results": results
		});
	}

	render() {
		const margin = {
			"marginTop": (this.state.search.length > 0) ? "10vh" : "33vh"
		};

		return (
			<div className="App">
				<input
					type="text"
					className="search-box center"
					onChange={this.searchUpdate}
					onKeyDown={this.submitCheck}
					placeholder="TYPE YOUR TEACHERS NAME"
					style={margin}
				/>

				{this.state.loaded < Config.spreadsheets.length &&
					<p>
						UPDATING WEBSITE LIST {this.state.loaded}/{Config.spreadsheets.length}
					</p>
				}

				{this.state.search &&
					<Results
						results={this.state.search}
						ref={(ref) => {
							this.resultsRef = ref;
						}}
					/>
				}
			</div>
		);
	}
}

export default promisifySetState(App);
