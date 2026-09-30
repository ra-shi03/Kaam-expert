import fs from 'fs';
const file = 'src/services/broadcastService.js';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
        try {
          emitToUser(labor._id, 'BOOKING_RECEIVED', offerPayload)
        } catch (emErr) {
          require('fs').appendFileSync('broadcast-errors.log', "Emit Error: " + emErr.stack + "\\n");
        }
        try {
          await persistBroadcastLog(booking._id, labor._id, offerPayload)
        } catch (dbErr) {
          require('fs').appendFileSync('broadcast-errors.log', "DB Error: " + dbErr.stack + "\\n");
        }
`;

// we need to replace:
// emitToUser(labor._id, 'BOOKING_RECEIVED', offerPayload)
// await persistBroadcastLog(booking._id, labor._id, offerPayload)

content = content.replace(
  "emitToUser(labor._id, 'BOOKING_RECEIVED', offerPayload)\n        await persistBroadcastLog(booking._id, labor._id, offerPayload)",
  replacement
);

content = content.replace(
  "} catch (emitErr) {",
  "} catch (emitErr) {\n    require('fs').appendFileSync('broadcast-errors.log', \"Outer Loop Error: \" + emitErr.stack + \"\\n\");"
);

fs.writeFileSync(file, content);
