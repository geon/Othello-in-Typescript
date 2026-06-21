export function randomArrayElement<T>(array: ReadonlyArray<T>): T {
	const element = array[Math.floor(Math.random() * array.length)];
	if (!element) {
		throw new Error("Can't pick an element from an empty array.");
	}
	return element;
}
