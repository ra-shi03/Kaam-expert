import fs from 'fs';
const file = 'src/services/broadcastService.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const targetStartTimeStr = to24Hour(booking.timeSlot) || currentIstTimeStr",
  "const targetStartTimeStr = currentIstTimeStr"
);

fs.writeFileSync(file, content);
