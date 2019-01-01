import Quaternion from "quaternion";

const STAR_NUM = 1000;

interface Star {
	azimuth: number;
	altitude: number;
}

let stars: Star[] = [];
for (let i = 0; i < STAR_NUM; i++) {
	stars.push({
		azimuth: Math.random() * Math.PI * 2,
		altitude: Math.asin(Math.random() * 2 - 1)
	});
}

document.addEventListener("DOMContentLoaded", main);

function main() {
	const canvas = document.getElementById("canvas") as HTMLCanvasElement;
	const width = canvas.width;
	const height = canvas.height;
	const ctx = canvas.getContext("2d")!;

	let lookAzimuth = 0;
	let lookAltitude = 0;
	let fov = Math.PI / 4;

	let diurnal = 0;
	let autoDiurnal = true;
	let longitude = 0;
	let latitude = 0;

	let dragX: number;
	let dragY: number;

	canvas.addEventListener("mousedown", mousedown);
	document.addEventListener("mouseup", mouseup);
	document.getElementById("diurnal")!.addEventListener("input", changeDiurnal);
	document.getElementById("auto-diurnal")!.addEventListener("change", changeAutoDiurnal);
	document.getElementById("longitude")!.addEventListener("input", changeLongitude);
	document.getElementById("latitude")!.addEventListener("input", changeLatitude);

	function render() {
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, width, height);

		const view = horizontalToViewQuaternion(lookAzimuth, lookAltitude);
		const h = view.mul(equatorialToHorizontal(diurnal, longitude, latitude));
		const scale = Math.tan(fov / 2);

		ctx.strokeStyle = "#888";
		ctx.lineWidth = 1;
		ctx.lineJoin = "round";
		ctx.beginPath();
		for (let i = -5; i < 6; i++) {
			const altitude = i * Math.PI / 12;
			let connect = false;
			for (let j = 0; j <= 24; j++) {
				const azimuth = j * Math.PI / 12;
				const pos = convert(view, azimuth, altitude);
				if (pos == null) {
					connect = false;
					continue;
				}
				if (connect) {
					ctx.lineTo(pos.x, pos.y);
				} else {
					ctx.moveTo(pos.x, pos.y);
					connect = true;
				}
			}
		}
		ctx.stroke();
		ctx.beginPath();
		for (let i = 0; i < 24; i++) {
			const azimuth = i * Math.PI / 12;
			let connect = false;
			for (let j = -6; j <= 6; j++) {
				const altitude = j * Math.PI / 12;
				const pos = convert(view, azimuth, altitude);
				if (pos == null) {
					connect = false;
					continue;
				}
				if (connect) {
					ctx.lineTo(pos.x, pos.y);
				} else {
					ctx.moveTo(pos.x, pos.y);
					connect = true;
				}
			}
		}
		ctx.stroke();

		ctx.fillStyle = "#fff";
		for (const star of stars) {
			const pos = convert(h, star.azimuth, star.altitude);
			if (pos == null) continue;
			ctx.beginPath();
			ctx.ellipse(pos.x, pos.y, 3, 3, 0, 0, Math.PI * 2);
			ctx.fill();
		}

		function convert(q: Quaternion, azimuth: number, altitude: number): {x: number, y: number} | null {
			const orig = sphericalToOrthogonal(azimuth, altitude);
			const pos = q.rotateVector(orig);
			if (pos[1] <= 0.1) {
				return null;
			}

			const x = pos[0] / pos[1];
			const y = pos[2] / pos[1];
			return {
				x: (1 + x / scale) * canvas.width / 2,
				y: (1 - y / scale) * canvas.height / 2
			};
		}
	}

	function mousedown(e: MouseEvent) {
		dragX = e.pageX;
		dragY = e.pageY;
		document.addEventListener("mousemove", mousemove);
	}
	function mouseup() {
		document.removeEventListener("mousemove", mousemove);
	}
	function mousemove(e: MouseEvent) {
		lookAzimuth -= (e.pageX - dragX) * 0.002;
		lookAltitude += (e.pageY - dragY) * 0.002;
		if (lookAltitude > Math.PI / 2) {
			lookAltitude = Math.PI / 2;
		} else if (lookAltitude < -Math.PI / 2) {
			lookAltitude = -Math.PI / 2;
		}
		render();

		dragX = e.pageX;
		dragY = e.pageY;
	}

	function changeDiurnal(e: Event) {
		diurnal = parseInt((e.target as HTMLInputElement).value, 10) / 180 * Math.PI;
		if (!autoDiurnal)
			render();
	}
	function changeLongitude(e: Event) {
		longitude = parseInt((e.target as HTMLInputElement).value, 10) / 180 * Math.PI;
		if (!autoDiurnal)
			render();
	}
	function changeLatitude(e: Event) {
		latitude = (parseInt((e.target as HTMLInputElement).value, 10) - 90) / 180 * Math.PI;
		if (!autoDiurnal)
			render();
	}

	function changeAutoDiurnal(e: Event) {
		autoDiurnal = (e.target as HTMLInputElement).checked;
		if (autoDiurnal) {
			animate();
		}
	}

	function animate() {
		if (autoDiurnal) {
			diurnal += 0.01;
			if (diurnal >= Math.PI * 2) {
				diurnal -= Math.PI * 2;
			}
			(document.getElementById("diurnal") as HTMLInputElement).value = Math.floor(diurnal * 180 / Math.PI).toString();
		}
		render();

		if (autoDiurnal) {
			requestAnimationFrame(animate);
		}
	}

	animate();
}

function sphericalToOrthogonal(longitude: number, latitude: number) {
	return [
		Math.cos(latitude) * Math.sin(-longitude),
		Math.cos(latitude) * Math.cos(-longitude),
		Math.sin(latitude)
	];
}

function equatorialToHorizontal(rotation: number, longitude: number, latitude: number): Quaternion {
	return Quaternion.fromAxisAngle([1, 0, 0], latitude - Math.PI / 2)
		.mul(Quaternion.fromAxisAngle([0, 0, 1], -rotation - longitude));
}

function horizontalToViewQuaternion(lookAzimuth: number, lookAltitude: number): Quaternion {
	return Quaternion.fromAxisAngle([1, 0, 0], -lookAltitude)
		.mul(Quaternion.fromAxisAngle([0, 0, 1], lookAzimuth));
}
