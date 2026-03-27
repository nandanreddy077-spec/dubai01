import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ShoppingBag,
  Scan,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Package,
  Sparkles,
  Camera,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useProducts } from '@/contexts/ProductContext';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { analyzeProductIngredients, findIngredient } from '@/lib/ingredient-intelligence';
import { recognizeProductFromImage } from '@/lib/product-recognition';
import { Product } from '@/types/product';
import { Platform } from 'react-native';

export default function ProductShelfScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const { products, addProduct, deleteProduct } = useProducts();
  const { currentResult } = useAnalysis();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    category: 'skincare' as const,
    barcode: '',
    ingredients: [] as string[],
  });

  const styles = createStyles(palette);

  // Analyze product compatibility with user's skin
  const analyzeProductCompatibility = (product: Product) => {
    if (!currentResult || !product.ingredients || product.ingredients.length === 0) {
      return null;
    }

    const analysis = analyzeProductIngredients(product.name, product.ingredients);
    const skinType = currentResult.skinType.toLowerCase();
    const concerns = currentResult.dermatologyInsights?.skinConcerns || [];

    // Check if product works for user's skin type
    const compatibility = {
      score: analysis.analysis.efficacy.score,
      worksForSkinType: true,
      worksForConcerns: false,
      warnings: [] as string[],
      benefits: [] as string[],
    };

    // Check skin type compatibility
    const actives = analysis.analysis.actives;
    actives.forEach(active => {
      // Check if active addresses user's concerns
      const addressesConcerns = active.efficacy.conditions.some(condition =>
        concerns.some(concern => 
          concern.toLowerCase().includes(condition.toLowerCase()) ||
          condition.toLowerCase().includes(concern.toLowerCase())
        )
      );
      
      if (addressesConcerns) {
        compatibility.worksForConcerns = true;
        compatibility.benefits.push(`${active.name} addresses: ${active.efficacy.conditions.join(', ')}`);
      }

      // Check for skin type warnings
      if (skinType === 'sensitive' && active.safety.irritation === 'high') {
        compatibility.warnings.push(`${active.name} may cause irritation for sensitive skin`);
      }
      if (skinType === 'dry' && active.name.includes('Acid') && !active.name.includes('Hyaluronic')) {
        compatibility.warnings.push(`${active.name} may be drying - use with moisturizer`);
      }
      if (skinType === 'oily' && active.safety.comedogenic >= 3) {
        compatibility.warnings.push(`${active.name} may clog pores`);
      }
    });

    // Check compatibility issues
    if (analysis.analysis.compatibility.issues.length > 0) {
      analysis.analysis.compatibility.issues.forEach(issue => {
        compatibility.warnings.push(issue.description);
      });
    }

    return compatibility;
  };

  const handleTakePhoto = async () => {
    if (recognizing) return;
    
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Not Available', 'Camera is not available on web. Please select from library.');
        return;
      }

      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take product photos. Please enable it in settings.'
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await handleProductPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handlePickFromLibrary = async () => {
    if (recognizing) return;
    
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library permission is required. Please enable it in settings.'
        );
        return;
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await handleProductPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleProductPhoto = async (imageUri: string) => {
    setRecognizing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      Alert.alert('🔍 Analyzing...', 'AI is recognizing your product. This may take a few seconds.');
      
      // Recognize product from image
      const recognized = await recognizeProductFromImage(imageUri);
      
      console.log('✅ Product recognized:', recognized);
      
      // Auto-fill form with recognized data
      setNewProduct({
        name: recognized.name || '',
        brand: recognized.brand || '',
        category: (recognized.category as any) || 'skincare',
        barcode: '',
        ingredients: recognized.ingredients || [],
        imageUrl: imageUri, // Store the photo
      });
      
      setShowAddProduct(true);
      
      if (recognized.confidence > 0.5) {
        Alert.alert(
          '✅ Product Recognized!',
          `Found: ${recognized.brand ? recognized.brand + ' ' : ''}${recognized.name || 'Product'}\n\nPlease review and confirm the details below.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '⚠️ Partial Recognition',
          'Some product details were recognized. Please review and complete the information below.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Product recognition error:', error);
      Alert.alert(
        'Recognition Failed',
        'Could not automatically recognize the product. Please add it manually.',
        [{ text: 'OK' }]
      );
      // Still open the form so user can add manually
      setNewProduct({
        name: '',
        brand: '',
        category: 'skincare',
        barcode: '',
        ingredients: [],
        imageUrl: imageUri, // Store the photo anyway
      });
      setShowAddProduct(true);
    } finally {
      setRecognizing(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.brand) {
      Alert.alert('Required Fields', 'Please enter product name and brand.');
      return;
    }

    try {
      await addProduct(newProduct);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewProduct({
        name: '',
        brand: '',
        category: 'skincare',
        barcode: '',
        ingredients: [],
      });
      setShowAddProduct(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add product. Please try again.');
    }
  };

  const handleScanPress = async () => {
    if (Platform.OS === 'web') {
      handlePickFromLibrary();
      return;
    }

    // Show options: Camera or Library
    Alert.alert(
      'Add Product Photo',
      'How would you like to add a product photo?',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: handlePickFromLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      <Stack.Screen
        options={{
          title: 'Product Shelf',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTintColor: palette.textPrimary,
          headerTransparent: true,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Your Product Shelf</Text>
            <Text style={styles.headerSubtitle}>
              {products.length} product{products.length !== 1 ? 's' : ''} in your collection
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScanPress}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[palette.primary, palette.primaryDark || palette.primary]}
              style={styles.scanButtonGradient}
            >
              <Scan color="#FFFFFF" size={20} />
              <Text style={styles.scanButtonText}>Scan Barcode</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddProduct(true)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[palette.surface, palette.surfaceElevated || palette.surface]}
              style={styles.addButtonGradient}
            >
              <Plus color={palette.primary} size={20} />
              <Text style={styles.addButtonText}>Add Manually</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Products Grid */}
        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <ShoppingBag color={palette.textMuted} size={48} />
            </View>
            <Text style={styles.emptyTitle}>No Products Yet</Text>
            <Text style={styles.emptySubtitle}>
              Scan a barcode or add products manually to see how they work with your skin
            </Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {products.map((product) => {
              const compatibility = analyzeProductCompatibility(product);
              
              return (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => router.push({
                    pathname: '/product-details',
                    params: { id: product.id }
                  })}
                  activeOpacity={0.9}
                >
                  <View style={styles.productCardHeader}>
                    {product.imageUrl ? (
                      <Image
                        source={{ uri: product.imageUrl }}
                        style={styles.productImage}
                      />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <Package color={palette.textSecondary} size={24} />
                      </View>
                    )}
                    
                    {compatibility && (
                      <View style={[
                        styles.compatibilityBadge,
                        compatibility.score >= 70 
                          ? styles.compatibilityGood 
                          : compatibility.score >= 50
                          ? styles.compatibilityMedium
                          : styles.compatibilityPoor
                      ]}>
                        {compatibility.score >= 70 ? (
                          <CheckCircle color="#FFFFFF" size={14} />
                        ) : (
                          <AlertCircle color="#FFFFFF" size={14} />
                        )}
                        <Text style={styles.compatibilityText}>
                          {compatibility.score}% match
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.productInfo}>
                    <Text style={styles.productBrand} numberOfLines={1}>
                      {product.brand}
                    </Text>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    
                    {compatibility && (
                      <View style={styles.compatibilityInfo}>
                        {compatibility.worksForConcerns && (
                          <View style={styles.benefitTag}>
                            <Sparkles color={palette.success} size={12} />
                            <Text style={styles.benefitText}>Works for your concerns</Text>
                          </View>
                        )}
                        {compatibility.warnings.length > 0 && (
                          <View style={styles.warningTag}>
                            <AlertCircle color={palette.warning || '#F59E0B'} size={12} />
                            <Text style={styles.warningText}>
                              {compatibility.warnings[0]}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Product Modal */}
      <Modal
        visible={showAddProduct}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddProduct(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Product</Text>
              <TouchableOpacity
                onPress={() => setShowAddProduct(false)}
                style={styles.modalCloseButton}
              >
                <X color={palette.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Product Image Preview */}
              {newProduct.imageUrl && (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: newProduct.imageUrl }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Daily Moisturizer"
                  placeholderTextColor={palette.textMuted}
                  value={newProduct.name}
                  onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Brand *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., CeraVe"
                  placeholderTextColor={palette.textMuted}
                  value={newProduct.brand}
                  onChangeText={(text) => setNewProduct({ ...newProduct, brand: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ingredients (comma-separated)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g., Niacinamide, Hyaluronic Acid, Ceramides"
                  placeholderTextColor={palette.textMuted}
                  value={newProduct.ingredients.join(', ')}
                  onChangeText={(text) => setNewProduct({
                    ...newProduct,
                    ingredients: text.split(',').map(i => i.trim()).filter(Boolean)
                  })}
                  multiline
                  numberOfLines={3}
                />
                <Text style={styles.inputHint}>
                  Add ingredients to see compatibility with your skin
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!newProduct.name || !newProduct.brand) && styles.saveButtonDisabled
                ]}
                onPress={handleAddProduct}
                disabled={!newProduct.name || !newProduct.brand}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    (!newProduct.name || !newProduct.brand)
                      ? [palette.disabled || palette.border, palette.disabled || palette.border]
                      : [palette.success, palette.successDark || palette.success]
                  }
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>Add to Shelf</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  scanButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadow.medium,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  addButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: palette.border,
    ...shadow.card,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: palette.surface,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadow.card,
  },
  productCardHeader: {
    position: 'relative',
    width: '100%',
    height: 140,
    backgroundColor: palette.surfaceAlt,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compatibilityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    ...shadow.soft,
  },
  compatibilityGood: {
    backgroundColor: palette.success,
  },
  compatibilityMedium: {
    backgroundColor: palette.warning || '#F59E0B',
  },
  compatibilityPoor: {
    backgroundColor: palette.error || '#EF4444',
  },
  compatibilityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  productInfo: {
    padding: 12,
  },
  productBrand: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 8,
  },
  compatibilityInfo: {
    gap: 6,
  },
  benefitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  benefitText: {
    fontSize: 10,
    color: palette.success,
    fontWeight: '600',
  },
  warningTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 10,
    color: palette.warning || '#F59E0B',
    fontWeight: '600',
  },
  imagePreviewContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: palette.surfaceAlt,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...shadow.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: palette.textPrimary,
    borderWidth: 1,
    borderColor: palette.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: 6,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    ...shadow.medium,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

