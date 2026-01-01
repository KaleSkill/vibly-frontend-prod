import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  RefreshCw,
  Search,
  Filter,
  Tag,
  Calendar,
  Percent,
  DollarSign,
  Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { adminApi } from '@/api/api'
import { X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [operationLoading, setOperationLoading] = useState({})
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minPurchaseAmount: 0,
    maxDiscountAmount: null,
    startDate: '',
    endDate: '',
    usageLimit: null,
    applicableTo: 'all',
    categoryIds: [],
    productIds: [],
    isActive: true
  })

  // Fetch coupons
  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const response = await adminApi.coupons.getCoupons(statusFilter)
      setCoupons(response.data.data || [])
    } catch (error) {
      toast.error('Failed to fetch coupons')
      console.error('Error fetching coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [statusFilter])

  // Fetch categories when applicableTo changes to 'category'
  useEffect(() => {
    if (formData.applicableTo === 'category') {
      fetchCategories()
    }
  }, [formData.applicableTo])

  // Fetch products when applicableTo changes to 'product'
  useEffect(() => {
    if (formData.applicableTo === 'product') {
      fetchProducts()
    }
  }, [formData.applicableTo])

  // Fetch categories
  const fetchCategories = async () => {
    setLoadingCategories(true)
    try {
      const response = await adminApi.categories.getCategories('all', 'true')
      setCategories(response.data.data || [])
    } catch (error) {
      toast.error('Failed to fetch categories')
      console.error('Error fetching categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  // Fetch products
  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const response = await adminApi.products.getProducts({ isActive: 'true', limit: 1000 })
      setProducts(response.data.data?.products || [])
    } catch (error) {
      toast.error('Failed to fetch products')
      console.error('Error fetching products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  // Filter products based on search
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  )

  // Get product image
  const getProductImage = (product) => {
    if (product.variants && product.variants.length > 0) {
      return product.variants[0]?.orderImage?.secure_url || 
             product.variants[0]?.images?.[0]?.secure_url || 
             '/placeholder-product.jpg'
    }
    return '/placeholder-product.jpg'
  }

  // Handle category selection
  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => {
      const currentIds = prev.categoryIds || []
      const isSelected = currentIds.includes(categoryId)
      return {
        ...prev,
        categoryIds: isSelected
          ? currentIds.filter(id => id !== categoryId)
          : [...currentIds, categoryId]
      }
    })
  }

  // Handle product selection
  const handleProductToggle = (productId) => {
    setFormData(prev => {
      const currentIds = prev.productIds || []
      const isSelected = currentIds.includes(productId)
      return {
        ...prev,
        productIds: isSelected
          ? currentIds.filter(id => id !== productId)
          : [...currentIds, productId]
      }
    })
  }

  // Create coupon
  const createCoupon = async () => {
    if (!formData.code.trim()) {
      toast.error('Please enter a coupon code')
      return
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates')
      return
    }
    if (formData.discountValue <= 0) {
      toast.error('Please enter a valid discount value')
      return
    }

    try {
      const couponData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minPurchaseAmount: parseFloat(formData.minPurchaseAmount) || 0,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      }
      await adminApi.coupons.createCoupon(couponData)
      toast.success('Coupon created successfully')
      setIsCreateDialogOpen(false)
      resetForm()
      fetchCoupons()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create coupon')
      console.error('Error creating coupon:', error)
    }
  }

  // Update coupon
  const updateCoupon = async () => {
    if (!formData.code.trim()) {
      toast.error('Please enter a coupon code')
      return
    }

    try {
      const couponData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minPurchaseAmount: parseFloat(formData.minPurchaseAmount) || 0,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      }
      await adminApi.coupons.updateCoupon(editingCoupon._id, couponData)
      toast.success('Coupon updated successfully')
      setIsEditDialogOpen(false)
      resetForm()
      fetchCoupons()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update coupon')
      console.error('Error updating coupon:', error)
    }
  }

  // Delete coupon
  const deleteCoupon = async (couponId) => {
    setOperationLoading({ ...operationLoading, [couponId]: true })
    try {
      await adminApi.coupons.deleteCoupon(couponId)
      toast.success('Coupon deleted successfully')
      fetchCoupons()
    } catch (error) {
      toast.error('Failed to delete coupon')
      console.error('Error deleting coupon:', error)
    } finally {
      setOperationLoading({ ...operationLoading, [couponId]: false })
    }
  }

  // Toggle coupon status
  const toggleCouponStatus = async (couponId) => {
    setOperationLoading({ ...operationLoading, [couponId]: true })
    try {
      await adminApi.coupons.toggleCouponStatus(couponId)
      toast.success('Coupon status updated')
      fetchCoupons()
    } catch (error) {
      toast.error('Failed to toggle coupon status')
      console.error('Error toggling coupon status:', error)
    } finally {
      setOperationLoading({ ...operationLoading, [couponId]: false })
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minPurchaseAmount: 0,
      maxDiscountAmount: null,
      startDate: '',
      endDate: '',
      usageLimit: null,
      applicableTo: 'all',
      categoryIds: [],
      productIds: [],
      isActive: true
    })
    setEditingCoupon(null)
  }

  // Open edit dialog
  const openEditDialog = async (coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchaseAmount: coupon.minPurchaseAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || null,
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString() : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString() : '',
      usageLimit: coupon.usageLimit || null,
      applicableTo: coupon.applicableTo || 'all',
      categoryIds: coupon.categoryIds?.map(id => id._id || id) || [],
      productIds: coupon.productIds?.map(id => id._id || id) || [],
      isActive: coupon.isActive
    })
    
    // Fetch categories/products if needed
    if (coupon.applicableTo === 'category') {
      await fetchCategories()
    } else if (coupon.applicableTo === 'product') {
      await fetchProducts()
    }
    
    setIsEditDialogOpen(true)
  }

  // Check if coupon is valid
  const isCouponValid = (coupon) => {
    const now = new Date()
    return (
      coupon.isActive &&
      now >= new Date(coupon.startDate) &&
      now <= new Date(coupon.endDate) &&
      (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit)
    )
  }

  // Filter coupons
  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (coupon.description && coupon.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Coupon Management
              </CardTitle>
              <CardDescription>
                Create and manage discount coupons
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Coupon
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Coupon</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new discount coupon
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Coupon Code *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="SAVE20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discountType">Discount Type *</Label>
                      <Select
                        value={formData.discountType}
                        onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discountValue">
                        Discount Value * ({formData.discountType === 'percentage' ? '%' : '₹'})
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        min="0"
                        max={formData.discountType === 'percentage' ? '100' : undefined}
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minPurchaseAmount">Min Purchase (₹)</Label>
                      <Input
                        id="minPurchaseAmount"
                        type="number"
                        min="0"
                        value={formData.minPurchaseAmount}
                        onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                      />
                    </div>
                  </div>
                  {formData.discountType === 'percentage' && (
                    <div className="space-y-2">
                      <Label htmlFor="maxDiscountAmount">Max Discount (₹)</Label>
                      <Input
                        id="maxDiscountAmount"
                        type="number"
                        min="0"
                        value={formData.maxDiscountAmount || ''}
                        onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value || null })}
                        placeholder="Optional"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={formData.startDate ? new Date(formData.startDate).toISOString().slice(0, 16) : ''}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          // Convert to ISO string for backend
                          const isoDate = dateValue ? new Date(dateValue).toISOString() : '';
                          setFormData({ ...formData, startDate: isoDate });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={formData.endDate ? new Date(formData.endDate).toISOString().slice(0, 16) : ''}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          // Convert to ISO string for backend
                          const isoDate = dateValue ? new Date(dateValue).toISOString() : '';
                          setFormData({ ...formData, endDate: isoDate });
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usageLimit">Usage Limit</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      min="1"
                      value={formData.usageLimit || ''}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value || null })}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicableTo">Applicable To</Label>
                    <Select
                      value={formData.applicableTo}
                      onValueChange={(value) => {
                        setFormData({ 
                          ...formData, 
                          applicableTo: value,
                          categoryIds: value !== 'category' ? [] : formData.categoryIds,
                          productIds: value !== 'product' ? [] : formData.productIds
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        <SelectItem value="category">Specific Categories</SelectItem>
                        <SelectItem value="product">Specific Products</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Selection */}
                  {formData.applicableTo === 'category' && (
                    <div className="space-y-2">
                      <Label>Select Categories</Label>
                      {loadingCategories ? (
                        <div className="text-sm text-muted-foreground">Loading categories...</div>
                      ) : (
                        <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                          {categories.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No active categories found</div>
                          ) : (
                            <div className="space-y-2">
                              {categories.map((category) => (
                                <div key={category._id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`category-${category._id}`}
                                    checked={formData.categoryIds?.includes(category._id)}
                                    onCheckedChange={() => handleCategoryToggle(category._id)}
                                  />
                                  <Label
                                    htmlFor={`category-${category._id}`}
                                    className="text-sm font-normal cursor-pointer flex-1"
                                  >
                                    {category.name} {category.gender && `(${category.gender})`}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {formData.categoryIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.categoryIds.map((catId) => {
                            const category = categories.find(c => c._id === catId)
                            return category ? (
                              <Badge key={catId} variant="secondary" className="flex items-center gap-1">
                                {category.name}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => handleCategoryToggle(catId)}
                                />
                              </Badge>
                            ) : null
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Product Selection */}
                  {formData.applicableTo === 'product' && (
                    <div className="space-y-2">
                      <Label>Select Products</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (!products.length) {
                              fetchProducts()
                            }
                            setIsProductSheetOpen(true)
                          }}
                          className="w-full"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          {formData.productIds.length > 0 
                            ? `${formData.productIds.length} Product(s) Selected`
                            : 'Select Products'
                          }
                        </Button>
                      </div>
                      {formData.productIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.productIds.map((prodId) => {
                            const product = products.find(p => p._id === prodId)
                            return product ? (
                              <Badge key={prodId} variant="secondary" className="flex items-center gap-1">
                                {product.name}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => handleProductToggle(prodId)}
                                />
                              </Badge>
                            ) : null
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createCoupon}>Create Coupon</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search coupons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchCoupons}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No coupons found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min Purchase</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.map((coupon) => (
                  <TableRow key={coupon._id}>
                    <TableCell className="font-medium">{coupon.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {coupon.discountType === 'percentage' ? (
                          <Percent className="h-3 w-3 mr-1" />
                        ) : (
                          <DollarSign className="h-3 w-3 mr-1" />
                        )}
                        {coupon.discountType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {coupon.discountType === 'percentage' 
                        ? `${coupon.discountValue}%`
                        : `₹${coupon.discountValue}`
                      }
                    </TableCell>
                    <TableCell>₹{coupon.minPurchaseAmount || 0}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(coupon.startDate).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          to {new Date(coupon.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {coupon.usageLimit 
                        ? `${coupon.usedCount || 0} / ${coupon.usageLimit}`
                        : `${coupon.usedCount || 0} / ∞`
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={isCouponValid(coupon) ? "default" : "secondary"}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(coupon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleCouponStatus(coupon._id)}
                          disabled={operationLoading[coupon._id]}
                        >
                          {coupon.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete coupon "{coupon.code}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCoupon(coupon._id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>
              Update coupon details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Coupon Code *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-discountType">Discount Type *</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-discountValue">
                  Discount Value * ({formData.discountType === 'percentage' ? '%' : '₹'})
                </Label>
                <Input
                  id="edit-discountValue"
                  type="number"
                  min="0"
                  max={formData.discountType === 'percentage' ? '100' : undefined}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-minPurchaseAmount">Min Purchase (₹)</Label>
                <Input
                  id="edit-minPurchaseAmount"
                  type="number"
                  min="0"
                  value={formData.minPurchaseAmount}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                />
              </div>
            </div>
            {formData.discountType === 'percentage' && (
              <div className="space-y-2">
                <Label htmlFor="edit-maxDiscountAmount">Max Discount (₹)</Label>
                <Input
                  id="edit-maxDiscountAmount"
                  type="number"
                  min="0"
                  value={formData.maxDiscountAmount || ''}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value || null })}
                  placeholder="Optional"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date *</Label>
                <Input
                  id="edit-startDate"
                  type="datetime-local"
                  value={formData.startDate ? new Date(formData.startDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    const isoDate = dateValue ? new Date(dateValue).toISOString() : '';
                    setFormData({ ...formData, startDate: isoDate });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date *</Label>
                <Input
                  id="edit-endDate"
                  type="datetime-local"
                  value={formData.endDate ? new Date(formData.endDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    const isoDate = dateValue ? new Date(dateValue).toISOString() : '';
                    setFormData({ ...formData, endDate: isoDate });
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-usageLimit">Usage Limit</Label>
              <Input
                id="edit-usageLimit"
                type="number"
                min="1"
                value={formData.usageLimit || ''}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value || null })}
                placeholder="Leave empty for unlimited"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-applicableTo">Applicable To</Label>
              <Select
                value={formData.applicableTo}
                onValueChange={(value) => {
                  setFormData({ 
                    ...formData, 
                    applicableTo: value,
                    categoryIds: value !== 'category' ? [] : formData.categoryIds,
                    productIds: value !== 'product' ? [] : formData.productIds
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="category">Specific Categories</SelectItem>
                  <SelectItem value="product">Specific Products</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Selection - Edit */}
            {formData.applicableTo === 'category' && (
              <div className="space-y-2">
                <Label>Select Categories</Label>
                {loadingCategories ? (
                  <div className="text-sm text-muted-foreground">Loading categories...</div>
                ) : (
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                    {categories.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No active categories found</div>
                    ) : (
                      <div className="space-y-2">
                        {categories.map((category) => (
                          <div key={category._id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-category-${category._id}`}
                              checked={formData.categoryIds?.includes(category._id)}
                              onCheckedChange={() => handleCategoryToggle(category._id)}
                            />
                            <Label
                              htmlFor={`edit-category-${category._id}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {category.name} {category.gender && `(${category.gender})`}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {formData.categoryIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.categoryIds.map((catId) => {
                      const category = categories.find(c => c._id === catId)
                      return category ? (
                        <Badge key={catId} variant="secondary" className="flex items-center gap-1">
                          {category.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleCategoryToggle(catId)}
                          />
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Product Selection - Edit */}
            {formData.applicableTo === 'product' && (
              <div className="space-y-2">
                <Label>Select Products</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!products.length) {
                        fetchProducts()
                      }
                      setIsProductSheetOpen(true)
                    }}
                    className="w-full"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {formData.productIds.length > 0 
                      ? `${formData.productIds.length} Product(s) Selected`
                      : 'Select Products'
                    }
                  </Button>
                </div>
                {formData.productIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.productIds.map((prodId) => {
                      const product = products.find(p => p._id === prodId)
                      return product ? (
                        <Badge key={prodId} variant="secondary" className="flex items-center gap-1">
                          {product.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleProductToggle(prodId)}
                          />
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateCoupon}>Update Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Selection Sheet */}
      <Sheet open={isProductSheetOpen} onOpenChange={(open) => {
        setIsProductSheetOpen(open)
        if (open && !products.length) {
          fetchProducts()
        }
        if (!open) {
          setProductSearchTerm('')
        }
      }}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Select Products</SheetTitle>
            <SheetDescription>
              Search and select products for this coupon. Selected: {formData.productIds.length}
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Products Grid */}
            {loadingProducts ? (
              <div className="text-center py-8 text-muted-foreground">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {productSearchTerm ? 'No products found matching your search' : 'No active products found'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                {filteredProducts.map((product) => {
                  const isSelected = formData.productIds?.includes(product._id)
                  return (
                    <div
                      key={product._id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all hover:border-primary ${
                        isSelected ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleProductToggle(product._id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = '/placeholder-product.jpg'
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-2">{product.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {product.variants?.length || 0} variant(s)
                              </p>
                              <p className="text-xs font-medium mt-1">
                                ₹{product.nonSalePrice?.price || product.nonSalePrice || 'N/A'}
                              </p>
                            </div>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleProductToggle(product._id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {formData.productIds.length} product(s) selected
            </div>
            <Button onClick={() => setIsProductSheetOpen(false)}>
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default CouponManagement

