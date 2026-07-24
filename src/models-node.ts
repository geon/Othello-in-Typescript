import * as tf from "@tensorflow/tfjs-node";
import { Model } from "./models";

export async function getTfModel(model: Model): Promise<tf.LayersModel> {
	let tfModel: tf.LayersModel;
	try {
		tfModel = await tf.loadLayersModel(model.path);
	} catch (error) {
		tfModel = model.buildModel();

		tfModel.compile({
			optimizer: "adam",
			loss: "meanSquaredError",
			metrics: ["accuracy"],
		});

		await tfModel.save(model.path);
	}
	return tfModel;
}
