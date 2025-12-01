import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '@/api/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Package, 
  Eye,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Receipt,
  Hash
} from 'lucide-react'
import { getStatusColor } from '@/utils/orderStatus'

const MyOrdersPage = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await userApi.newOrders.getUserOrders()
      if (response.data.success) {
        console.log('Orders data:', response.data.data)
        setOrders(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
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
      month: 'short',
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

  const handleViewOrder = (orderId) => {
    navigate(`/user/orders/${orderId}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Orders</h1>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32" />
                      <div className="h-3 bg-muted rounded w-24" />
                    </div>
                    <div className="h-6 bg-muted rounded w-16" />
                  </div>
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Orders</h1>
        </div>
        
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Button onClick={() => navigate('/products')} className="rounded-full">
              <Package className="h-4 w-4 mr-2" />
              Start Shopping
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
            <h1 className="text-2xl md:text-3xl font-bold">My Orders</h1>
            <p className="text-sm text-muted-foreground">Track and manage your orders</p>
          </div>
          <Badge variant="secondary" className="hidden sm:flex">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </Badge>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id} className="border border-border/50 hover:border-border transition-colors duration-200 shadow-sm hover:shadow-md">
              <CardContent className="p-4 md:p-6">
                {/* Mobile Layout - Vertical Stack */}
                <div className="md:hidden space-y-4">
                  {/* Order Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-base">#{order.orderId}</h3>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(order.orderedAt)}
                      </div>
                    </div>
                    <Badge className={`${getStatusBadgeColor(order.overallStatus)} rounded-full`}>
                      <span className="text-xs">{order.overallStatus}</span>
                    </Badge>
                  </div>

                  {/* Product Images and Info */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium">
                      {order.totalItems} {order.totalItems === 1 ? 'item' : 'items'}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {order.items && order.items.slice(0, 4).map((item, index) => {
                        const itemStatus = item.orderStatus || item.status;
                        return (
                        <div key={index} className="flex-shrink-0 w-16">
                          <div className="relative">
                            <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden mx-auto">
                              <img
                                src={getImageUrl(item.product?.image)}
                                alt={item.product?.name || 'Product'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = '/placeholder-product.jpg';
                                }}
                              />
                            </div>
                          </div>
                            <div className="text-xs text-center mt-1 text-muted-foreground">
                              Qty: {item.quantity}
                            </div>
                          </div>
                        );
                      })}
                      {order.items && order.items.length > 4 && (
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-xs font-medium text-muted-foreground">
                              +{order.items.length - 4}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="space-y-3 pt-2 border-t border-border/50">
                    {/* Payment Info */}
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}
                      </span>
                      {order.transactionId && (
                        <div className="flex items-center gap-1 ml-auto">
                          <Receipt className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                            {order.transactionId.substring(0, 8)}...
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Total Price */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Amount</span>
                      <span className="text-lg font-bold text-primary">₹{formatPrice(order.totalAmount)}</span>
                    </div>

                    {/* View Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrder(order.orderId)}
                      className="w-full rounded-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Order Details
                    </Button>
                  </div>
                </div>

                {/* Desktop Layout - Horizontal */}
                <div className="hidden md:flex gap-6">
                  
                  {/* Order Details */}
                  <div className="flex-1 min-w-0">
                    {/* Order Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold text-lg">#{order.orderId}</h3>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(order.orderedAt)}
                        </div>
                      </div>
                      <Badge className={`${getStatusBadgeColor(order.overallStatus)} rounded-full`}>
                        <span>{order.overallStatus}</span>
                      </Badge>
                    </div>
                    
                    {/* Items and Payment Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      {/* Items Info */}
                      <div>
                        <div className="text-sm font-medium mb-2">
                          {order.totalItems} {order.totalItems === 1 ? 'item' : 'items'}
                        </div>
                        <div className="space-y-2">
                          {order.items && order.items.slice(0, 3).map((item, index) => {
                            const itemStatus = item.orderStatus || item.status;
                            return (
                              <div key={index} className="flex items-center justify-between gap-2">
                                <div className="text-xs text-muted-foreground flex items-center gap-2 flex-1 min-w-0">
                                  <div className="w-4 h-4 bg-muted rounded overflow-hidden flex-shrink-0">
                                    <img
                                      src={getImageUrl(item.product?.image)}
                                      alt={item.product?.name || 'Product'}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.src = '/placeholder-product.jpg';
                                      }}
                                    />
                                  </div>
                                  <span className="truncate">{item.product?.name}</span>
                                  <span className="text-primary font-medium">×{item.quantity}</span>
                                </div>
                              </div>
                            );
                          })}
                          {order.items && order.items.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{order.items.length - 3} more items
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}
                          </span>
                        </div>
                        {order.transactionId && (
                          <div className="flex items-center gap-1 mt-1">
                            <Receipt className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                              {order.transactionId.substring(0, 12)}...
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Total Price */}
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
                        <div className="text-xl font-bold text-primary">₹{formatPrice(order.totalAmount)}</div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOrder(order.orderId)}
                        className="h-9 px-4 rounded-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MyOrdersPage
