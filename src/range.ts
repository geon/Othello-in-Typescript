export function range<N extends number>(
	//
	length: N,
	from: number = 0,
): number[] {
	return Array(length)
		.fill(undefined)
		.map((_, index) => index + from);
}
