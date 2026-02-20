const fs = require('fs');
const content = fs.readFileSync('D:/click here.svg', 'utf8');

const startIdx = content.indexOf('<path fill="#444444"');
if (startIdx === -1) {
  console.log('Path not found');
} else {
  let paths = content.substring(startIdx);
  paths = paths.replace('</svg>', '');

  // Wrap it in a clean svg component block
  // We observe the coordinates are ranging around X: 330-480, Y: 330-570
  // So viewBox="330 330 150 250"

  const svgCode = `<svg viewBox="330 330 150 250" width="150" height="250" fill="none" className="text-[#0a1128]">\n${paths}</svg>`;

  fs.writeFileSync('D:/extracted_svg.txt', svgCode);
  console.log('Successfully wrote to D:/extracted_svg.txt');
}
