export function randomArrayElement<T>(array: ReadonlyArray<T>): T {
	const element = array[Math.floor(Math.random() * array.length)];
	if (!element) {
		throw new Error("Can't pick an element from an empty array.");
	}
	return element;
}

export function indexOfMinBy<T>(
	array: ReadonlyArray<T>,
	accessor: (value: T) => number,
): number | undefined {
	let min = Number.POSITIVE_INFINITY;
	let minIndex = undefined;

	for (const [index, value] of array.map(accessor).entries()) {
		if (value < min) {
			min = value;
			minIndex = index;
		}
	}

	return minIndex;
}

export function minBy<T>(
	array: ReadonlyArray<T>,
	accessor: (value: T) => number,
): T | undefined {
	return array[indexOfMinBy(array, accessor) ?? 0];
}

export function sum(values: readonly number[]): number {
	return values.reduce((a, b) => a + b, 0);
}

export function avg(values: readonly number[]): number {
	if (values.length === 0) {
		throw new Error("Empty array.");
	}

	return sum(values) / values.length;
}

export function interpolate(a: number, b: number, t: number): number {
	return a + t * (b - a);
}
