// Populates Firestore with starter categories + products, pulled from
// DummyJSON (https://dummyjson.com), so the storefront has something real
// to browse without you typing in 50 products by hand.
//
// Run once after Firestore + an admin account are set up:
//   npm run seed
//
// Needs in your .env (in addition to the VITE_FIREBASE_* keys):
//   SEED_ADMIN_EMAIL=you@example.com
//   SEED_ADMIN_PASSWORD=your-password
// (an account that already has role: "admin" in Firestore — see README)

import "dotenv/config";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;
  if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
    console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env first.");
    process.exit(1);
  }

  console.log("Signing in as admin…");
  const { user } = await signInWithEmailAndPassword(auth, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD);

  console.log("Fetching sample products from DummyJSON…");
  const res = await fetch("https://dummyjson.com/products?limit=100");
  if (!res.ok) throw new Error("DummyJSON request failed");
  const { products } = await res.json();

  // Build the category list from whatever categories the sample data uses.
  const categoryNames = [...new Set(products.map((p) => p.category))];
  console.log(`Writing ${categoryNames.length} categories…`);
  for (const name of categoryNames) {
    const id = slugify(name);
    await setDoc(doc(db, "categories", id), {
      name: name.replace(/-/g, " "),
    });
  }

  console.log(`Writing ${products.length} products…`);
  let count = 0;
  for (const p of products) {
    const categoryId = slugify(p.category);
    const ref = doc(collection(db, "products"));
    await setDoc(ref, {
      name: p.title,
      description: p.description,
      price: p.price,
      stock: p.stock,
      categoryId,
      categoryName: p.category.replace(/-/g, " "),
      images: p.images?.length ? p.images : [p.thumbnail],
      rating: p.rating ?? 0,
      ratingCount: 0,
      sellerId: user.uid, // demo data — attributed to the seed admin
      sellerName: "Demo Seller",
      createdAt: serverTimestamp(),
    });
    count += 1;
    if (count % 20 === 0) console.log(`  …${count}/${products.length}`);
  }

  console.log("Done. Refresh the storefront to see the catalog.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
