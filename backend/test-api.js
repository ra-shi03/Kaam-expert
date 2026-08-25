import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const run = async () => {
  await mongoose.connect('mongodb+srv://rahulbairwa7610_db_user:E1CJKKdMkEQZHrjw@cluster0.4moncv5.mongodb.net/test?appName=Cluster0');
  const db = mongoose.connection.useDb('test');
  const admin = await db.collection('users').findOne({ role: 'admin' });
  const token = jwt.sign({ id: admin._id.toString() }, 'kaamexpert_secret_key_2024_secure', { expiresIn: '30d' });
  
  const res = await fetch('http://localhost:5000/api/v1/admin/dashboard/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
};
run();
