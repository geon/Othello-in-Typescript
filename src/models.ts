import * as tf from "@tensorflow/tfjs";

export type Model = {
	readonly uri: string;
	readonly path: string;
	readonly buildModel: () => tf.LayersModel;
};

export const models = {
	_1_hidden: {
		uri: "./1-hidden/model.json",
		path: "file://./models/1-hidden",
		buildModel: () =>
			tf.sequential({
				layers: [
					tf.layers.dense({ units: 64, activation: "tanh", inputShape: [64] }),
					tf.layers.dense({ units: 64, activation: "tanh" }),
					tf.layers.dense({ units: 1, activation: "tanh" }),
				],
			}),
	},
	_8_hidden: {
		uri: "./8-hidden/model.json",
		path: "file://./models/8-hidden",
		buildModel: () =>
			tf.sequential({
				layers: [
					tf.layers.dense({ units: 64, activation: "tanh", inputShape: [64] }),
					tf.layers.dense({ units: 64, activation: "tanh" }),
					tf.layers.dense({ units: 64, activation: "tanh" }),
					tf.layers.dense({ units: 64, activation: "tanh" }),
					tf.layers.dense({ units: 64, activation: "tanh" }),
					tf.layers.dense({ units: 64, activation: "tanh" }),
					tf.layers.dense({ units: 64, activation: "tanh" }),
					tf.layers.dense({ units: 64, activation: "tanh" }),
					tf.layers.dense({ units: 64, activation: "tanh" }),
					tf.layers.dense({ units: 1, activation: "tanh" }),
				],
			}),
	},
} as const satisfies Record<string, Model>;
