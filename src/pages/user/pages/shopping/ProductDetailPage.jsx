import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion'
import { 
  ChevronLeft, 
  Star, 
  Truck, 
  Shield, 
  RotateCcw,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  ArrowRight,
  Package,
  Clock,
  Award,
} from 'lucide-react'
import { userApi } from '@/api/api'
import { toast } from 'sonner'
import { CartButton } from '@/components/ui/cart-button'
import ProductReviewsSection from '@/components/ui/ProductReviewsSection'
import ReviewForm from '@/pages/user/components/product/ReviewForm'
import ViblyNavigation from '@/components/ui/vivly-navigation'
import SizeSelector from '@/components/ui/SizeSelector'
import Footer from '@/pages/home/components/Footer'

const ProductDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: []
  })
  const [availableStock, setAvailableStock] = useState(0)

  const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']

  useEffect(() => {
    fetchProduct()
    fetchReviewStats()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await userApi.products.getProductById(id)
      const productData = response.data.data
      
      console.log('Product response,,,,:', response.data)
      console.log('Product reviews data:', {
        averageRating: productData.averageRating,
        totalReviews: productData.totalReviews,
        reviewCount: productData.reviewCount,
        ratingDistribution: productData.ratingDistribution
      })
      console.log('Product object keys:', Object.keys(productData))
      console.log('Product averageRating type:', typeof productData.averageRating, 'value:', productData.averageRating)
      
      setProduct(productData)
      
      // Set default selections
      if (productData.variants && productData.variants.length > 0) {
        setSelectedColor(productData.variants[0].color._id)
        if (productData.variants[0].sizes && productData.variants[0].sizes.length > 0) {
          setSelectedSize(productData.variants[0].sizes[0].size)
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to fetch product details')
    } finally {
      setLoading(false)
    }
  }

  const fetchReviewStats = async () => {
    try {
      const response = await userApi.reviews.getReviews(id, { 
        page: 1, 
        limit: 1 // Just need stats, not reviews
      })
      
      console.log('Review stats response:', response.data)
      
      setReviewStats({
        averageRating: response.data.data.averageRating,
        totalReviews: response.data.data.totalReviews,
        ratingDistribution: response.data.data.ratingDistribution
      })
    } catch (error) {
      console.error('Error fetching review stats:', error)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const getProductPrice = (product) => {
    if (product.isOnSale && product.salePrice) {
      return parseFloat(product.salePrice.discountedPrice || product.salePrice.price || 0)
    }
    return parseFloat(product.nonSalePrice?.discountedPrice || product.nonSalePrice?.price || 0)
  }

  const getOriginalPrice = (product) => {
    if (product.isOnSale && product.nonSalePrice) {
      return parseFloat(product.nonSalePrice.discountedPrice || product.nonSalePrice.price || 0)
    }
    return null
  }

  const getSelectedVariant = () => {
    if (!product || !selectedColor) return null
    return product.variants.find(variant => variant.color._id === selectedColor)
  }

  const getAvailableSizes = () => {
    const variant = getSelectedVariant();


    
    if (!variant || !variant.sizes) return []
    // Arrange sizes in the order defined by the sizes array
    return sizes.filter(size =>
      variant.sizes.some(s => s.size === size)
    )
  }

  const getStockForSelectedSize = () => {
    const variant = getSelectedVariant()
    if (!variant || !variant.sizes || !selectedSize) return 0
    
    const sizeData = variant.sizes.find(size => size.size === selectedSize)
    return sizeData ? sizeData.stock : 0
  }

  const getColorHex = (colorName) => {
    const colorMap = {
      'Red': '#ef4444',
      'Blue': '#3b82f6',
      'Green': '#10b981',
      'Black': '#000000',
      'White': '#ffffff',
      'Yellow': '#fbbf24',
      'Purple': '#8b5cf6',
      'Pink': '#ec4899',
      'Orange': '#f97316',
      'Gray': '#6b7280',
      'Brown': '#a3a3a3'
    }
    return colorMap[colorName] || '#6b7280'
  }

  const handleQuantityChange = (change) => {
    const currentStock = getStockForSelectedSize()
    setQuantity(prev => {
      const newQuantity = prev + change
      return Math.max(1, Math.min(newQuantity, currentStock))
    })
  }

  // Update available stock when color or size changes
  useEffect(() => {
    const stock = getStockForSelectedSize()
    setAvailableStock(stock)
    
    // Reset quantity if it exceeds available stock
    if (quantity > stock && stock > 0) {
      setQuantity(stock)
    } else if (stock === 0) {
      setQuantity(1)
    }
  }, [selectedColor, selectedSize, product])

  const handleBuyNow = () => {
    if (!selectedColor || !selectedSize) {
      toast.error('Please select color and size')
      return
    }
    
    // Add to cart and navigate to checkout
    // Implementation depends on your cart system
    toast.success('Added to cart! Redirecting to checkout...')
    navigate('/checkout')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
       
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="aspect-square bg-muted rounded-lg"></div>
                <div className="flex gap-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-20 h-20 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
      
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Button onClick={() => navigate('/products')} className="mt-4">
            Back to Products
          </Button>
        </div>
        <Footer />
      </div>
    )
  }

  const selectedVariant = getSelectedVariant()
  const availableSizes = getAvailableSizes()
  const allImages = selectedVariant?.images || []

  return (
    <div className="min-h-screen bg-background">
      <ViblyNavigation />
      
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pb-12">
          {/* Product Images */}
          <div>
            <div className="flex flex-col gap-4">
              {/* Main Image */}
              <div className="relative aspect-[3/4] bg-muted overflow-hidden rounded-md group">
                <img
                  src={allImages[selectedImageIndex]?.secure_url || selectedVariant?.orderImage?.secure_url || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Sale Badge */}
                {product.isOnSale && availableStock > 0 && (
                  <Badge className="absolute top-4 left-4 bg-red-500 text-white border-0">
                    Sale
                  </Badge>
                )}
                
                {/* Out of Stock Badge */}
                {availableStock === 0 && (
                  <Badge className="absolute top-4 left-4 bg-red-600 text-white border-0 font-semibold z-10">
                    Out of Stock
                  </Badge>
                )}
              </div>

              {/* Thumbnail Images - Horizontal Carousel */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scroll-smooth py-1">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`shrink-0 w-20 h-28 rounded-md overflow-hidden border-2 transition-all hover-elevate ${
                        selectedImageIndex === index
                          ? "border-primary"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={image.secure_url}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-6">
              {/* Product Header */}
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-semibold">
                  {product.name}
                </h1>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium">{reviewStats.averageRating || 0}</span>
                  </div>
                  <a href="#reviews" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    ({reviewStats.totalReviews || 0} reviews)
                  </a>
                </div>

                <div className="flex items-baseline gap-3 pt-2">
                  {product.isOnSale ? (
                    <>
                      <span className="text-2xl md:text-3xl font-semibold text-foreground">
                        {formatPrice(getProductPrice(product))}
                      </span>
                      <span className="text-xl text-muted-foreground line-through">
                        {formatPrice(getOriginalPrice(product))}
                      </span>
                      <Badge variant="destructive">Sale</Badge>
                    </>
                  ) : (
                    <span className="text-2xl md:text-3xl font-semibold text-foreground">
                      {formatPrice(getProductPrice(product))}
                    </span>
                  )}
                </div>
              </div>


              {/* Color Selection */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Color: <span className="text-muted-foreground">
                      {product.variants.find(v => v.color._id === selectedColor)?.color?.name || 'Select a color'}
                    </span>
                  </label>
                  <div className="flex gap-2">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.color._id}
                        onClick={() => {
                          setSelectedColor(variant.color._id)
                          setSelectedImageIndex(0)
                          setSelectedSize('')
                        }}
                        className={`relative w-9 h-9 rounded-full border-2 transition-all hover-elevate ${
                          selectedColor === variant.color._id
                            ? "border-primary scale-105"
                            : "border-border"
                        }`}
                        style={{ backgroundColor: variant.color.hexCode || getColorHex(variant.color.name) }}
                        aria-label={`Select ${variant.color.name} color`}
                      >
                        {selectedColor === variant.color._id && (
                          <Check className="absolute inset-0 m-auto h-3 w-3 text-white drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {availableSizes.length > 0 && (
                <SizeSelector 
                  sizes={availableSizes}
                  selectedSize={selectedSize}
                  onSizeSelect={setSelectedSize}
                />
              )}

              {/* Quantity */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1 || availableStock === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className={`w-12 text-center font-medium ${availableStock === 0 ? 'text-muted-foreground' : ''}`}>
                    {quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= availableStock || availableStock === 0}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Stock Status */}
              {availableStock === 0 ? (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  Out of Stock
                </p>
              ) : availableStock < 10 && availableStock > 0 ? (
                <p className="text-sm text-destructive font-medium">
                  Only {availableStock} left in stock!
                </p>
              ) : null}

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <CartButton 
                  product={product}
                  colorId={selectedColor}
                  size={selectedSize}
                  quantity={quantity}
                  className="w-full h-12 text-base"
                  disabled={availableStock === 0 || !selectedColor || !selectedSize}
                />
                
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 gap-3 pt-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <Truck className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">Free Shipping</p>
                    <p className="text-xs text-green-700 dark:text-green-300">On orders over ₹599</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <RotateCcw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">7 Day Exchange Return</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Easy exchange policy</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-900 dark:text-purple-100">Secure Checkout</p>
                    <p className="text-xs text-purple-700 dark:text-purple-300">SSL encrypted payment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details and Reviews Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Left Side - Description, Specifications, and Review Form */}
          <div className="lg:col-span-2 space-y-6">
            <Accordion type="multiple" defaultValue={["description"]} className="w-full">
              {/* Description */}
              <AccordionItem value="description" className="mb-4">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <span className="font-semibold text-lg">Description</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Specifications */}
              {product.specifications && product.specifications.length > 0 && (
                <AccordionItem value="specifications" className="mb-4">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="font-semibold text-lg">Specifications</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-4">
                      {product.specifications.map((spec, index) => (
                        <div key={spec._id || index} className="py-3 last:pb-0">
                          <h4 className="font-semibold text-foreground mb-2">{spec.title}</h4>
                          <p className="text-muted-foreground leading-relaxed">{spec.description}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* Review Form - Left Side */}
              <ReviewForm 
                productId={product._id} 
                onReviewAdded={() => {
                  fetchReviewStats() // Refresh review stats after adding review
                }}
              />
          </div>

          {/* Right Side - All Reviews */}
          <div className="lg:col-span-1 space-y-6" id="reviews">
            {/* Reviews Summary - Scrolls with page */}
            <div>
              <h2 className="text-xl font-light mb-4">Customer Reviews</h2>
              
              <div className="space-y-4 mb-6">
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                    <span className="text-3xl font-light">
                      {(reviewStats.averageRating || 0).toFixed(1)}
                    </span>
                    <div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(reviewStats.averageRating || 0) 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {reviewStats.totalReviews || 0} reviews
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    // Use actual rating distribution from reviews data
                    const ratingData = reviewStats.ratingDistribution?.find(r => r.rating === rating);
                    const count = ratingData?.count || 0;
                    const totalReviews = reviewStats.totalReviews || 0;
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    
                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-xs w-8">{rating}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-6 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Individual Reviews - Normal flow */}
            <div>
              <ProductReviewsSection productId={product._id} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ProductDetailPage