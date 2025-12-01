import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ArrowRight,  
  Star,
  Sparkles
} from 'lucide-react'
import { userApi } from '@/api/api'
import { toast } from 'sonner'
import { CartButton } from '@/components/ui/cart-button'

const ModernHomePage = () => {
  const navigate = useNavigate()
  const [banners, setBanners] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch banners, featured products, and new arrivals in parallel
        const [bannersResponse, featuredResponse, newArrivalsResponse] = await Promise.all([
          userApi.banners.getActiveBanners(),
          userApi.products.getProducts({ sort: 'popular', limit: 4 }),
          userApi.products.getProducts({ sort: 'newest', limit: 4 })
        ])
        
        setBanners(bannersResponse.data.data || [])
        setFeaturedProducts(featuredResponse.data.data?.products || [])
        setNewArrivals(newArrivalsResponse.data.data?.products || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        setBanners([])
        setFeaturedProducts([])
        setNewArrivals([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Auto-scroll banners
  useEffect(() => {
    if (banners.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000)
    
    return () => clearInterval(interval)
  }, [banners.length])

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  // Get product price
  const getProductPrice = (product) => {
    if (product.isOnSale && product.salePrice) {
      return parseFloat(product.salePrice.discountedPrice || product.salePrice.price || 0)
    }
    return parseFloat(product.nonSalePrice?.discountedPrice || product.nonSalePrice?.price || 0)
  }

  // Get original price
  const getOriginalPrice = (product) => {
    if (product.isOnSale && product.nonSalePrice) {
      return parseFloat(product.nonSalePrice.discountedPrice || product.nonSalePrice.price || 0)
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner Carousel */}
      <section className="relative overflow-hidden">
        {loading ? (
        <div className="h-36 sm:h-64 md:h-80 lg:h-96 bg-muted flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center">
          </div>
        </div>
        ) : banners.length > 0 ? (
          <div className="relative h-36 sm:h-64 md:h-80 lg:h-96">
            {banners.map((banner, index) => {
              const isActive = index === currentBannerIndex;
              return (
                <motion.div
                  key={banner._id}
                  className={`absolute inset-0 w-full h-full ${isActive ? 'pointer-events-auto' : 'pointer-events-none'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isActive ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {banner.link ? (
                    <a 
                      href={banner.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full h-full cursor-pointer"
                    >
                      <img
                        src={banner.image.url || banner.image.secure_url}
                        alt={`Banner ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ) : (
                    <img
                      src={banner.image.url || banner.image.secure_url}
                      alt={`Banner ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </motion.div>
              );
            })}

            {banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentBannerIndex ? 'bg-primary' : 'bg-primary/50'
                    }`}
                    onClick={() => setCurrentBannerIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-36 sm:h-64 md:h-80 lg:h-96 bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">No banners available</p>
          </div>
        )}
      </section>

      {/* Featured Products Section */}
      <section className="py-20 max-md:py-10 max-sm:py-5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Star className="w-4 h-4 mr-2" />
                Featured
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Products</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Handpicked favorites that our customers love
              </p>
            </motion.div>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-square bg-muted animate-pulse" />
                  <CardContent className="p-3 md:p-4">
                    <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3 mb-3" />
                    <div className="h-8 bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="w-full"
                >
                  <Card 
                    className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/products/${product._id}`)}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={product.variants?.[0]?.orderImage?.secure_url || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <CardContent className="p-3 md:p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2 text-sm md:text-base">{product.name}</h3>
                      
                      {/* Colors Display - Hidden on mobile to save space */}
                      <div className="hidden md:flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">Colors:</span>
                        <div className="flex gap-1">
                          {product.variants?.slice(0, 3).map((variant, idx) => (
                            <div
                              key={idx}
                              className="w-4 h-4 rounded-full border border-border"
                              style={{ 
                                backgroundColor: variant.color?.hexCode || 
                                  (variant.color?.name === 'Red' ? '#ef4444' :
                                   variant.color?.name === 'Blue' ? '#3b82f6' :
                                   variant.color?.name === 'Green' ? '#10b981' :
                                   variant.color?.name === 'Black' ? '#000000' :
                                   variant.color?.name === 'White' ? '#ffffff' :
                                   variant.color?.name === 'Yellow' ? '#f59e0b' :
                                   variant.color?.name === 'Pink' ? '#ec4899' :
                                   variant.color?.name === 'Purple' ? '#8b5cf6' :
                                   '#6b7280')
                              }}
                              title={variant.color?.name || 'Unknown'}
                            />
                          ))}
                          {product.variants?.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{product.variants.length - 3}</span>
                          )}
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base md:text-lg font-bold">
                          {formatPrice(getProductPrice(product))}
                        </span>
                        {getOriginalPrice(product) && (
                          <span className="text-xs md:text-sm text-muted-foreground line-through">
                            {formatPrice(getOriginalPrice(product))}
                          </span>
                        )}
                      </div>
                      
                      <div onClick={(e) => e.stopPropagation()}>
                        <CartButton 
                          product={product}
                          colorId={product.variants?.[0]?.color?._id}
                          size={product.variants?.[0]?.sizes?.[0]?.size}
                          quantity={1}
                          className="text-xs md:text-sm w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured products available</p>
            </div>
          )}

          {/* Explore more button - right aligned */}
          {!loading && featuredProducts.length > 0 && (
            <div className="mt-6 max-w-6xl mx-auto flex justify-center">
              <Badge onClick={() => navigate('/products')} className="cursor-pointer bg-primary/10 text-primary hover:bg-primary/20 transition-colors select-none rounded-full px-3 py-1">
                Explore more
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Badge>
            </div>
          )}

        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="w-4 h-4 mr-2" />
                New Arrivals
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest Collection</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Fresh styles just arrived in our store
              </p>
            </motion.div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-square bg-muted animate-pulse" />
                  <CardContent className="p-3 md:p-4">
                    <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3 mb-3" />
                    <div className="h-8 bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : newArrivals.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
              {newArrivals.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="w-full"
                >
                  <Card 
                    className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/products/${product._id}`)}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={product.variants?.[0]?.orderImage?.secure_url || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <CardContent className="p-3 md:p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2 text-sm md:text-base">{product.name}</h3>
                      
                      {/* Colors Display - Hidden on mobile to save space */}
                      <div className="hidden md:flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">Colors:</span>
                        <div className="flex gap-1">
                          {product.variants?.slice(0, 3).map((variant, idx) => (
                            <div
                              key={idx}
                              className="w-4 h-4 rounded-full border border-border"
                              style={{ 
                                backgroundColor: variant.color?.hexCode || 
                                  (variant.color?.name === 'Red' ? '#ef4444' :
                                   variant.color?.name === 'Blue' ? '#3b82f6' :
                                   variant.color?.name === 'Green' ? '#10b981' :
                                   variant.color?.name === 'Black' ? '#000000' :
                                   variant.color?.name === 'White' ? '#ffffff' :
                                   variant.color?.name === 'Yellow' ? '#f59e0b' :
                                   variant.color?.name === 'Pink' ? '#ec4899' :
                                   variant.color?.name === 'Purple' ? '#8b5cf6' :
                                   '#6b7280')
                              }}
                              title={variant.color?.name || 'Unknown'}
                            />
                          ))}
                          {product.variants?.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{product.variants.length - 3}</span>
                          )}
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base md:text-lg font-bold">
                          {formatPrice(getProductPrice(product))}
                        </span>
                        {getOriginalPrice(product) && (
                          <span className="text-xs md:text-sm text-muted-foreground line-through">
                            {formatPrice(getOriginalPrice(product))}
                          </span>
                        )}
                      </div>
                      
                      <div onClick={(e) => e.stopPropagation()}>
                        <CartButton 
                          product={product}
                          colorId={product.variants?.[0]?.color?._id}
                          size={product.variants?.[0]?.sizes?.[0]?.size}
                          quantity={1}
                          className="text-xs md:text-sm w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No new arrivals available</p>
            </div>
          )}

          {/* Explore more button - right aligned */}
          {!loading && newArrivals.length > 0 && (
            <div className="mt-6 max-w-6xl mx-auto flex justify-center">
              <Badge onClick={() => navigate('/products')} className="cursor-pointer bg-primary/10 text-primary hover:bg-primary/20 transition-colors select-none rounded-full px-3 py-1">
                Explore more
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Badge>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default ModernHomePage