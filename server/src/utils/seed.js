import "dotenv/config";
import bcrypt from "bcryptjs";
import { pathToFileURL } from "node:url";
import User from "../models/User.js";
import Property from "../models/Property.js";
import Transaction from "../models/Transaction.js";
import PurchaseRequest from "../models/PurchaseRequest.js";
import { getSettings } from "../models/Settings.js";
import { connectDB } from "../config/db.js";
import { nowParts } from "./format.js";

const SEED_PROPERTIES = [
  {
    name: "Clifton Sea Terrace",
    city: "Karachi, Sindh",
    type: "Residential",
    description:
      "A beachfront residential tower in Clifton offering long-term rental demand from expats and professionals. Fully managed by an on-ground property manager, with rent distributed to shareholders monthly.",
    totalValue: 42000000,
    pricePerShare: 21000,
    totalShares: 2000,
    soldShares: 1240,
    yieldPct: 7.8,
    initials: "CT",
    hue: 42,
  },
  {
    name: "Gulberg Commercial Plaza",
    city: "Lahore, Punjab",
    type: "Commercial",
    description:
      "A mixed-use commercial plaza in Gulberg with retail units on the ground floor and leased office space above. Anchor tenants are on 3-year leases, giving predictable income.",
    totalValue: 68000000,
    pricePerShare: 34000,
    totalShares: 2000,
    soldShares: 512,
    yieldPct: 9.4,
    initials: "GP",
    hue: 190,
  },
  {
    name: "Bahria Orchard Villas",
    city: "Rawalpindi, Punjab",
    type: "Residential",
    description:
      "A cluster of 6 villas inside Bahria Orchard, rented as furnished short-to-mid-term stays. Occupancy has stayed above 80% for the last two years.",
    totalValue: 29500000,
    pricePerShare: 14750,
    totalShares: 2000,
    soldShares: 1870,
    yieldPct: 6.9,
    initials: "BV",
    hue: 260,
  },
  {
    name: "Hyderabad Logistics Hub",
    city: "Hyderabad, Sindh",
    type: "Industrial",
    description:
      "A warehousing and logistics facility leased to a single industrial tenant on a 5-year contract, with fixed annual rent escalation built into the lease.",
    totalValue: 51000000,
    pricePerShare: 25500,
    totalShares: 2000,
    soldShares: 300,
    yieldPct: 10.2,
    initials: "LH",
    hue: 15,
  },
];

export async function seed() {
  // Settings singleton
  await getSettings();

  // Super admin
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || "muhaddisirshad58@gmail.com";
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "fluxx@@";
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: "Muhaddis Irshad",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "superadmin",
      status: "active",
      acceptedTerms: true,
      acceptedTermsAt: new Date(),
    });
    console.log(`[seed] super admin created: ${adminEmail}`);
  } else if (admin.role !== "superadmin") {
    admin.role = "superadmin";
    admin.status = "active";
    await admin.save();
    console.log(`[seed] ${adminEmail} promoted to super admin`);
  }

  // Properties
  const propertyCount = await Property.countDocuments();
  if (propertyCount === 0) {
    await Property.insertMany(
      SEED_PROPERTIES.map((p, i) => ({
        ...p,
        status: "active",
        featured: i < 2,
        investingOpen: true,
      }))
    );
    console.log(`[seed] inserted ${SEED_PROPERTIES.length} seed properties`);
  }

  // Demo investors so the admin dashboard isn't empty on first run.
  const demo = [
    { name: "Alex Vance", email: "alex.vance@example.com", status: "active" },
    { name: "Sara Ahmed", email: "sara.ahmed@example.com", status: "active" },
    { name: "Omar Farooq", email: "omar.farooq@example.com", status: "pending" },
    { name: "Zainab Qureshi", email: "zainab.qureshi@example.com", status: "rejected" },
  ];

  for (const d of demo) {
    const exists = await User.findOne({ email: d.email });
    if (exists) continue;
    const user = await User.create({
      name: d.name,
      email: d.email,
      passwordHash: await bcrypt.hash("demo1234", 10),
      role: "user",
      status: d.status,
      acceptedTerms: true,
      acceptedTermsAt: new Date(),
    });
    console.log(`[seed] demo investor: ${d.email} (${d.status})`);

    if (d.status === "active") {
      const props = await Property.find().limit(2);
      const settings = await getSettings();
      for (let i = 0; i < props.length; i++) {
        const property = props[i];
        const shares = [20, 15][i];
        const totalCost = shares * property.pricePerShare;
        const teamFeeAmount = (totalCost * settings.teamFee) / 100;
        const { date, time } = nowParts();
        const request = await PurchaseRequest.create({
          userId: user._id,
          propertyId: property._id,
          propertyName: property.name,
          shares,
          pricePerShare: property.pricePerShare,
          totalCost,
          teamFeePct: settings.teamFee,
          teamFeeAmount,
          status: "approved",
          processedAt: new Date(),
          processedBy: admin._id,
          date,
          time,
        });
        property.soldShares += shares;
        await property.save();
        await Transaction.create({
          userId: user._id,
          propertyId: property._id,
          propertyName: property.name,
          shares,
          pricePerShare: property.pricePerShare,
          total: totalCost,
          teamFee: teamFeeAmount,
          teamFeePct: settings.teamFee,
          date,
          time,
          requestId: request._id,
        });
        settings.teamEarnings += teamFeeAmount;
        await settings.save();
      }
    }
  }

  // One pending request from a demo investor so approvals can be exercised.
  const pendingUser = await User.findOne({ email: "omar.farooq@example.com" });
  if (pendingUser) {
    const hasPending = await PurchaseRequest.exists({
      userId: pendingUser._id,
      status: "pending",
    });
    if (!hasPending) {
      const property = await Property.findOne({ name: "Hyderabad Logistics Hub" });
      if (property) {
        const settings = await getSettings();
        const shares = 30;
        const totalCost = shares * property.pricePerShare;
        const teamFeeAmount = (totalCost * settings.teamFee) / 100;
        const { date, time } = nowParts();
        await PurchaseRequest.create({
          userId: pendingUser._id,
          propertyId: property._id,
          propertyName: property.name,
          shares,
          pricePerShare: property.pricePerShare,
          totalCost,
          teamFeePct: settings.teamFee,
          teamFeeAmount,
          status: "pending",
          date,
          time,
        });
      }
    }
  }

  return { admin };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/flux_fractional";
  connectDB(uri)
    .then(async () => {
      await seed();
      await mongooseDisconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

async function mongooseDisconnect() {
  const mongoose = (await import("mongoose")).default;
  await mongoose.disconnect();
}
