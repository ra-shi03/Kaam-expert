const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  labourProfile: new mongoose.Schema({
    experienceYears: Number
  })
});

const User = mongoose.model('TestUser', schema);

async function run() {
  let u = new User({});
  u.labourProfile = u.labourProfile || {};
  u.labourProfile.experienceYears = 5;
  console.log("After setting:", u.labourProfile.experienceYears);
  console.log("To object:", u.toObject().labourProfile);
}
run();
