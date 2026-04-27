import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  StatusBar,
  Dimensions,
  Modal,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/services/api';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

// ========== IMAGES ==========
// Books
const siBookImage = require('../assets/images/books/si-book.png');
const kitQcmImage = require('../assets/images/books/qit_qcm.png');
const algorithmImage = require('../assets/images/books/algorithm_design.png');
const softwareImage = require('../assets/images/books/software_engineer.png');

// Electronics
const acerLaptopImage = require('../assets/images/electronics/acer_laptop.png');
const asusLaptopImage = require('../assets/images/electronics/asus_laptop.png');
const lenovoLaptopImage = require('../assets/images/electronics/lenevo_laptop.png');
const laptopBackpackImage = require('../assets/images/electronics/laptop_backpack.png');
const laptopSleeveImage = require('../assets/images/electronics/laptop_sleeve.png');
const messengerBagImage = require('../assets/images/electronics/messenger_bag.png');
const calculatorImage = require('../assets/images/electronics/scientific_calculator.png');
const usbDriveImage = require('../assets/images/electronics/usb_drive.png');
const externalHddImage = require('../assets/images/electronics/external_hdd.png');
const headphonesImage = require('../assets/images/electronics/headphones.png');

// Handout
const algorithmicsHandoutImage = require('../assets/images/handout/algorithmics_handout.png');
const calculusFormulaImage = require('../assets/images/handout/calculus_formula.png');
const physicsNotesImage = require('../assets/images/handout/physics_notes.png');
const programmingCheatsheetImage = require('../assets/images/handout/programming_cheatsheet.png');
const databaseHandoutImage = require('../assets/images/handout/database_handout.png');
const osHandoutImage = require('../assets/images/handout/operatingsystem_handout.png');
const dataStructuresHandoutImage = require('../assets/images/handout/databases_handout.png');

// Default fallback
const defaultImage = siBookImage;

// ========== GET IMAGE BY TITLE ==========
const getLocalImage = (title) => {
  // Books
  if (title === 'SI Book') return siBookImage;
  if (title === 'KIT QCM') return kitQcmImage;
  if (title === 'Algorithm Design') return algorithmImage;
  if (title === 'Software Eng') return softwareImage;
  if (title === 'Calculus Textbook') return defaultImage;
  if (title === 'Physics Textbook') return defaultImage;
  if (title === 'Linear Algebra Textbook') return defaultImage;
  if (title === 'Discrete Mathematics') return defaultImage;
  if (title === 'Database Systems') return defaultImage;
  if (title === 'Operating Systems') return defaultImage;

  // Electronics
  if (title === 'Dell Laptop') return acerLaptopImage;
  if (title === 'HP Student Laptop') return asusLaptopImage;
  if (title === 'Lenovo ThinkPad') return lenovoLaptopImage;
  if (title === 'Acer Laptop') return acerLaptopImage;
  if (title === 'Asus Vivobook') return asusLaptopImage;
  if (title === 'Laptop Backpack') return laptopBackpackImage;
  if (title === 'Computer Sleeve Bag') return laptopSleeveImage;
  if (title === 'Laptop Messenger Bag') return messengerBagImage;
  if (title === 'Scientific Calculator') return calculatorImage;
  if (title === 'USB Flash Drive') return usbDriveImage;
  if (title === 'External Hard Drive') return externalHddImage;
  if (title === 'Noise Cancelling Headphones') return headphonesImage;

  // Handout
  if (title === 'Algorithmics Course Handout') return algorithmicsHandoutImage;
  if (title === 'Data Structures Handout') return dataStructuresHandoutImage;
  if (title === 'Calculus Formula Sheet') return calculusFormulaImage;
  if (title === 'Physics Exam Prep Notes') return physicsNotesImage;
  if (title === 'Programming Cheat Sheet') return programmingCheatsheetImage;
  if (title === 'Database Handout') return databaseHandoutImage;
  if (title === 'Operating Systems Handout') return osHandoutImage;

  return defaultImage;
};

export default function HomeScreen() {
  const router = useRouter();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(true);

  const categories = [
    { id: 'All', name: 'All' },
    { id: 'Books', name: 'Books' },
    { id: 'Electronics', name: 'Electronics' },
    { id: 'Handout', name: 'Handout' },
  ];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🟢 Fetching products...');
      const response = await api.get('/products');
      if (response.data.success) {
        setProducts(response.data.products);
        setFilteredProducts(response.data.products);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products
  useEffect(() => {
    let filtered = [...products];
    
    // Only filter if a specific category is selected (not 'All')
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  const renderStars = () => (
    <View style={styles.ratingContainer}>
      {[...Array(5)].map((_, i) => (
        <Text key={i} style={styles.star}>★</Text>
      ))}
    </View>
  );

  // ========== RENDER PRODUCT WITH PLUS BUTTON NAVIGATION ==========
  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <Image source={getLocalImage(item.title)} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle}>{item.title}</Text>
        {renderStars()}
        <Text style={styles.productPrice}>{parseInt(item.price)} DA</Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <Text style={styles.addIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowFilterModal(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5A2B" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B5A2B" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Welcome to Bazar Stud DZ</Text>
          <Text style={styles.tagline}>Sell, Buy and Share Smarter</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => {
            setHasNewNotification(false);
            router.push('/notifications');
          }}
        >
          <Text style={styles.bellIcon}>🔔</Text>
          {hasNewNotification && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>

      {/* Search + Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryButton,
              selectedCategory === cat.id && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.productsRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productsContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />

      {/* Bottom Navigation - Updated with Messages navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}>
          <View style={styles.navIconCircleActive}>
            <Text style={styles.navIconActive}>🏠</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => router.push('/messages')}
        >
          <Text style={styles.navIconInactive}>✉️</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => router.push('/cart')}
        >
          <Text style={styles.navIconInactive}>🛒</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => router.push('/search')}
        >
          <Text style={styles.navIconInactive}>🔍</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => router.push('/profile')}
        >
          <Text style={styles.navIconInactive}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.modalCategoryItem}
                onPress={() => handleCategorySelect(cat.id)}
              >
                <Text style={[
                  styles.modalCategoryText,
                  selectedCategory === cat.id && styles.modalCategoryTextActive
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F1E9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F1E9' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#8B5A2B' },
  errorText: { color: 'red', marginBottom: 10, fontSize: 16 },
  retryButton: { backgroundColor: '#8B5A2B', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, marginTop: 20 },
  retryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: 16, color: '#999' },

  header: {
    backgroundColor: '#8B5A2B',
    paddingTop: 50,
    paddingBottom: 35,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: { flex: 1 },
  welcomeText: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 6 },
  tagline: { fontSize: 14, color: '#fff', fontWeight: '500' },

  notificationButton: { padding: 8, position: 'relative' },
  bellIcon: { fontSize: 26, color: '#fff' },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#fff',
  },

  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 18,
    height: 48,
    borderWidth: 1,
    borderColor: '#E6D9C2',
  },
  searchIcon: { fontSize: 20, marginRight: 12, color: '#8B5A2B' },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },

  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6D9C2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: { fontSize: 22, color: '#8B5A2B' },

  categoriesScroll: { maxHeight: 55 },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#EDE4D4',
  },
  categoryButtonActive: { backgroundColor: '#8B5A2B' },
  categoryText: { fontSize: 15, color: '#666', fontWeight: '600' },
  categoryTextActive: { color: '#fff', fontWeight: '700' },

  productsContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  productsRow: { justifyContent: 'space-between', marginBottom: 18 },
  productCard: {
    width: cardWidth,
    backgroundColor: '#F4EDE4',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  productImage: { width: '100%', height: 135, resizeMode: 'contain', backgroundColor: '#fff', padding: 8 },
  productInfo: { padding: 12 },
  productTitle: { fontSize: 14.5, fontWeight: '700', color: '#333', marginBottom: 6 },
  ratingContainer: { flexDirection: 'row', marginBottom: 6 },
  star: { fontSize: 13, color: '#FFD700', marginRight: 2 },
  productPrice: { fontSize: 16, fontWeight: '700', color: '#8B5A2B' },
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addIcon: { fontSize: 22, fontWeight: 'bold', color: '#8B5A2B' },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E6D9C2',
  },
  navButton: { alignItems: 'center', justifyContent: 'center' },
  navIconCircleActive: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#8B5A2B', justifyContent: 'center', alignItems: 'center' },
  navIconActive: { fontSize: 26, color: '#fff' },
  navIconInactive: { fontSize: 24, color: '#999' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#8B5A2B', marginBottom: 20, textAlign: 'center' },
  modalCategoryItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalCategoryText: { fontSize: 17, color: '#333' },
  modalCategoryTextActive: { color: '#8B5A2B', fontWeight: '700' },
  closeButton: { marginTop: 25, backgroundColor: '#8B5A2B', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});