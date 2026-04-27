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

// REAL LOCAL IMAGES
const siBookImage = require('../../assets/images/books/si-book.png');
const algorithmImage = require('../../assets/images/books/algorithm_design.png');

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState([
    { id: 1, title: 'SI Book', price: 1200, rating: 5, image: siBookImage },
    { id: 3, title: 'Algorithm Design', price: 1650, rating: 5, image: algorithmImage },
  ]);

  const removeFromFavorites = (id) => {
    Alert.alert('Remove', 'Remove from favorites?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', onPress: () => setFavorites(prev => prev.filter(item => item.id !== id)) }
    ]);
  };

  const addToCart = (item) => Alert.alert('Success', `${item.title} added to cart!`);

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.emptyText}>No favorites yet</Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/home')}>
          <Text style={styles.shopButtonText}>Browse Products</Text>
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

  const renderFavorite = ({ item }) => (
    <View style={styles.favoriteItem}>
      <Image source={item.image} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        {renderStars(item.rating)}
        <Text style={styles.itemPrice}>{item.price} DA</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cartButton} onPress={() => addToCart(item)}>
            <Text style={styles.buttonText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeFromFavorites(item.id)}>
            <Text style={styles.removeIcon}>❤️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={favorites}
        renderItem={renderFavorite}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  emptyText: { fontSize: 18, color: '#6c757d', marginBottom: 20 },
  shopButton: { backgroundColor: '#3498db', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 30 },
  shopButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  list: { padding: 12 },
  favoriteItem: { flexDirection: 'row', backgroundColor: '#fff', marginBottom: 12, padding: 12, borderRadius: 16 },
  itemImage: { width: 80, height: 80, borderRadius: 12, marginRight: 12 },
  itemDetails: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  ratingContainer: { flexDirection: 'row', marginTop: 4 },
  star: { fontSize: 12, color: '#f39c12' },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#27ae60', marginTop: 6 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  cartButton: { backgroundColor: '#27ae60', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  removeIcon: { fontSize: 24, marginLeft: 10 },
});