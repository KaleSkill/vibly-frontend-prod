import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/api/api';
import { toast } from 'sonner';
import { Package, CreditCard, MapPin, Calendar, User, Phone, Mail, Settings } from 'lucide-react';
import { getStatusColor } from '@/utils/orderStatus';

export const OrderDetailsModal = ({ order, onClose, onUpdateStatus }) => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (order) {
      fetchOrderDetails();
    }
  }, [order]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await adminApi.newOrders.getOrderItemsByOrderId(order.orderId);

      if (response.data.success) {
        setOrderDetails(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    return getStatusColor(status);
  };

  const getPaymentStatusBadgeColor = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PAID': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800',
      'REFUNDED': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!order) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Details - {order.orderId}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading order details...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Order Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {new Date(order.orderedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="text-sm">
                        {order.totalItems} items
                      </span>
                    </div>
                    <Badge className={getStatusBadgeColor(orderDetails?.overallStatus || 'Ordered')}>
                      {orderDetails?.overallStatus || 'Ordered'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm">{order.paymentMethod}</span>
                    </div>
                    <Badge className={getPaymentStatusBadgeColor(order.paymentStatus)}>
                      {order.paymentStatus}
                    </Badge>
                    {order.transactionId && (
                      <div className="text-xs text-muted-foreground">
                        TXN: {order.transactionId}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{order.user?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{order.user?.email}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">{order.shippingInfo.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.shippingInfo.city}, {order.shippingInfo.state} - {order.shippingInfo.postalCode}
                    </p>
                    <p className="text-sm text-muted-foreground">{order.shippingInfo.country}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{order.shippingInfo.phone}</span>
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
                  {orderDetails?.products?.map((product, index) => (

                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={product.image?.secure_url || '/placeholder-product.jpg'}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Color: {product.color?.name} | Size: {product.size}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {product.quantity} | Price: ₹{product.amount}
                          </p>
                          <p className="font-medium">
                            Total: ₹{formatPrice(product.amount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusBadgeColor(product.itemsGroupedByStatus ?
                            Object.keys(product.itemsGroupedByStatus)[0] : 'Ordered')}>
                            {product.itemsGroupedByStatus ?
                              Object.keys(product.itemsGroupedByStatus)[0] : 'Ordered'}
                          </Badge>
                        </div>
                      </div>

                      {/* Item Status Details */}
                      {product.itemsGroupedByStatus && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Status Details:</h4>
                          <div className="space-y-2">
                            {Object.entries(product.itemsGroupedByStatus).map(([status, items]) => (
                              <div key={status} className="flex items-center gap-2">
                                <Badge className={getStatusBadgeColor(status)}>
                                  {status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {items.length} item(s)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status History */}
            {orderDetails?.products && (
              <Card>
                <CardHeader>
                  <CardTitle>Status History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orderDetails.products.map((product, productIndex) => (
                      <div key={productIndex} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">{product.name}</h4>
                        {product.itemsGroupedByStatus && Object.entries(product.itemsGroupedByStatus).map(([status, items]) => (
                          <div key={status} className="mb-3">
                            <Badge className={getStatusBadgeColor(status)}>
                              {status}
                            </Badge>
                            {items.map((item, itemIndex) => (
                              <div key={itemIndex} className="ml-4 mt-2">
                                {item.statusHistory?.map((history, historyIndex) => (
                                  <div key={historyIndex} className="text-sm text-muted-foreground">
                                    <span className="font-medium">{history.status}</span> - {history.note}
                                    <span className="ml-2">
                                      ({new Date(history.changedAt).toLocaleString()})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="flex justify-between gap-2 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Order ID: {order.orderId}
          </div>
          <div className="flex gap-2">
            {onUpdateStatus && (
              <Button
                variant="default"
                onClick={() => {
                  onClose();
                  onUpdateStatus(order);
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Status
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
