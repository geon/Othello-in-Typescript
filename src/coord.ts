export interface Coord {
	readonly x: number;
	readonly y: number;
}

export function indexToCoord(index: number): Coord {
	return { x: index % 8, y: Math.floor(index / 8) };
}

export function coordToIndex(coord: Coord): number {
	return coord.x + coord.y * 8;
}

export function addCoord(a: Coord, b: Coord): Coord {
	return { x: a.x + b.x, y: a.y + b.y };
}

export function subCoord(a: Coord, b: Coord): Coord {
	return { x: a.x - b.x, y: a.y - b.y };
}

export function coordsAreEqual(a: Coord, b: Coord): boolean {
	return a.x === b.x && a.y === b.y;
}
