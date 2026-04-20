import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';

// ONLY REAL LOCAL IMAGES (no placeholders)
const siBookImage = require('../../assets/images/books/si-book.png');
const kitQcmImage = require('../../assets/images/books/qit_qcm.png');
const algorithmImage = require('../../assets/images/books/algorithm_design.png');
const softwareImage = require('../../assets/images/books/software_engineer.png');

// Use si_book.jpg as fallback for any missing images
const fallbackImage = siBookImage;

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([
    { id: 1, title: 'Laptop Bag', price: 500, quantity: 1, image: fallbackImage },
    { id: 2, title: 'Computer Science Book', price: 1755, quantity: 1, image: siBookImage },
    { id: 3, title: 'Laptop', price: 30000, quantity: 1, image: algorithmImage },
  ]);

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const getTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const checkout = () => {
    Alert.alert('Checkout', `Total: ${formatPrice(getTotal())} DA\nProceed to payment?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => Alert.alert('Success', 'Order placed!') }
    ]);
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={item.image} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemPrice}>{formatPrice(item.price)} DA</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.qtyButton} 
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
          >
            <Text style={styles.qtyButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.qtyButton} 
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f0e8" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Cart Items */}
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer with Total and Checkout */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatPrice(getTotal())} DA</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={checkout}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f0e8',
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 16,
    backgroundColor: '#f5f0e8',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#5C3A1E',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5C3A1E',
  },
  placeholder: {
    width: 40,
  },
  
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5C3A1E',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#5C3A1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  qtyText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#e0d5c5',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C3A1E',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5C3A1E',
  },
  checkoutButton: {
    backgroundColor: '#5C3A1E',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});