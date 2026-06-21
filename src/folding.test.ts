import { expect, suite, test } from "vitest";
import { Board } from "./othello";
import { foldVertically } from "./folding";

const board: Board = [
	...[1, 1, 0, 0, 0, 0, 0, 0],
	...[0, 1, 0, 0, 0, 0, 0, 0],
	...[0, 0, -1, 1, 0, 0, 0, 0],
	...[0, 0, 1, 1, 0, 0, 1, 0],
	...[0, 1, 0, 0, 0, 0, 1, 0],
	...[0, 0, -1, 0, 0, 0, 1, 0],
	...[0, 0, -1, 0, 0, 0, -1, 0],
	...[0, 0, 0, 0, 0, 0, -1, 0],
] as const;

suite("foldVertically", () => {
	test("identity", () => {
		expect(foldVertically(foldVertically(board))).toStrictEqual(board);
	});
});
