import React, {Component} from "react";

import "./Updating.css";

/**
 * Approximate size per maxLoaded in kilobits
 * @type {number}
 */
const SIZE_PER_SHEET = 62.4;

const DOWNLOAD_TIME = 3000;
const ARBITRARY_LATENCY = 2750;
const RTT_MULTIPLIER = 1.3;

class Updating extends Component {

	constructor(props) {
		super(props);

		this.state = {
			"date": Date.now(),
			"downloadTime": DOWNLOAD_TIME
		};

	}

	componentDidMount() {
		if (navigator.connection) {
			let downloadTime = Updating.estimateDownloadTime(navigator.connection.downlink * 1000, navigator.connection.rtt);

			this.setState({
				"downloadTime": downloadTime
			});

			console.log(`[ESTIMATE] Live load time estimate: ${downloadTime}ms`);

			this.timerId = setInterval(() => this.tick(), 50);
		}
	}

	componentWillUnmount() {
		clearInterval(this.timerId);
	}

	tick() {
		this.setState({
			"date": Date.now()
		});
	}

	/**
	 *
	 * @param {Number} speed Network speed in kilobits per second
	 * @param {Number} ping RTT in ms
	 */
	static estimateDownloadTime(speed, rtt) {
		return Math.floor(SIZE_PER_SHEET / speed) * 1000 + rtt * RTT_MULTIPLIER + ARBITRARY_LATENCY;
	}

	getText() {
		let percentage = Math.floor((this.state.date - this.props.startedUpdating) * 100 / this.state.downloadTime);
		let displayPercentage = percentage;

		if (percentage > 100) {
			clearInterval(this.timerId);
			displayPercentage = 100;
		}

		return `UPDATING TEACHER LIST ${this.props.loaded}/${this.props.maxLoaded} (${displayPercentage}%)`
	}

	render() {
		return (
			<div className="Updating">
					<p>{this.getText()}</p>
			</div>
		);
	}

}

export default Updating;