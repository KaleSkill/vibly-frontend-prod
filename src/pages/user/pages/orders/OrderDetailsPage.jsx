import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { userApi } from '@/api/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Package,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Hash,
  Receipt,
  User,
  Building,
  ShoppingBag,
  X,
  RotateCcw,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import RefundRequestForm from '@/components/ui/RefundRequestForm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getStatusColor, getStatusIcon } from '@/utils/orderStatus'

const OrderDetailsPage = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [cancelLoading, setCancelLoading] = useState(null)
  const [cancelQuantity, setCancelQuantity] = useState({})
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  useEffect(() => {
    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const response = await userApi.newOrders.getOrderByOrderId(orderId)
      if (response.data.success) {
        setOrder(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  // Helper functions
  const canCancelItem = (item) => {
    const itemStatus = item.orderStatus || item.status;
    return itemStatus === 'Ordered' && !item.cancelledAt
  }

  const canRefundItem = (item) => {
    const itemStatus = item.orderStatus || item.status;
    return itemStatus === 'Cancelled' && 
           order?.paymentMethod === 'ONLINE' && 
           !item.refundRequestedAt && 
           !item.refundAmount
  }

  const hasRefundRequest = (item) => {
    return item.refundRequestedAt
  }

  const getRefundStatus = (item) => {
    if (item.refundStatus === 'REFUNDED') return 'refunded'
    if (item.refundStatus === 'REJECTED') return 'rejected'
    if (item.refundRequestedAt) return 'pending'
    return null
  }

  const handleCancelItem = async (itemId, quantity) => {
    try {
      setCancelLoading(itemId)
      const response = await userApi.newOrders.cancelOrderItem(itemId, quantity)
      if (response.data.success) {
        toast.success(`${quantity} item(s) cancelled successfully`)
        fetchOrderDetails() // Refresh order details
        setShowCancelDialog(false)
        setCancelQuantity({})
      } else {
        toast.error(response.data.message || 'Failed to cancel item')
      }
    } catch (error) {
      console.error('Cancel error:', error)
      toast.error(error.response?.data?.message || 'Failed to cancel item')
    } finally {
      setCancelLoading(null)
    }
  }

  const handleCancelClick = (item) => {
    setSelectedItem(item)
    setCancelQuantity({ [item._id]: 1 })
    setShowCancelDialog(true)
  }

  const handleCancelQuantityChange = (itemId, quantity) => {
    setCancelQuantity(prev => ({
      ...prev,
      [itemId]: Math.max(1, Math.min(quantity, selectedItem?.quantity || 1))
    }))
  }

  const handleRefundRequest = (item) => {
    setSelectedItem(item)
    setRefundDialogOpen(true)
  }

  const handleRefundSuccess = () => {
    setRefundDialogOpen(false)
    setSelectedItem(null)
    fetchOrderDetails() // Refresh order details
  }

  const handleRefundCancel = () => {
    setRefundDialogOpen(false)
    setSelectedItem(null)
  }

  // Use utility functions for status display
  const getStatusBadgeColor = (status) => {
    return getStatusColor(status)
  }

  const getPaymentStatusBadgeColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '0.00'
    return parseFloat(price).toFixed(2)
  }

  const getImageUrl = (imageData) => {
    if (!imageData) return '/placeholder-product.jpg'
    if (typeof imageData === 'string') return imageData
    if (imageData.secure_url) return imageData.secure_url
    if (imageData.url) return imageData.url
    return '/placeholder-product.jpg'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Order Details</h1>
        </div>
        <div className="space-y-4">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-32" />
                <div className="h-3 bg-muted rounded w-24" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Order Details</h1>
        </div>
        
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Order not found</h2>
            <p className="text-muted-foreground mb-6">
              The order you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate('/user/orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Order Details</h1>
            <p className="text-sm text-muted-foreground">Track your order status</p>
          </div>
         
        </div>

        {/* Order Status Banner - Mobile */}
        <div className="sm:hidden mb-6">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {getStatusIcon(order.overallStatus)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Order Status</div>
                    <div className="text-xs text-muted-foreground">#{order.orderId}</div>
                  </div>
                </div>
                <Badge className={`${getStatusBadgeColor(order.overallStatus)} rounded-full`}>
                  {order.overallStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Hash className="h-5 w-5" />
                  Order #{order.orderId}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mobile Layout */}
                <div className="md:hidden space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Order Date</div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{formatDate(order.orderedAt)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Total Items</div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{order.totalItems} {order.totalItems === 1 ? 'item' : 'items'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
                    <div className="text-2xl font-bold text-primary">₹{formatPrice(order.totalAmount)}</div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Order Information</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(order.orderedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{order.totalItems} {order.totalItems === 1 ? 'item' : 'items'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Payment Method</div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Total Amount</div>
                    <div className="text-2xl font-bold text-primary">₹{formatPrice(order.totalAmount)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingBag className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items && order.items.map((item, index) => {
                    const itemStatus = item.orderStatus || item.status;
                    return (
                      <div key={index} className="relative border border-border/50 rounded-lg p-4 hover:border-border transition-colors duration-200">
                      {/* Item Status Badge - Right end of container */}
                      {itemStatus && (
                        <Badge 
                          className={`${getStatusColor(itemStatus)} absolute top-2 right-2 text-xs px-2.5 py-1 font-medium z-10 whitespace-nowrap`}
                          title={itemStatus}
                        >
                          {itemStatus}
                        </Badge>
                      )}
                      {/* Mobile Layout */}
                      <div className="md:hidden space-y-3">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={getImageUrl(item.product?.image)}
                              alt={item.product?.name || 'Product'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = '/placeholder-product.jpg';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2">{item.product?.name || 'Product'}</h4>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Color: {item.color?.name || 'N/A'} • Size: {item.size || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-border/50">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Quantity</span>
                            <span className="text-sm font-medium">{item.quantity}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Unit Price</span>
                            <span className="text-sm">₹{formatPrice(item.amount)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Total</span>
                            <span className="text-lg font-bold text-primary">₹{formatPrice(item.amount * item.quantity)}</span>
                          </div>
                        </div>
                        
                        {/* Item Actions - Mobile */}
                        <div className="mt-3 pt-2 border-t border-border/50">
                          <div className="flex gap-2 flex-wrap">
                            {/* Cancel Button */}
                            {canCancelItem(item) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelClick(item)}
                                disabled={cancelLoading === item._id}
                                className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 text-xs rounded-full"
                              >
                                {cancelLoading === item._id ? (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    Cancelling...
                                  </>
                                ) : (
                                  <>
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel Item
                                  </>
                                )}
                              </Button>
                            )}
                            
                            {/* Refund Request Button */}
                            {canRefundItem(item) && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleRefundRequest(item)}
                                className="bg-blue-600 hover:bg-blue-700 text-xs rounded-full"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Request Refund
                              </Button>
                            )}
                            
                            {/* Refund Status */}
                            {getRefundStatus(item) === 'pending' && (
                              <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                                <AlertCircle className="h-3 w-3" />
                                <span>Refund Requested - Under Review</span>
                              </div>
                            )}
                            {getRefundStatus(item) === 'refunded' && (
                              <div className="flex items-center gap-2 px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs">
                                <CheckCircle className="h-3 w-3" />
                                <span>Refund Processed</span>
                              </div>
                            )}
                            {getRefundStatus(item) === 'rejected' && (
                              <div className="flex items-center gap-2 px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs">
                                <XCircle className="h-3 w-3" />
                                <span>Refund Rejected</span>
                              </div>
                            )}
                            
                            {/* Cancelled Status */}
                            {itemStatus === 'Cancelled' && !canRefundItem(item) && !getRefundStatus(item) && (
                              <div className="flex items-center gap-2 px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs">
                                <XCircle className="h-3 w-3" />
                                <span>Cancelled</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:flex gap-4">
                        <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={getImageUrl(item.product?.image)}
                            alt={item.product?.name || 'Product'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = '/placeholder-product.jpg';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-medium text-lg">{item.product?.name || 'Product'}</h4>
                          </div>
                          <div className="text-sm text-muted-foreground mb-3">
                            Color: {item.color?.name || 'N/A'} • Size: {item.size || 'N/A'}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div>
                                <span className="text-sm text-muted-foreground">Quantity</span>
                                <div className="font-medium">{item.quantity}</div>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">Unit Price</span>
                                <div className="font-medium">₹{formatPrice(item.amount)}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm text-muted-foreground">Total</span>
                              <div className="text-xl font-bold text-primary">₹{formatPrice(item.amount * item.quantity)}</div>
                            </div>
                          </div>
                          
                          {/* Item Actions */}
                          <div className="mt-4 pt-3 border-t border-border/50">
                            <div className="flex gap-2 flex-wrap">
                              {/* Cancel Button */}
                              {canCancelItem(item) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelClick(item)}
                                  disabled={cancelLoading === item._id}
                                  className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 rounded-full"
                                >
                                  {cancelLoading === item._id ? (
                                    <>
                                      <Clock className="h-4 w-4 mr-1" />
                                      Cancelling...
                                    </>
                                  ) : (
                                    <>
                                      <X className="h-4 w-4 mr-1" />
                                      Cancel Item
                                    </>
                                  )}
                                </Button>
                              )}
                              
                              {/* Refund Request Button */}
                              {canRefundItem(item) && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleRefundRequest(item)}
                                  className="bg-blue-600 hover:bg-blue-700 rounded-full"
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Request Refund
                                </Button>
                              )}
                              
                              {/* Refund Status */}
                              {getRefundStatus(item) === 'pending' && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm">
                                  <AlertCircle className="h-4 w-4" />
                                  <span>Refund Requested - Under Review</span>
                                </div>
                              )}
                              {getRefundStatus(item) === 'refunded' && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-md text-sm">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Refund Processed</span>
                                </div>
                              )}
                              {getRefundStatus(item) === 'rejected' && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm">
                                  <XCircle className="h-4 w-4" />
                                  <span>Refund Rejected</span>
                                </div>
                              )}
                              
                              {/* Cancelled Status */}
                              {itemStatus === 'Cancelled' && !canRefundItem(item) && !getRefundStatus(item) && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm">
                                  <XCircle className="h-4 w-4" />
                                  <span>Cancelled</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Shipping Address */}
            {order.shippingAddress && (
              <Card className="border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">{order.shippingAddress.fullName}</div>
                        {order.shippingAddress.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Phone className="h-3 w-3" />
                            {order.shippingAddress.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <div>{order.shippingAddress.addressLine1}</div>
                        {order.shippingAddress.addressLine2 && (
                          <div>{order.shippingAddress.addressLine2}</div>
                        )}
                        <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</div>
                        <div>{order.shippingAddress.country}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Payment Method</div>
                    <div className="font-medium">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}</div>
                  </div>
                  
                  {order.paymentProvider && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Payment Provider</div>
                      <div className="font-medium capitalize">{order.paymentProvider}</div>
                    </div>
                  )}
                  
                  {order.transactionId && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Transaction ID</div>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {order.transactionId}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Payment Status</div>
                    <Badge className={`${getPaymentStatusBadgeColor(order.paymentStatus)} rounded-full`}>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Order Placed</div>
                      <div className="text-xs text-muted-foreground">{formatDate(order.orderedAt)}</div>
                    </div>
                  </div>
                  
                  {order.overallStatus === 'PROCESSING' && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Processing</div>
                        <div className="text-xs text-muted-foreground">Your order is being prepared</div>
                      </div>
                    </div>
                  )}
                  
                  {order.overallStatus === 'SHIPPED' && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Truck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Shipped</div>
                        <div className="text-xs text-muted-foreground">Your order is on the way</div>
                      </div>
                    </div>
                  )}
                  
                  {order.overallStatus === 'DELIVERED' && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Delivered</div>
                        <div className="text-xs text-muted-foreground">Your order has been delivered</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Item Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Item</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={getImageUrl(selectedItem.product?.image)}
                    alt={selectedItem.product?.name || 'Product'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/placeholder-product.jpg';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{selectedItem.product?.name || 'Product'}</h4>
                  <div className="text-xs text-muted-foreground mt-1">
                    Color: {selectedItem.color?.name || 'N/A'} • Size: {selectedItem.size || 'N/A'}
                  </div>
                  <div className="text-sm font-medium mt-2">
                    Available Quantity: {selectedItem.quantity}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity to Cancel</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelQuantityChange(selectedItem._id, (cancelQuantity[selectedItem._id] || 1) - 1)}
                    disabled={(cancelQuantity[selectedItem._id] || 1) <= 1}
                    className="h-8 w-8 p-0"
                  >
                    -
                  </Button>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem.quantity}
                    value={cancelQuantity[selectedItem._id] || 1}
                    onChange={(e) => handleCancelQuantityChange(selectedItem._id, parseInt(e.target.value) || 1)}
                    className="w-20 h-8 text-center border border-input rounded-md"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelQuantityChange(selectedItem._id, (cancelQuantity[selectedItem._id] || 1) + 1)}
                    disabled={(cancelQuantity[selectedItem._id] || 1) >= selectedItem.quantity}
                    className="h-8 w-8 p-0"
                  >
                    +
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Total refund amount: ₹{formatPrice(selectedItem.amount * (cancelQuantity[selectedItem._id] || 1))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleCancelItem(selectedItem._id, cancelQuantity[selectedItem._id] || 1)}
                  disabled={cancelLoading === selectedItem._id}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {cancelLoading === selectedItem._id ? (
                    <>
                      <Clock className="h-4 w-4 mr-1" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Cancel Item
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Request Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Refund</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <RefundRequestForm
              orderId={orderId}
              itemId={selectedItem._id}
              item={selectedItem}
              onSuccess={handleRefundSuccess}
              onCancel={handleRefundCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OrderDetailsPage
