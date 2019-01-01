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

	let dragX: number;
	let dragY: number;

	render();
	canvas.addEventListener("mousedown", mousedown);
	document.addEventListener("mouseup", mouseup);

	function render() {
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, width, height);

		const lookAltitudeSin = Math.sin(lookAltitude);
		const lookAltitudeCos = Math.cos(lookAltitude);
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
				const pos = convert(azimuth, altitude);
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
				const pos = convert(azimuth, altitude);
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
			const pos = convert(star.azimuth, star.altitude);
			if (pos == null) continue;
			ctx.beginPath();
			ctx.ellipse(pos.x, pos.y, 3, 3, 0, 0, Math.PI * 2);
			ctx.fill();
		}

		function convert(azimuth: number, altitude: number): {x: number, y: number} | null {
			const a = azimuth - lookAzimuth;
			const b = Math.sin(altitude);
			const c = Math.cos(altitude);
			const d = Math.sin(a) * c;
			const e = Math.cos(a) * c;
			const f = b * lookAltitudeCos - e * lookAltitudeSin;
			const g = b * lookAltitudeSin + e * lookAltitudeCos;

			if (g <= 0) {
				return null;
			}

			const x = d / g;
			const y = f / g;

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
}
