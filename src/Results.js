import React, {Component} from "react";
import Modal from "react-modal";

import "./Results.css";

const RESULTS_MAX = 25;

class Results extends Component {

	constructor(props) {
		super(props);

		this.state = {
			"modalOpen": false,
			"selected": {
				"websiteUrl": "N/A",
				"name": "N/A"
			}
		};

		this.ref = React.createRef();
	}

	render() {
		let results = this.props.results
			.map((s, i) =>
				<li key={String(i)}
					skey={String(i)}
					onClick={() =>
						this.setState({
							"modalOpen": true,
							"selected": s
						})
					}
				>
					{s.name}
				</li>
			).slice(0, RESULTS_MAX);

		let websiteLink;

		if (/[(http(s)?)://(www.)?a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g.test(this.state.selected.websiteUrl)) {
			websiteLink = (
				<a href={this.state.selected.websiteUrl}>{this.state.selected.websiteUrl}</a>
			);
		} else {
			websiteLink = this.state.selected.websiteUrl || "N/A";
		}

		return (
			<div className="resultsWrapper">
				<ul className="results">{results}</ul>
				<Modal
					isOpen={this.state.modalOpen}
					onAfterOpen={() => {}}
					onRequestClose={() => this.setState({
						"modalOpen": false
					})}
					className="resultModal"
					overlayClassName="resultOverlay"
				>
					<h2>
						{this.state.selected.name}
					</h2>

					<p>
						Website: {websiteLink}
					</p>

				</Modal>
			</div>
		);
	}
}

export default Results;