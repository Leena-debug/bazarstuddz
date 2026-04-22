import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

// REAL LOCAL IMAGES (same as home page)
const siBookImage = require('../../assets/images/books/si-book.png');
const kitQcmImage = require('../../assets/images/books/qit_qcm.png');
const algorithmImage = require('../../assets/images/books/algorithm_design.png');
const softwareImage = require('../../assets/images/books/software_engineer.png');

const productsData = {
  1: {
    id: 1, title: 'SI Book', price: 1200, category: 'Books', rating: 5,
    description: 'This is a great SI book for computer science students. Covers all important topics with practical examples and exercises.',
    condition: 'Like New', seller: 'Ahmed Student', sellerRating: 4.8, image: siBookImage
  },
  2: {
    id: 2, title: 'KIT QCM', price: 600, category: 'Books', rating: 5,
    description: 'QCM preparation kit for entrance exams. Includes 500+ practice questions with detailed answers and explanations.',
    condition: 'Good', seller: 'Karim Prof', sellerRating: 4.5, image: kitQcmImage
  },
  3: {
    id: 3, title: 'Algorithm Design', price: 1650, category: 'Books', rating: 5,
    description: 'Complete guide to algorithm design and analysis. Perfect for CS students and competitive programming enthusiasts.',
    condition: 'New', seller: 'Fatima Student', sellerRating: 4.9, image: algorithmImage
  },
  4: {
    id: 4, title: 'Software Eng', price: 2000, category: 'Books', rating: 5,
    description: 'Software engineering principles, design patterns, and best practices for modern software development.',
    condition: 'Like New', seller: 'Mohamed Student', sellerRating: 4.7, image: softwareImage
  },
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    setProduct(productsData[id]);
  }, [id]);

  const addToCart = () => Alert.alert('Success', `${product?.title} added to cart!`);
  const addToFavorites = () => Alert.alert('Success', `${product?.title} added to favorites!`);
  const contactSeller = () => Alert.alert('Contact', `Message sent to ${product?.seller}`);

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

  const renderStars = (rating) => (
    <View style={styles.ratingContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} style={styles.star}>{star <= rating ? '★' : '☆'}</Text>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Image source={product.image} style={styles.productImage} />
      
      <View style={styles.content}>
        <Text style={styles.title}>{product.title}</Text>
        {renderStars(product.rating)}
        <Text style={styles.price}>{product.price} DA</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Category:</Text>
          <Text style={styles.infoValue}>{product.category}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Condition:</Text>
          <Text style={styles.infoValue}>{product.condition}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Seller:</Text>
          <Text style={styles.infoValue}>{product.seller} ⭐ {product.sellerRating}</Text>
        </View>
        
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{product.description}</Text>
        
        <TouchableOpacity style={styles.cartButton} onPress={addToCart}>
          <Text style={styles.buttonText}>Add to Cart</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.favButton} onPress={addToFavorites}>
          <Text style={styles.buttonText}>Add to Favorites</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.contactButton} onPress={contactSeller}>
          <Text style={styles.contactButtonText}>Contact Seller</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  productImage: { width: '100%', height: 320, resizeMode: 'cover' },
  content: { padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2c3e50' },
  ratingContainer: { flexDirection: 'row', marginTop: 8 },
  star: { fontSize: 18, color: '#f39c12' },
  price: { fontSize: 28, fontWeight: 'bold', color: '#27ae60', marginTop: 12 },
  divider: { height: 1, backgroundColor: '#e9ecef', marginVertical: 16 },
  infoRow: { flexDirection: 'row', marginBottom: 12 },
  infoLabel: { fontSize: 15, fontWeight: '600', color: '#6c757d', width: 90 },
  infoValue: { fontSize: 15, color: '#2c3e50', flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginTop: 16, marginBottom: 8 },
  description: { fontSize: 15, color: '#495057', lineHeight: 22 },
  cartButton: { backgroundColor: '#27ae60', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  favButton: { backgroundColor: '#e74c3c', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  contactButton: { backgroundColor: '#3498db', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12, marginBottom: 30 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  contactButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backButton: { backgroundColor: '#3498db', padding: 12, borderRadius: 8, marginTop: 20 },
  backButtonText: { color: '#fff', fontWeight: 'bold' },
});