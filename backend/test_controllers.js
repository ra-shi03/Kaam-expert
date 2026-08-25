import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getDashboardStats, getReportsData } from './src/controllers/adminReportsController.js';
dotenv.config();

async function testControllers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // mock res
    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        console.log('Status:', this.statusCode);
        console.log('Data:', JSON.stringify(data, null, 2));
      }
    };

    console.log('--- Testing getDashboardStats ---');
    await getDashboardStats({}, res);

    console.log('--- Testing getReportsData (users, 2020-01-01) ---');
    await getReportsData({ query: { type: 'users', startDate: '2020-01-01', endDate: new Date().toISOString().split('T')[0] } }, res);
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

testControllers();
