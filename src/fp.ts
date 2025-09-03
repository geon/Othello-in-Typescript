export function randomArrayElement<T>(array: ReadonlyArray<T>): T {
	if (!array.length) {
		throw new Error("Can't pick an element from an empty array.");
	}
	return array[Math.floor(Math.random() * array.length)];
}
