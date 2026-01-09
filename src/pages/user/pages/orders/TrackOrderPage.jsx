import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Package, 
  Search,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Calendar,
  CreditCard
} from 'lucide-react';
import { userApi } from '@/api/api';

const TrackOrderPage = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);

  const handleSearch = async () => {
    if (!orderId.trim()) {
      toast.error('Please enter an order ID');
      return;
    }

    try {
      setLoading(true);
      
      // First get order details
      const orderResponse = await userApi.orders.getOrderByOrderId(orderId);
      if (orderResponse.data.success) {
        setOrder(orderResponse.data.data);
        
        // Tracking data functionality removed
        setTrackingData(null);
      } else {
        toast.error('Order not found');
        setOrder(null);
        setTrackingData(null);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to fetch order details');
      setOrder(null);
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'shipped':
      case 'in_transit':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'processing':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped':
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImageUrl = (imageData) => {
    if (!imageData) return '/placeholder-product.jpg';
    if (typeof imageData === 'string') return imageData;
    if (imageData.secure_url) return imageData.secure_url;
    if (imageData.url) return imageData.url;
    return '/placeholder-product.jpg';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">Enter your order ID to track your package</p>
        </div>

        {/* Search Form */}
        <Card className="max-w-2xl mx-auto mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="orderId">Order ID</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="orderId"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Enter your order ID (e.g., ORD123456)"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button 
                    onClick={handleSearch} 
                    disabled={loading}
                    className="gap-2"
                  >
                    <Search className="h-4 w-4" />
                    {loading ? 'Searching...' : 'Track'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order #{order.orderId}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Order Information</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Ordered on {formatDate(order.orderedAt)}
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment: {order.paymentMethod}
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {order.totalItems} {order.totalItems === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Order Status</h4>
                    <Badge className={`${getStatusBadgeColor(order.overallStatus)} text-sm`}>
                      {getStatusIcon(order.overallStatus)}
                      <span className="ml-1">{order.overallStatus}</span>
                    </Badge>
                    <div className="text-2xl font-bold mt-2">₹{order.totalAmount}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tracking Timeline */}
            {trackingData ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Tracking Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Current Status */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <Truck className="h-6 w-6 text-blue-600" />
                        <div>
                          <div className="font-medium text-blue-900">
                            {trackingData.status || 'In Transit'}
                          </div>
                          <div className="text-sm text-blue-700">
                            {trackingData.status_description || 'Your package is on the way'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tracking Timeline */}
                    {trackingData.tracking_data && trackingData.tracking_data.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Tracking Timeline</h4>
                        {trackingData.tracking_data.map((event, index) => (
                          <div key={index} className="flex gap-3 p-3 border rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{event.status}</div>
                              <div className="text-sm text-muted-foreground">
                                {event.status_description}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(event.updated_at)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Courier Information */}
                    {trackingData.courier_name && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Courier Information</h4>
                        <div className="space-y-1 text-sm">
                          <div><strong>Courier:</strong> {trackingData.courier_name}</div>
                          {trackingData.awb_code && (
                            <div><strong>AWB Code:</strong> {trackingData.awb_code}</div>
                          )}
                          {trackingData.expected_delivery_date && (
                            <div><strong>Expected Delivery:</strong> {formatDate(trackingData.expected_delivery_date)}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Tracking Information Not Available</h3>
                  <p className="text-muted-foreground">
                    Tracking information is not yet available for this order. 
                    It will be updated once your order is shipped.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items && order.items.map((item, index) => (
                    <div key={index} className="flex gap-4 p-4 border rounded-lg">
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
                        <h4 className="font-medium">{item.product?.name || 'Product'}</h4>
                        <div className="text-sm text-muted-foreground">
                          Color: {item.color?.name || 'N/A'} • Size: {item.size || 'N/A'}
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">Quantity: {item.quantity}</span>
                          <span className="font-medium">₹{item.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="font-medium">{order.shippingAddress.fullName}</div>
                    <div className="text-muted-foreground">
                      {order.shippingAddress.addressLine1}
                      {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                    </div>
                    <div className="text-muted-foreground">
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                    </div>
                    <div className="text-muted-foreground">
                      {order.shippingAddress.country}
                    </div>
                    {order.shippingAddress.phone && (
                      <div className="text-muted-foreground">
                        Phone: {order.shippingAddress.phone}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* No Order Found */}
        {!order && !loading && orderId && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Order Not Found</h3>
              <p className="text-muted-foreground">
                We couldn't find an order with ID "{orderId}". 
                Please check your order ID and try again.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TrackOrderPage;
