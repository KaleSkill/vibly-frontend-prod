import React, { useState, useEffect } from 'react'
import { userApi } from '@/api/api'

const BannerCarousel = () => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)

  // Fetch banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true)
        console.log('Fetching banners...')
        const response = await userApi.banners.getActiveBanners()
        console.log('Banners response:', response.data)
        console.log('Banners data:', response.data.data)
        setBanners(response.data.data || [])
      } catch (error) {
        console.error('Error fetching banners:', error)
        setBanners([])
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [])

  // Auto-scroll banners
  useEffect(() => {
    if (banners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000) // Change banner every 5 seconds

    return () => clearInterval(interval)
  }, [banners.length])

  return (
    <section className="relative w-full overflow-hidden bg-gray-50 -mx-0">
      {loading ? (
        <div className="h-48 sm:h-64 md:h-80 lg:h-[500px] bg-gray-200 flex items-center justify-center">
          <div className="w-full h-full flex flex-col gap-4 items-center justify-center px-4">
            <div className="w-2/3 md:w-1/2 h-10 md:h-16 bg-gray-300 rounded animate-pulse"></div>
            <div className="w-full h-32 md:h-48 bg-gray-300 rounded-lg animate-pulse"></div>
            <div className="w-1/3 md:w-1/4 h-6 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
      ) : banners.length > 0 ? (
        <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-[500px]">
          {banners.map((banner, index) => (
            <div
              key={banner._id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
                index === currentBannerIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={banner.image.url || banner.image.secure_url}
                alt={`Banner ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/10"></div>
            </div>
          ))}
          
          {/* Banner Indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentBannerIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentBannerIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="h-48 sm:h-64 md:h-80 lg:h-[500px] bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">No banners available</p>
        </div>
      )}
    </section>
  )
}

export default BannerCarousel
