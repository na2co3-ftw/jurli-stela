import Quaternion from "quaternion";
import Color from "color";

const STAR_NUM = 1000;
const LABELS = [
	{text: "tostiex", v: [0, 1, 0]},
	{text: "vined", v: [-1, 0, 0]},
	{text: "nulov", v: [0, -1, 0]},
	{text: "pi'en", v: [1, 0, 0]}
];

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
	ctx.font = "16px sans-serif";

	let lookAzimuth = 0;
	let lookAltitude = 0;
	let fov = Math.PI / 4;

	let annual = 0;
	let autoAnnual = true;
	let obliquity = 23 / 180 * Math.PI;

	let diurnal = 0;
	let autoDiurnal = true;
	let longitude = 0;
	let latitude = -35 / 180 * Math.PI;

	let animating = true;
	let dragX: number;
	let dragY: number;

	canvas.addEventListener("mousedown", mousedown);
	document.addEventListener("mouseup", mouseup);
	document.getElementById("diurnal")!.addEventListener("input", changeDiurnal);
	document.getElementById("auto-diurnal")!.addEventListener("change", changeAutoDiurnal);
	document.getElementById("annual")!.addEventListener("input", changeAnnual);
	document.getElementById("auto-annual")!.addEventListener("change", changeAutoAnnual);
	document.getElementById("obliquity")!.addEventListener("input", changeObliquity);
	document.getElementById("longitude")!.addEventListener("input", changeLongitude);
	document.getElementById("latitude")!.addEventListener("input", changeLatitude);

	function render() {
		const view = horizontalToViewQuaternion(lookAzimuth, lookAltitude);
		const h = equatorialToHorizontalQuaternion(diurnal, longitude, latitude);
		const scale = Math.tan(fov / 2);

		const sunHPos = h.mul(eclipticToEquatorial(obliquity)).rotateVector(sphericalToOrthogonal(annual, 0));

		if (sunHPos[2] >= 0.1) {
			ctx.fillStyle = "#bdf";
		} else if (sunHPos[2] <= -0.1 ) {
			ctx.fillStyle = "#000";
		} else {
			ctx.fillStyle = Color("#000").mix(Color("#bdf"), sunHPos[2] * 5 + 0.5).string();
		}
		ctx.fillRect(0, 0, width, height);

		ctx.lineJoin = "round";
		for (let i = -5; i < 6; i++) {
			const altitude = i * Math.PI / 12;
			let connect = false;
			ctx.beginPath();
			for (let j = 0; j <= 24; j++) {
				const azimuth = j * Math.PI / 12;
				const v = view.rotateVector(sphericalToOrthogonal(azimuth, altitude));
				const pos = viewToScreen(v, scale, width, height);
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
			if (i == 0) {
				ctx.strokeStyle = "#fff";
				ctx.lineWidth = 3;
			} else {
				ctx.strokeStyle = "#666";
				ctx.lineWidth = 1;
			}
			ctx.stroke();
		}
		ctx.strokeStyle = "#666";
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let i = 0; i < 24; i++) {
			const azimuth = i * Math.PI / 12;
			let connect = false;
			for (let j = -6; j <= 6; j++) {
				const altitude = j * Math.PI / 12;
				const v = view.rotateVector(sphericalToOrthogonal(azimuth, altitude));
				const pos = viewToScreen(v, scale, width, height);
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
		ctx.strokeStyle = "#000";
		ctx.lineWidth = 3;
		for(const {text, v} of LABELS) {
			const pos = viewToScreen(view.rotateVector(v), scale, width, height);
			if (pos == null) continue;
			ctx.strokeText(text, pos.x, pos.y);
			ctx.fillText(text, pos.x, pos.y);
		}

		ctx.fillStyle = "#fff";
		ctx.strokeStyle = "#fff";
		ctx.lineWidth = 1;
		for (const star of stars) {
			const horizontal = h.rotateVector(sphericalToOrthogonal(star.azimuth, star.altitude));
			const visible = horizontal[2] >= 0;
			const v = view.rotateVector(horizontal);
			const pos = viewToScreen(v, scale, width, height);
			if (pos == null) continue;
			ctx.beginPath();
			ctx.ellipse(pos.x, pos.y, 3, 3, 0, 0, Math.PI * 2);
			if (visible) {
				ctx.fill();
			} else {
				ctx.stroke();
			}
		}

		const sunVPos = view.rotateVector(sunHPos);
		const sunPos = viewToScreen(sunVPos, scale, width, height);
		if (sunPos != null) {
			ctx.fillStyle = "#fff";
			ctx.strokeStyle = "#fff";
			ctx.beginPath();
			ctx.ellipse(sunPos.x, sunPos.y, 5, 5, 0, 0, Math.PI * 2);
			ctx.fill();

			ctx.strokeStyle = "#000";
			ctx.lineWidth = 3;
			ctx.strokeText("dovied", sunPos.x, sunPos.y);
			ctx.fillText("dovied", sunPos.x, sunPos.y);
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
		if (!animating)
			render();
	}
	function changeAnnual(e: Event) {
		annual = parseInt((e.target as HTMLInputElement).value, 10) / 180 * Math.PI;
		if (!animating)
			render();
	}
	function changeObliquity(e: Event) {
		obliquity = parseInt((e.target as HTMLInputElement).value, 10) / 180 * Math.PI;
		if (!animating)
			render();
	}
	function changeLongitude(e: Event) {
		longitude = parseInt((e.target as HTMLInputElement).value, 10) / 180 * Math.PI;
		if (!animating)
			render();
	}
	function changeLatitude(e: Event) {
		latitude = (parseInt((e.target as HTMLInputElement).value, 10) - 90) / 180 * Math.PI;
		if (!animating)
			render();
	}

	function changeAutoDiurnal(e: Event) {
		autoDiurnal = (e.target as HTMLInputElement).checked;
		const prevAnimating = animating;
		animating = autoDiurnal || autoAnnual;
		if (!prevAnimating && animating) {
			animate();
		}
	}
	function changeAutoAnnual(e: Event) {
		autoAnnual = (e.target as HTMLInputElement).checked;
		const prevAnimating = animating;
		animating = autoDiurnal || autoAnnual;
		if (!prevAnimating && animating) {
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
		if (autoAnnual) {
			annual += 0.001;
			if (annual >= Math.PI * 2) {
				annual -= Math.PI * 2;
			}
			(document.getElementById("annual") as HTMLInputElement).value = Math.floor(annual * 180 / Math.PI).toString();
		}
		render();

		if (animating) {
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

function eclipticToEquatorial(obliquity: number): Quaternion {
	return Quaternion.fromAxisAngle([0, 1, 0], obliquity);
}

function equatorialToHorizontalQuaternion(rotation: number, longitude: number, latitude: number): Quaternion {
	return Quaternion.fromAxisAngle([1, 0, 0], latitude - Math.PI / 2)
		.mul(Quaternion.fromAxisAngle([0, 0, 1], -rotation - longitude));
}

function horizontalToViewQuaternion(lookAzimuth: number, lookAltitude: number): Quaternion {
	return Quaternion.fromAxisAngle([1, 0, 0], -lookAltitude)
		.mul(Quaternion.fromAxisAngle([0, 0, 1], lookAzimuth));
}

function viewToScreen(v: number[], scale: number, width: number, height: number): {x: number, y: number} | null {
	if (v[1] <= 0.1) {
		return null;
	}

	const x = v[0] / v[1];
	const y = v[2] / v[1];
	return {
		x: (1 + x / scale) * width / 2,
		y: (1 - y / scale) * height / 2
	};
}
