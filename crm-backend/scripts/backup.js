import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI');
  process.exit(1);
}

const models = [
  'User','Client','Lead','Quotation','Invoice','Payment','AMC','CallLog','Settings','Document','ServiceRequest','AuditLog'
];

async function run() {
  await mongoose.connect(MONGO_URI);
  const outDir = path.join(process.cwd(), 'backups', new Date().toISOString().replace(/[:.]/g,'-'));
  fs.mkdirSync(outDir, { recursive: true });
  for (const name of models) {
    try {
      const Model = mongoose.model(name);
      const data = await Model.find().lean();
      fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(data, null, 2));
      console.log(`Exported ${name}: ${data.length}`);
    } catch (e) {
      console.warn(`Skip ${name}: ${e.message}`);
    }
  }
  await mongoose.disconnect();
  console.log('Backup complete at', outDir);
}

run();
