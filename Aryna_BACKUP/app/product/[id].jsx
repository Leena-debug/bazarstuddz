import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Linking
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../src/services/api';

// Dynamic image mapping (add more as you add images)
const getProductImage = (title) => {
  const imageMap = {
    'SI Book': require('../../assets/images/books/si-book.png'),
    'KIT QCM': require('../../assets/images/books/qit_qcm.png'),
    'Algorithm Design': require('../../assets/images/books/algorithm_design.png'),
    'Software Eng': require('../../assets/images/books/software_engineer.png'),
    'Dell Laptop': require('../../assets/images/electronics/acer_laptop.png'),
    'Laptop Backpack': require('../../assets/images/electronics/laptop_backpack.png'),
    'Scientific Calculator': require('../../assets/images/electronics/scientific_calculator.png'),
    'Algorithmics Course Handout': require('../../assets/images/handout/algorithmics_handout.png'),
  };
  return imageMap[title] || require('../../assets/images/books/si-book.png');
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      if (response.data.success) {
        setProduct(response.data.product);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    try {
      await api.post('/cart', { product_id: id, quantity: 1 });
      Alert.alert('Success', 'Added to cart!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add to cart');
    }
  };

  const addToFavorites = async () => {
    try {
      await api.post('/favorites', { product_id: id });
      Alert.alert('Success', 'Added to favorites!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add to favorites');
    }
  };

  const makeCall = () => {
    if (product?.seller_phone) {
      Linking.openURL(`tel:${product.seller_phone}`);
    } else {
      Alert.alert('Info', 'No phone number available');
    }
  };

  const openChat = () => {
    router.push({
      pathname: '/chat',
      params: { 
        sellerId: product?.seller_id,
        sellerName: product?.seller_name,
        productId: id,
        productTitle: product?.title
      }
    });
  };

  const renderStars = (rating) => {
    const stars = [];
    const numStars = Math.floor(rating || 5);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= numStars ? '★' : '☆'}
        </Text>
      );
    }
    return <View style={styles.ratingContainer}>{stars}</View>;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5A2B" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Product not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F1E9" />
      
      {/* Product Image */}
      <Image source={getProductImage(product.title)} style={styles.productImage} />
      
      <View style={styles.content}>
        {/* Product Title & Price */}
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>{parseInt(product.price)} DA</Text>
        
        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{product.description || 'No description available'}</Text>
        
        {/* Seller Profile Section */}
        <View style={styles.sellerSection}>
          <Text style={styles.sectionTitle}>Seller</Text>
          <View style={styles.sellerCard}>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarText}>
                  {product.seller_name?.charAt(0) || 'S'}
                </Text>
              </View>
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{product.seller_name || 'Unknown Seller'}</Text>
                {renderStars(product.seller_rating)}
                <Text style={styles.sellerBio} numberOfLines={2}>
                  {product.seller_bio || 'Trusted seller on BazarStudDZ'}
                </Text>
              </View>
            </View>
            
            {/* Contact Buttons */}
            <View style={styles.contactButtons}>
              <TouchableOpacity style={styles.callButton} onPress={makeCall}>
                <Text style={styles.callButtonText}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chatButton} onPress={openChat}>
                <Text style={styles.chatButtonText}>💬 Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Action Buttons */}
        <TouchableOpacity style={styles.favButton} onPress={addToFavorites}>
          <Text style={styles.buttonText}>❤️ Add to Favorite</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cartButton} onPress={addToCart}>
          <Text style={styles.buttonText}>🛒 Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F1E9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  productImage: { width: '100%', height: 300, resizeMode: 'contain', backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },
  price: { fontSize: 22, fontWeight: 'bold', color: '#8B5A2B', marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginTop: 20, marginBottom: 10 },
  description: { fontSize: 14, color: '#666', lineHeight: 20 },
  
  sellerSection: { marginTop: 20 },
  sellerCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 5 },
  sellerInfo: { flexDirection: 'row', alignItems: 'center' },
  sellerAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#8B5A2B', justifyContent: 'center', alignItems: 'center' },
  sellerAvatarText: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  sellerDetails: { marginLeft: 12, flex: 1 },
  sellerName: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  ratingContainer: { flexDirection: 'row', marginTop: 4 },
  star: { fontSize: 14, color: '#FFD700', marginRight: 2 },
  sellerBio: { fontSize: 12, color: '#666', marginTop: 4 },
  
  contactButtons: { flexDirection: 'row', marginTop: 16, gap: 12 },
  callButton: { flex: 1, backgroundColor: '#27ae60', padding: 12, borderRadius: 25, alignItems: 'center' },
  callButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  chatButton: { flex: 1, backgroundColor: '#3498db', padding: 12, borderRadius: 25, alignItems: 'center' },
  chatButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  favButton: { backgroundColor: '#e74c3c', padding: 15, borderRadius: 25, alignItems: 'center', marginTop: 20 },
  cartButton: { backgroundColor: '#8B5A2B', padding: 15, borderRadius: 25, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backButton: { backgroundColor: '#8B5A2B', padding: 12, borderRadius: 8, marginTop: 20 },
  backButtonText: { color: '#fff', fontWeight: 'bold' },
});