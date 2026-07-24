import * as tf from "@tensorflow/tfjs";
import { Model } from "./models";

export async function getTfModel(model: Model): Promise<tf.LayersModel> {
	let tfModel: tf.LayersModel;

	tfModel = await tf.loadLayersModel(model.uri);

	return tfModel;
}
