import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';

// Only load dotenv locally, not inside Docker/production containers
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

export const connectDB = async (): Promise<void> => {
  try {
    const dnsServers = process.env.DNS_SERVERS;
    if (dnsServers) {
      const servers = dnsServers.split(',').map((s) => s.trim()).filter(Boolean);
      if (servers.length > 0) {
        console.log(`Setting custom DNS servers: ${servers.join(', ')}`);
        dns.setServers(servers);
      }
    }

    const uri = process.env.DB_URI;
    if (!uri) {
      throw new Error('DB_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('MongoDB connection successful!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};