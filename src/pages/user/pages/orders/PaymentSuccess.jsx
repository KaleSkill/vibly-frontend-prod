import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userApi } from '@/api/api';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Package, 
  ArrowLeft,
  Eye,
  Calendar,
  CreditCard,
  Truck
} from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCartStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      // Clear cart if no order ID (fallback)
      clearCart();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    console.log('=== PAYMENT SUCCESS PAGE DEBUG START ===');
    console.log('Fetching order details for orderId:', orderId);
    
    try {
      setLoading(true);
      const response = await userApi.orders.getOrderByOrderId(orderId);
      console.log('Order fetch response:', response);
      
      if (response.data.success) {
        console.log('Order found:', response.data.data);
        console.log('=== PAYMENT SUCCESS PAGE DEBUG END (SUCCESS) ===');
        setOrder(response.data.data);
      } else {
        console.log('Order not found or failed to fetch:', response.data);
        console.log('=== PAYMENT SUCCESS PAGE DEBUG END (NOT FOUND) ===');
      }
    } catch (error) {
      console.log('=== PAYMENT SUCCESS PAGE DEBUG END (ERROR) ===');
      console.error('Error fetching order details:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'SHIPPED':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'PROCESSING':
        return <Package className="h-4 w-4 text-yellow-600" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImageUrl = (imageData) => {
    if (!imageData) return '/placeholder-product.jpg';
    if (typeof imageData === 'string') return imageData;
    if (imageData.secure_url) return imageData.secure_url;
    if (imageData.url) return imageData.url;
    return '/placeholder-product.jpg';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Order not found</h1>
          <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/user/orders')} className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground mb-4">
            Thank you for your order. We've received your payment and your order is being processed.
          </p>
          <Badge className={`${getStatusBadgeColor(order.overallStatus)} text-sm rounded-full`}>
            {getStatusIcon(order.overallStatus)}
            <span className="ml-1">{order.overallStatus}</span>
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
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
                    <h4 className="font-medium mb-2">Order Total</h4>
                    <div className="text-2xl font-bold">₹{parseFloat(order.totalAmount).toFixed(2)}</div>
                    {order.paymentAmount && (
                      <div className="text-sm text-muted-foreground">
                        Payment: ₹{parseFloat(order.paymentAmount).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

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
                          <span className="font-medium">₹{parseFloat(item.amount).toFixed(2)}</span>
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
                  <CardTitle>Shipping Address</CardTitle>
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

          {/* Action Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Order Confirmed</div>
                      <div className="text-sm text-muted-foreground">We've received your order</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Package className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium">Processing</div>
                      <div className="text-sm text-muted-foreground">Preparing your order</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Truck className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Shipping</div>
                      <div className="text-sm text-muted-foreground">On its way to you</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate(`/user/orders/${order.orderId}`)}
                    className="w-full gap-2 rounded-full"
                  >
                    <Eye className="h-4 w-4" />
                    View Order Details
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/user/orders')}
                    className="w-full gap-2 rounded-full"
                  >
                    <Package className="h-4 w-4" />
                    All Orders
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/products')}
                    className="w-full gap-2 rounded-full"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
