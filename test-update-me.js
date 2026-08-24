import axios from 'axios';

async function run() {
  try {
    // Generate a user via another API or assume one exists
    // Actually we can't easily authenticate because we need a token.
    console.log("Cannot run without token");
  } catch (err) {
    console.log(err);
  }
}
run();
