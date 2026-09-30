import fs from 'fs';
const file = 'src/services/broadcastService.js';
let content = fs.readFileSync(file, 'utf8');

const debugCode = `
  require('fs').appendFileSync('broadcast-debug.log', "Start broadcast cycle for " + booking._id + ", count: " + eligibleLaborers.length + "\\n");
`;
content = content.replace(
  "console.log(`[BROADCAST] Flash broadcasting Booking ${booking._id} to ${eligibleLaborers.length} laborers`)",
  debugCode
);

const debugLoop = `
      require('fs').appendFileSync('broadcast-debug.log', "In loop for labor " + labor._id + "\\n");
`;
content = content.replace(
  "const laborServiceIds = labor.labourProfile?.serviceIds?.map(id => String(id)) || []",
  debugLoop + "\n      const laborServiceIds = labor.labourProfile?.serviceIds?.map(id => String(id)) || []"
);

const debugElse = `
        require('fs').appendFileSync('broadcast-debug.log', "In else block for single service\\n");
`;
content = content.replace(
  "// Single-service booking",
  debugElse
);

fs.writeFileSync(file, content);
