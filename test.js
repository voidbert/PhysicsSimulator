let superscript = "";
let string = "123456789";
for (let i = 0; i < string.length; ++i) {
	switch (string[i]) {
		case "-":
			superscript += "⁻";
			break;
		case "2":
			superscript += "²";
			break;
		case "3":
			superscript += "³";
			break;
		default:
			superscript += String.fromCodePoint(0x2074 + string.codePointAt(i) - 52);
			break;
	}
}

console.log(superscript);