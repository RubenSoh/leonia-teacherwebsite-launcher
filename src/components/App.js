import React, {Component} from "react";
import MetaTags from "react-meta-tags";
import promisifySetState from 'promisify-setstate';

import "./App.css";

import Results from "./Results";
import Updating from "./Updating";

import LoadLiveSpreadsheetsWorker from "../lib/loadLiveSpreadsheets.worker";

import Config from "../config";
import {clarifyNames, loadSpreadsheets} from "../lib/loadSpreedsheets";

const SHOW_LOADING_MESSAGE_WAIT = 750;

class App extends Component {

	searchString = "";

	constructor(props) {
		super(props);

		this.state = {
			"results": [
				{
					"name": "Searching for teachers...",
					"websiteUrl": "#"
				}
			],
			"search": [],
			"loaded": 0,
			"showUpdating": false,
			"startedUpdating": Number.MAX_VALUE
		};
	}

	searchUpdateEvent = async (event) => {
		this.searchString = event.target.value;

		await this.searchUpdate(this.searchString);
	};

	searchUpdate = async (searchString) => {
		let searchResults = searchString === "" ? [] : this.state.results.filter(s =>
			s.name.search(new RegExp(searchString, "ig")) !== -1
		);

		if (searchString !== "" && !window.localStorage.getItem("spreadsheets")) {
			searchResults.unshift({
				"name": "Updating Search Index...",
				"websiteUrl": "#"
			});
		}

		this.setState({
			"search": searchResults
		});
	};

	submitCheck = (event) => {
		if (event.key === "Enter" && this.state.search.length !== 0) {
			this.resultsRef.setState({
				"modalOpen": true,
				"selected": this.state.search[0]
			});
		}
	};

	async componentDidMount() {
		this.loadLiveSpreadsheets(Config.spreadsheets);
		setTimeout(() => this.setState({ "showUpdating" : true }), SHOW_LOADING_MESSAGE_WAIT);
	}

	async loadLiveSpreadsheets(spreadsheets) {
		if (window.Worker) {
			console.info("Workers were detected - sites will be loaded in a separate thread.");
			this.setState({
				"startedUpdating": Date.now()
			});
			await this.loadSpreadsheetsWorker(spreadsheets);
		} else {
			console.info("Workers were not detected. Falling back to ordinary javascript.");
			this.setState({
				"startedUpdating": Date.now()
			});
			await this.loadSpreadsheetsFallback(spreadsheets);
		}
	}

	async loadSpreadsheetsWorker(spreadsheets) {
		console.info("[LIVE] Starting worker");

		const worker = new LoadLiveSpreadsheetsWorker();

		worker.postMessage([spreadsheets, {
			"spreadsheets": localStorage.getItem("spreadsheets")
		}, App.shouldUseCacheOnly()]);

		return new Promise((resolve, reject) => {
			worker.addEventListener("message", (msg) => {
				if (msg.data.status === "finish") {
					this.handleUpdate(msg.data.state.result, msg.data.state.loaded);

					console.log(`[LIVE] Real load speed: ${Date.now() - this.state.startedUpdating}ms`);

					resolve();
					worker.terminate();
				} else if (msg.data.status === "update") {
					this.handleUpdate(msg.data.state.result, msg.data.state.loaded);
				} else if (msg.data.status === "store") {
					localStorage.setItem(msg.data.key, msg.data.value);
				} else {
					reject(`Unrecognized status: ${msg.data.status}`);
				}
			});
		});
	}

	async loadSpreadsheetsFallback(spreadsheets) {
		const loader = loadSpreadsheets(spreadsheets, null, App.shouldUseCacheOnly());

		loader.on("update", (result, loaded) => {
			this.handleUpdate(result, loaded)
		});

		loader.on("finished", (result, loaded) => {
			this.handleUpdate(result, loaded);
		});
	}

	handleUpdate(result, loaded) {
		let latestSpreadsheet = result[0].spreadsheetId;
		let cache = result[0].cache;

		let results = this.state.results
			.concat(result)
			.filter(s => !(s.spreadsheetId === latestSpreadsheet && s.cache && !cache));

		this.setState({
			"results": clarifyNames(results),
			"loaded": loaded
		}).then(() => this.searchUpdate(this.searchString));
	}

	static shouldUseCacheOnly() {
		let cache = localStorage.getItem("spreadsheets");

		let dateDiff = cache ? Date.now() - cache.date : Number.MAX_VALUE;

		if (navigator.connection) {
			console.info(`[DIAGNOSTICS] ${navigator.connection.type} with ${navigator.connection.effectiveType} speeds (${navigator.connection.downlink}mbps ${navigator.connection.rtt}ms).`);
		} else {
			console.info(`[DIAGNOSTICS] Could not obtain information about current connection`);
		}

		// If more than 8 hours have passed, always update cache
		if (dateDiff > (8 * 60 * 60 * 1000)) {
			console.info(`[CACHE] More than 8 hours have passed, updating cache`);
			return false;
		}
		// If unable to determine connection and more than 30 minutes have passed, always update cache
		else if (!navigator.connection &&
				dateDiff > (30 * 60 * 1000)) {
			console.info(`[CACHE] Unable to determine connection and more than 30 minutes have passed, updating cache`);
			return false;
		}
		// If ethernet or wifi, always update cache
		else if (navigator.connection &&
				(navigator.connection.type === "ethernet" || navigator.connection.type === "wifi")) {
			console.info(`[CACHE] Using a ${navigator.connection.type} network, updating cache`);
			return false;
		}
		// If the connection is fast, always update cache
		else if (navigator.connection &&
				((navigator.connection.rtt < 250 && navigator.connection.downlink > 2) ||
				navigator.connection.effectiveType === "4g")) {
			console.info(`[CACHE] Using a fast connection, updating cache`);
			return false;
		} else {
			console.info(`[CACHE] Using cache only, cache will not be updated`);
			return true;
		}
	}

	render() {
		const margin = {
			"marginTop": (this.state.search.length > 0) ? "10vh" : "33vh"
		};

		return (
			<div className="app">
				<div className="content"
					 style={margin}
				>
					<input
						autoFocus
						type="text"
						className="search-box center"
						onChange={this.searchUpdateEvent}
						onKeyDown={this.submitCheck}
						placeholder="TYPE YOUR TEACHERS NAME"
					/>

					{this.state.showUpdating && this.state.loaded < Config.spreadsheets.length &&
						<Updating
							loaded={this.state.loaded}
							maxLoaded={Config.spreadsheets.length}
							startedUpdating={this.state.startedUpdating}
						/>
					}

					<p className="lists">
						FULL LISTS: <a href="https://goo.gl/LmygV5">ACS</a> <a href="https://goo.gl/Hdhvgs">LMS</a> <a href="https://goo.gl/BquK2h">LHS</a>
					</p>

					{this.state.search &&
						<Results
							results={this.state.search}
							ref={(ref) => {
								this.resultsRef = ref;
							}}
						/>
					}
				</div>

				{Config.footer &&
					<div className="footer">
						<p>{Config.footer}</p>
					</div>
				}

				<MetaTags>
					<title>{Config.title}</title>
					<meta name="description"
						  content="Search for the teacher websites of teachers in the Leonia Schools District, Anna C Scott (ACS), Leonia Middle School (LMS), and Leonia High School (LHS)"
					/>
					<meta property="og:title"
						  content={Config.title}
					/>
				</MetaTags>
			</div>
		);
	}
}

export default promisifySetState(App);
