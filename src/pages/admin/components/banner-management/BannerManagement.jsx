import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  Image, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical, 
  Plus,
  Filter,
  RefreshCw,
  AlertCircle,
  Tag,
  X,
  Link as LinkIcon,
  Edit
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { adminApi } from '@/api/api'

const BannerManagement = () => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [saleFilter, setSaleFilter] = useState('all')
  const [dragIndex, setDragIndex] = useState(null)
  const [operationLoading, setOperationLoading] = useState({})
  const [bannerLink, setBannerLink] = useState('')
  const [editingLink, setEditingLink] = useState(null)
  const [linkInput, setLinkInput] = useState('')
  const fileInputRef = useRef(null)

  // Fetch banners
  const fetchBanners = async () => {
    setLoading(true)
    try {
      let isActiveFilter = filter
      let saleActiveFilter = saleFilter
      
      // Handle sale filter
      if (filter === 'sale') {
        isActiveFilter = 'all'
        saleActiveFilter = 'true'
      }
      
      const response = await adminApi.banners.getBanners(isActiveFilter, saleActiveFilter)
      setBanners(response.data.data || [])
    } catch (error) {
      toast.error('Failed to fetch banners')
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  // Upload banner
  const handleUpload = async (file) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('banner', file)
      if (bannerLink) {
        formData.append('link', bannerLink)
      }

      const response = await adminApi.banners.uploadBanner(formData)
      
      // Immediately add the new banner to the UI
      if (response.data && response.data.data) {
        setBanners(prevBanners => [...prevBanners, response.data.data])
      }
      
      toast.success('Banner uploaded successfully')
      setBannerLink('') // Reset link input
      
      // Refresh to ensure consistency
      await fetchBanners()
    } catch (error) {
      toast.error('Failed to upload banner')
      console.error('Error uploading banner:', error)
    } finally {
      setUploading(false)
    }
  }

  // Update banner link
  const updateBannerLink = async (bannerId, link) => {
    setOperationLoading(prev => ({ ...prev, [bannerId]: true }))
    try {
      await adminApi.banners.updateBannerLink(bannerId, link)
      setBanners(prevBanners => 
        prevBanners.map(banner => 
          banner._id === bannerId 
            ? { ...banner, link: link }
            : banner
        )
      )
      toast.success('Banner link updated successfully')
      setEditingLink(null)
      setLinkInput('')
    } catch (error) {
      toast.error('Failed to update banner link')
      console.error('Error updating banner link:', error)
    } finally {
      setOperationLoading(prev => ({ ...prev, [bannerId]: false }))
    }
  }

  // Toggle banner status
  const toggleBannerStatus = async (bannerId) => {
    setOperationLoading(prev => ({ ...prev, [bannerId]: true }))
    try {
      // Optimistically update UI first
      setBanners(prevBanners => 
        prevBanners.map(banner => 
          banner._id === bannerId 
            ? { ...banner, isActive: !banner.isActive }
            : banner
        )
      )
      
      await adminApi.banners.toggleBannerStatus(bannerId)
      toast.success('Banner status updated')
      
      // Refresh to ensure consistency
      await fetchBanners()
    } catch (error) {
      // Revert optimistic update on error
      fetchBanners()
      toast.error('Failed to update banner status')
      console.error('Error toggling banner status:', error)
    } finally {
      setOperationLoading(prev => ({ ...prev, [bannerId]: false }))
    }
  }

  // Toggle banner sale status
  const toggleBannerSaleStatus = async (bannerId) => {
    setOperationLoading(prev => ({ ...prev, [bannerId]: true }))
    try {
      // Optimistically update UI first
      setBanners(prevBanners => 
        prevBanners.map(banner => 
          banner._id === bannerId 
            ? { ...banner, saleActive: !banner.saleActive }
            : banner
        )
      )
      
      await adminApi.banners.toggleBannerSaleStatus(bannerId)
      toast.success('Banner sale status updated')
      
      // Refresh to ensure consistency
      await fetchBanners()
    } catch (error) {
      // Revert optimistic update on error
      fetchBanners()
      toast.error('Failed to update banner sale status')
      console.error('Error toggling banner sale status:', error)
    } finally {
      setOperationLoading(prev => ({ ...prev, [bannerId]: false }))
    }
  }

  // Delete banner
  const deleteBanner = async (bannerId) => {
    setOperationLoading(prev => ({ ...prev, [bannerId]: true }))
    try {
      // Optimistically update UI first
      setBanners(prevBanners => prevBanners.filter(banner => banner._id !== bannerId))
      
      await adminApi.banners.deleteBanner(bannerId)
      toast.success('Banner deleted successfully')
      
      // Refresh to ensure consistency
      await fetchBanners()
    } catch (error) {
      // Revert optimistic update on error
      fetchBanners()
      toast.error('Failed to delete banner')
      console.error('Error deleting banner:', error)
    } finally {
      setOperationLoading(prev => ({ ...prev, [bannerId]: false }))
    }
  }

  // Reorder banners
  const reorderBanners = async (newOrder) => {
    try {
      const orderedIds = newOrder.map(banner => banner._id)
      await adminApi.banners.reorderBanners(orderedIds)
      toast.success('Banners reordered successfully')
      setBanners(newOrder)
    } catch (error) {
      toast.error('Failed to reorder banners')
      console.error('Error reordering banners:', error)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === dropIndex) return

    const newBanners = [...banners]
    const draggedBanner = newBanners[dragIndex]
    
    // Remove dragged item
    newBanners.splice(dragIndex, 1)
    // Insert at new position
    newBanners.splice(dropIndex, 0, draggedBanner)
    
    // Update order numbers
    const updatedBanners = newBanners.map((banner, index) => ({
      ...banner,
      order: index + 1
    }))

    setBanners(updatedBanners)
    reorderBanners(updatedBanners)
    setDragIndex(null)
  }

  // File input change handler
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleUpload(file)
    }
  }

  // Drop zone handlers
  const handleDropZone = (e) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleUpload(files[0])
    }
  }

  const handleDragOverZone = (e) => {
    e.preventDefault()
  }

  useEffect(() => {
    fetchBanners()
  }, [filter, saleFilter])

  const activeBanners = banners.filter(banner => banner.isActive)
  const inactiveBanners = banners.filter(banner => !banner.isActive)
  const saleBanners = banners.filter(banner => banner.saleActive)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banner Management</h1>
          <p className="text-muted-foreground">
            Upload and manage your website banners
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <strong>Note:</strong> Banner should be <strong>1920 x 500</strong> dimensions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Upload Banner
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Upload Drop Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Banner
          </CardTitle>
          <CardDescription>
            Drag and drop an image here or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={handleDropZone}
              onDragOver={handleDragOverZone}
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-600 mb-2">
                Drop your image here
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner-link">Banner Link (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="banner-link"
                  type="url"
                  placeholder="https://example.com or /products"
                  value={bannerLink}
                  onChange={(e) => setBannerLink(e.target.value)}
                  className="flex-1"
                />
                {bannerLink && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setBannerLink('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Add a URL to redirect users when they click on this banner. Leave empty if no link needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Dropdowns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Banners
          </CardTitle>
          <CardDescription>
            Filter banners by status and sale settings. Only active banners are shown on the website. Sale status is for future sale features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Label htmlFor="status-filter">Status Filter</Label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Select status filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Banners ({banners.length})</SelectItem>
                  <SelectItem value="true">Active ({activeBanners.length})</SelectItem>
                  <SelectItem value="false">Inactive ({inactiveBanners.length})</SelectItem>
                  <SelectItem value="sale">Sale Banners ({saleBanners.length})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="sale-filter">Sale Filter</Label>
              <Select value={saleFilter} onValueChange={setSaleFilter}>
                <SelectTrigger id="sale-filter">
                  <SelectValue placeholder="Select sale filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sale Status</SelectItem>
                  <SelectItem value="true">Sale Active Only</SelectItem>
                  <SelectItem value="false">Sale Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilter('all')
                  setSaleFilter('all')
                }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2">
            <Filter className="h-3 w-3" />
            Showing {banners.length} banners
          </Badge>
          {filter !== 'all' && (
            <Badge variant="secondary">
              Status: {filter === 'true' ? 'Active' : filter === 'false' ? 'Inactive' : 'Sale'}
            </Badge>
          )}
          {saleFilter !== 'all' && (
            <Badge variant="secondary">
              Sale: {saleFilter === 'true' ? 'Active' : 'Inactive'}
            </Badge>
          )}
        </div>
      </div>

      {/* Banner Grid */}
      <div className="space-y-4">
        <BannerGrid 
          banners={banners} 
          onToggleStatus={toggleBannerStatus}
          onToggleSaleStatus={toggleBannerSaleStatus}
          onDelete={deleteBanner}
          onUpdateLink={updateBannerLink}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          dragIndex={dragIndex}
          operationLoading={operationLoading}
          editingLink={editingLink}
          setEditingLink={setEditingLink}
          linkInput={linkInput}
          setLinkInput={setLinkInput}
        />
      </div>
    </div>
  )
}

// Banner Grid Component
const BannerGrid = ({ 
  banners, 
  onToggleStatus, 
  onToggleSaleStatus,
  onDelete,
  onUpdateLink,
  onDragStart, 
  onDragOver, 
  onDrop, 
  dragIndex,
  operationLoading,
  editingLink,
  setEditingLink,
  linkInput,
  setLinkInput
}) => {
  if (banners.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Image className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No banners found</h3>
          <p className="text-sm text-gray-500">Upload your first banner to get started</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence>
        {banners.map((banner, index) => (
          <motion.div
            key={banner._id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, index)}
            className={`relative group cursor-move ${
              dragIndex === index ? 'opacity-50' : ''
            }`}
          >
            <Card className="overflow-hidden">
              <div className="relative">
                <img
                  src={banner.image.url}
                  alt={`Banner ${banner.order}`}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 left-2 flex gap-2">
                  <Badge variant={banner.isActive ? 'default' : 'secondary'}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant={banner.saleActive ? 'destructive' : 'secondary'} className={banner.saleActive ? 'bg-orange-500 hover:bg-orange-600' : ''}>
                    {banner.saleActive ? 'Sale Active' : 'Sale Inactive'}
                  </Badge>
                  <Badge variant="outline">
                    Order: {banner.order}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-4 w-4 text-white bg-black/50 rounded p-1" />
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">
                    {banner.isActive ? '✅ Visible on website' : '❌ Hidden from website'}
                  </div>
                  {banner.link && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <LinkIcon className="h-3 w-3" />
                      <a href={banner.link} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                        {banner.link}
                      </a>
                    </div>
                  )}
                  {editingLink === banner._id ? (
                    <div className="space-y-2">
                      <Input
                        type="url"
                        placeholder="https://example.com or /products"
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        className="text-xs"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onUpdateLink(banner._id, linkInput)}
                          disabled={operationLoading[banner._id]}
                          className="flex-1 text-xs"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingLink(null)
                            setLinkInput('')
                          }}
                          className="flex-1 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingLink(banner._id)
                          setLinkInput(banner.link || '')
                        }}
                        className="text-xs gap-1"
                      >
                        <LinkIcon className="h-3 w-3" />
                        {banner.link ? 'Edit Link' : 'Add Link'}
                      </Button>
                      <div className="flex items-center justify-end">
                    <div className="flex gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onToggleStatus(banner._id)}
                        disabled={operationLoading[banner._id]}
                        className="h-8 w-8 p-0"
                        title={banner.isActive ? 'Deactivate Banner' : 'Activate Banner'}
                      >
                        {operationLoading[banner._id] ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : banner.isActive ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <span className="text-xs text-gray-500">Active</span>
                    </div>
                    
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        size="sm"
                        variant={banner.saleActive ? "default" : "outline"}
                        onClick={() => onToggleSaleStatus(banner._id)}
                        disabled={operationLoading[banner._id]}
                        className={`px-3 py-1 text-xs ${banner.saleActive ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-gray-600 hover:text-gray-700'}`}
                        title={banner.saleActive ? 'Disable Sale' : 'Enable Sale'}
                      >
                        {operationLoading[banner._id] ? (
                          <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                        ) : null}
                        {banner.saleActive ? 'Sale ON' : 'Sale OFF'}
                      </Button>
                      <span className="text-xs text-gray-500">Sale</span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={operationLoading[banner._id]}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          {operationLoading[banner._id] ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Banner</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this banner? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(banner._id)}
                            disabled={operationLoading[banner._id]}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {operationLoading[banner._id] ? (
                              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    </div>
                  </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default BannerManagement
