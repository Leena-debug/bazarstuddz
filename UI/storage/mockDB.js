import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Keys ────────────────────────────────────────────────────
const KEYS = {
  CURRENT_USER: 'aryna_current_user',
  USERS:        'aryna_users',
  PRODUCTS:     'aryna_products',
  MESSAGES:     'aryna_messages',
  EXCHANGES:    'aryna_exchanges', // Added for Dashboard compatibility
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
export async function registerUser(data) {
  const users = await getCollection(KEYS.USERS);
  if (users.find(u => u.email === data.email)) {
    throw new Error('Email already registered');
  }

  const newUser = {
    id:        Date.now().toString(),
    fullName:  data.fullName,
    email:     data.email,
    phone:     data.phone,
    password:  data.password,
    role:      data.role || 'buyer',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await saveCollection(KEYS.USERS, users);

  const { password: _, ...safeUser } = newUser;
  await AsyncStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(safeUser));
  return safeUser;
}

export async function loginUser(email, password) {
  const users = await getCollection(KEYS.USERS);
  const user  = users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Invalid email or password');

  const { password: _, ...safeUser } = user;
  await AsyncStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(safeUser));
  return safeUser;
}

export async function getCurrentUser() {
  const raw = await AsyncStorage.getItem(KEYS.CURRENT_USER);
  return raw ? JSON.parse(raw) : null;
}

export async function logoutUser() {
  await AsyncStorage.removeItem(KEYS.CURRENT_USER);
}

// ─── ROLE ─────────────────────────────────────────────────────
/**
 * Switch the current user's role.
 * @param {'buyer' | 'seller'} newRole
 * @param {string} [userId] - Optional: Pass ID to ensure update if session is missing
 */
export async function updateUserRole(newRole, userId = null) {
  // Try to get current user if no ID is provided
  const current = userId ? { id: userId } : await getCurrentUser();
  if (!current) throw new Error('Not logged in and no user ID provided');

  // Update in users list
  const users = await getCollection(KEYS.USERS);
  const idx   = users.findIndex(u => u.id === current.id);
  
  // If user doesn't exist in local mockDB yet, we might need to add them
  // But assuming they registered, we update the existing record
  if (idx === -1) {
    // If you are using Firebase, your local mockDB might not have the user yet.
    // This handles the transition from Firebase to MockDB storage.
    throw new Error('User not found in local database');
  }

  users[idx].role = newRole;
  await saveCollection(KEYS.USERS, users);

  // Update session if it exists
  const session = await getCurrentUser();
  if (session && session.id === current.id) {
    const updatedUser = { ...session, role: newRole };
    await AsyncStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(updatedUser));
  }
  return { ...users[idx] };
}

// ─── PROFILE ──────────────────────────────────────────────────
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
export async function getSellerStats() {
  const current  = await getCurrentUser();
  if (!current) throw new Error('Not logged in');

  const products = await getCollection(KEYS.PRODUCTS);
  const messages = await getCollection(KEYS.MESSAGES);
  const exchanges = await getCollection(KEYS.EXCHANGES);

  // Combine original stats with new dashboard requirements
  return {
    productCount: products.filter(p => p.sellerId === current.id).length,
    messageCount: messages.filter(m => m.receiverId === current.id).length,
    // Dashboard fields
    listings: products.filter(p => p.sellerId === current.id).length,
    exchanges: exchanges.filter(e => e.sellerId === current.id).length,
    points: products.filter(p => p.sellerId === current.id).length * 10,
    favorites: 0,
    rate: '85%'
  };
}

// ─── SEED (dev only) ──────────────────────────────────────────
export async function seedDatabase() {
  const existing = await getCollection(KEYS.USERS);
  if (existing.length > 0) return;

  const testUsers = [
    { id: '1', fullName: 'Rym Test',     email: 'rym@univ-alg.dz',     phone: '0550000001', password: '123456', role: 'buyer',  createdAt: new Date().toISOString() },
    { id: '2', fullName: 'Seller Demo',  email: 'seller@univ-alg.dz',  phone: '0550000002', password: '123456', role: 'seller', createdAt: new Date().toISOString() },
    { id: '3', fullName: 'Prof Demo',    email: 'prof@univ-alg.dz',    phone: '0550000003', password: '123456', role: 'professor', createdAt: new Date().toISOString() },
  ];

  await saveCollection(KEYS.USERS, testUsers);
  await saveCollection(KEYS.PRODUCTS, [
    { id: 'p1', sellerId: '2', name: 'React Native Book', price: 1200 },
    { id: 'p2', sellerId: '2', name: 'Laptop Stand',      price: 800  },
  ]);
  await saveCollection(KEYS.MESSAGES, [
    { id: 'm1', receiverId: '2', senderId: '1', text: 'Is this available?' },
  ]);
}

const VALID_UNIVERSITY_EMAILS = [
  'rym@univ-alger.dz',
  'test@univ-alger.dz',
  'lyna@univ-alger.dz',
  'maria@univ-alger.dz',
  'liz@univ-alger.dz',
  'rayane@univ-alger.dz',
  'sara@univ-alger.dz',
];

export function isValidUniversityEmail(email) {
  return VALID_UNIVERSITY_EMAILS.includes(email.toLowerCase());
}