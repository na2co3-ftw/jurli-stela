declare module "quaternion" {
	export default class Quaternion {
		constructor();
		constructor(w: number, x: number, y: number, z: number);
		constructor(q: Quaternion);
		constructor(obj: {w?: number, x?: number, y?: number, z?: number});
		constructor(complex: {re: number, im: number});
		constructor(v: number[]);
		constructor(str: string);
		constructor(w: number, xyz: number[]);

		add(q: Quaternion): Quaternion;
		sub(q: Quaternion): Quaternion;
		neg(): Quaternion;
		norm(): number;
		normSq(): number;
		normalize(): number;
		mul(q: Quaternion): Quaternion;
		scale(s: number): Quaternion;
		dot(q: Quaternion): number;
		inverse(): Quaternion;
		div(q: Quaternion): Quaternion;
		conjugate(): Quaternion;
		exp(): Quaternion;
		log(): Quaternion;
		pow(q: Quaternion): Quaternion;
		equals(q: Quaternion): boolean;
		isFinite(): boolean;
		isNaN(): boolean;
		toString(): string;
		real(): number;
		imag(): number[];
		toVector(): number[];
		toMatrix(d2?: boolean): number[];
		toMatrix4(d2?: boolean): number[];
		clone(): Quaternion;
		rotateVector(v: number[]): number[];

		static ZERO: Quaternion;
		static ONE: Quaternion;
		static I: Quaternion;
		static J: Quaternion;
		static K: Quaternion;
		static EPSILON: Quaternion;
		static fromAxisAngle(axis: number[], angle: number): Quaternion;
		static fromBetweenVectors(u: number[], v: number[]): Quaternion;
		static fromEuler(phi: number, theta: number, psi: number, order?: EulerOrder): Quaternion;
	}

	type EulerOrder = "ZXY" | "XYZ" | "YXZ" | "ZYX" | "YZX" | "XZY";
}
