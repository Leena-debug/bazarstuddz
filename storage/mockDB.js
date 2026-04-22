// storage/mockDB.js
//
// ─────────────────────────────────────────────────────────────
//  TEMPORARY LOCAL DATABASE  (uses AsyncStorage)
//  When your partner's backend is ready, replace each function
//  body with a fetch() call to the real API endpoint.
//  The function names and return shapes stay the same — 
//  your screens won't need to change at all.
// ─────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Keys ────────────────────────────────────────────────────
const KEYS = {
  CURRENT_USER: 'aryna_current_user',
  USERS:        'aryna_users',
  PRODUCTS:     'aryna_products',
  MESSAGES:     'aryna_messages',
};

// ─── Helpers ─────────────────────────────────────────────────
async function getCollection(key) {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

async function saveCollection(key, data) {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

// ─── AUTH ─────────────────────────────────────────────────────
// Replace these with real API calls when backend is ready

/**
 * Register a new user.
 * @param {{ fullName, email, phone, password, role }} data
 * role: 'buyer' | 'seller' | 'student' | 'professor'
 */
export async function registerUser(data) {
  const users = await getCollection(KEYS.USERS);

  // Check email taken
  if (users.find(u => u.email === data.email)) {
    throw new Error('Email already registered');
  }

  const newUser = {
    id:        Date.now().toString(),
    fullName:  data.fullName,
    email:     data.email,
    phone:     data.phone,
    password:  data.password,       // ⚠️ plain text, temp only
    role:      data.role || 'buyer',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await saveCollection(KEYS.USERS, users);

  // Auto-login after register
  const { password: _, ...safeUser } = newUser;
  await AsyncStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(safeUser));
  return safeUser;
}

/**
 * Log in with email + password.
 */
export async function loginUser(email, password) {
  const users = await getCollection(KEYS.USERS);
  const user  = users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Invalid email or password');

  const { password: _, ...safeUser } = user;
  await AsyncStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(safeUser));
  return safeUser;
}

/**
 * Get the currently logged-in user, or null.
 */
export async function getCurrentUser() {
  const raw = await AsyncStorage.getItem(KEYS.CURRENT_USER);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Log out.
 */
export async function logoutUser() {
  await AsyncStorage.removeItem(KEYS.CURRENT_USER);
}

// ─── ROLE ─────────────────────────────────────────────────────
/**
 * Switch the current user's role.
 * @param {'buyer' | 'seller'} newRole
 *
 * → Replace with:  PUT /api/users/:id/role
 */
export async function updateUserRole(newRole) {
  const current = await getCurrentUser();
  if (!current) throw new Error('Not logged in');

  // Update in users list
  const users = await getCollection(KEYS.USERS);
  const idx   = users.findIndex(u => u.id === current.id);
  if (idx === -1) throw new Error('User not found');

  users[idx].role = newRole;
  await saveCollection(KEYS.USERS, users);

  // Update session
  const updatedUser = { ...current, role: newRole };
  await AsyncStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(updatedUser));
  return updatedUser;
}

// ─── PROFILE ──────────────────────────────────────────────────
/**
 * Update profile fields.
 * @param {{ fullName?, phone? }} fields
 *
 * → Replace with:  PATCH /api/users/:id
 */
export async function updateProfile(fields) {
  const current = await getCurrentUser();
  if (!current) throw new Error('Not logged in');

  const users = await getCollection(KEYS.USERS);
  const idx   = users.findIndex(u => u.id === current.id);
  if (idx === -1) throw new Error('User not found');

  Object.assign(users[idx], fields);
  await saveCollection(KEYS.USERS, users);

  const updatedUser = { ...current, ...fields };
  await AsyncStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(updatedUser));
  return updatedUser;
}

// ─── DASHBOARD STATS ──────────────────────────────────────────
/**
 * Get stats for the seller dashboard.
 * Returns: { productCount, messageCount }
 *
 * → Replace with:  GET /api/users/:id/stats
 */
export async function getSellerStats() {
  const current  = await getCurrentUser();
  if (!current) throw new Error('Not logged in');

  const products = await getCollection(KEYS.PRODUCTS);
  const messages = await getCollection(KEYS.MESSAGES);

  return {
    productCount: products.filter(p => p.sellerId === current.id).length,
    messageCount: messages.filter(m => m.receiverId === current.id).length,
  };
}

// ─── SEED (dev only) ──────────────────────────────────────────
/**
 * Pre-fill the DB with test accounts.
 * Call once in App.js during development:
 *   import { seedDatabase } from './storage/mockDB';
 *   seedDatabase();
 */
export async function seedDatabase() {
  const existing = await getCollection(KEYS.USERS);
  if (existing.length > 0) return; // already seeded

  const testUsers = [
    { id: '1', fullName: 'Rym Test',     email: 'rym@univ-alg.dz',     phone: '0550000001', password: '123456', role: 'buyer',  createdAt: new Date().toISOString() },
    { id: '2', fullName: 'Seller Demo',  email: 'seller@univ-alg.dz',  phone: '0550000002', password: '123456', role: 'seller', createdAt: new Date().toISOString() },
    { id: '3', fullName: 'Prof Demo',    email: 'prof@univ-alg.dz',    phone: '0550000003', password: '123456', role: 'professor', createdAt: new Date().toISOString() },
  ];

  await saveCollection(KEYS.USERS, testUsers);

  // Fake products for seller stats
  await saveCollection(KEYS.PRODUCTS, [
    { id: 'p1', sellerId: '2', name: 'React Native Book', price: 1200 },
    { id: 'p2', sellerId: '2', name: 'Laptop Stand',      price: 800  },
  ]);

  // Fake messages for seller stats
  await saveCollection(KEYS.MESSAGES, [
    { id: 'm1', receiverId: '2', senderId: '1', text: 'Is this available?' },
    { id: 'm2', receiverId: '2', senderId: '1', text: 'What is the price?' },
    { id: 'm3', receiverId: '2', senderId: '3', text: 'Can I negotiate?' },
  ]);

  console.log('✅ mockDB seeded with test data');
}

const VALID_UNIVERSITY_EMAILS = [
  'rym@univ-alger.dz',
  'test@univ-alger.dz',
  'lyna@univ-alger.dz',
  // add more for testing
];

export function isValidUniversityEmail(email) {
  return VALID_UNIVERSITY_EMAILS.includes(email.toLowerCase());
}