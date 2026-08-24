import axios from 'axios';

async function run() {
  try {
    const res = await axios.patch('http://localhost:5005/api/v1/users/me', {
      labourProfile: { experienceYears: 5 }
    }, {
      headers: {
        'Content-Type': 'application/json',
        // How to authenticate? We don't have a token.
      }
    });
    console.log(res.data);
  } catch (err) {
    console.log(err.response?.data || err.message);
  }
}
run();
