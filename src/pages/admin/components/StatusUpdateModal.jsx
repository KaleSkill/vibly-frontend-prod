import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/api/api';
import { toast } from 'sonner';
import { Package, CheckCircle, X, Loader2 } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '@/utils/orderStatus';

/**
 * StatusUpdateModal Component
 * 
 * This component allows admins to manually update order item statuses.
 * 
 * IMPORTANT: Status transitions are fetched from the backend API and follow
 * the OrderStatus model defined in backend/src/models/newOrder.model.js
 * 
 * Status Flow (Forward Only):
 * - Ordered → Cancelled | Shipped
 * - Shipped → Delivered
 * - Delivered → Return Requested
 * - Cancelled → Refunded
 * - Return Requested → Departed For Returning | Return Cancelled
 * - Departed For Returning → Returned | Return Cancelled
 * - Returned → Refunded
 * - Return Cancelled → [] (Final)
 * - Refunded → [] (Final)
 * 
 * The backend enforces forward-only transitions to maintain data integrity.
 */
export const StatusUpdateModal = ({ order, onClose, onUpdate }) => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [availableTransitions, setAvailableTransitions] = useState([]);
  const [loadingTransitions, setLoadingTransitions] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const [formData, setFormData] = useState({
    quantity: 1,
    status: '',
    note: ''
  });

  // Fetch order details when modal opens
  useEffect(() => {
    if (order) {
      fetchOrderDetails();
    }
  }, [order]);

  // Fetch order items
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await adminApi.newOrders.getOrderItemsByOrderId(order.orderId);
      
      if (response.data.success) {
        setOrderDetails(response.data.data);
      } else {
        toast.error('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  // Handle item selection
  const handleItemSelect = async (itemId) => {
    setSelectedItemId(itemId);
    setFormData({ quantity: 1, status: '', note: '' });
    
    // Find the selected item from order details
    const item = findItemById(itemId);
    if (!item) {
      toast.error('Item not found');
      return;
    }
    
    setSelectedItem(item);
    
    // Fetch available transitions from backend
    await fetchAvailableTransitions(itemId);
  };

  // Fetch available status transitions from backend
  const fetchAvailableTransitions = async (itemId) => {
    try {
      setLoadingTransitions(true);
      const response = await adminApi.newOrders.getAvailableStatusTransitions(itemId);
      
      if (response.data.success) {
        setAvailableTransitions(response.data.data.availableTransitions || []);
        console.log('Available transitions:', response.data.data);
      } else {
        toast.error('Failed to fetch available transitions');
        setAvailableTransitions([]);
      }
    } catch (error) {
      console.error('Error fetching transitions:', error);
      toast.error('Failed to fetch available transitions');
      setAvailableTransitions([]);
    } finally {
      setLoadingTransitions(false);
    }
  };

  // Find item by ID in order details
  const findItemById = (itemId) => {
    if (!orderDetails?.products) return null;
    
    for (const product of orderDetails.products) {
      if (product.itemsGroupedByStatus) {
        for (const [status, items] of Object.entries(product.itemsGroupedByStatus)) {
          const item = items.find(i => {
            const id = i._id?.toString() || i._id;
            return id === itemId.toString();
          });
          
          if (item) {
            return {
              ...item,
              productName: product.name,
              productImage: product.image,
              productColor: product.color,
              productSize: product.size,
              currentStatus: status
            };
          }
        }
      }
    }
    return null;
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedItemId || !formData.status || !formData.quantity) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formData.quantity > selectedItem.quantity) {
      toast.error(`Quantity cannot exceed ${selectedItem.quantity}`);
      return;
    }

    try {
      setUpdating(true);
      
      const updatePayload = {
        status: formData.status,
        quantity: parseInt(formData.quantity),
        ...(formData.note && { note: formData.note })
      };

      const response = await adminApi.newOrders.updateOrderItemStatus(selectedItemId, updatePayload);

      if (response.data.success) {
        toast.success('Order status updated successfully');
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update order status';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  // Format price
  const formatPrice = (amount) => {
    if (typeof amount === 'number') return amount.toFixed(2);
    if (amount?.totalAmount) return amount.totalAmount.toFixed(2);
    if (amount?.price) return amount.price.toFixed(2);
    return '0.00';
  };

  // Get image URL
  const getImageUrl = (imageData) => {
    if (!imageData) return '/placeholder-product.jpg';
    if (typeof imageData === 'string') return imageData;
    if (imageData.secure_url) return imageData.secure_url;
    if (imageData.url) return imageData.url;
    return '/placeholder-product.jpg';
  };

  if (!order) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Manual Status Update - {order.orderId}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Customer: {order.user?.name || 'N/A'} | Payment: {order.paymentMethod} ({order.paymentStatus})
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading order details...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Items Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Item to Update</CardTitle>
                <p className="text-sm text-muted-foreground">Click on an item below to update its status</p>
              </CardHeader>
              <CardContent>
                {orderDetails?.products && orderDetails.products.length > 0 ? (
                  <div className="space-y-4">
                    {orderDetails.products.map((product, productIndex) => (
                      <div key={productIndex} className="border rounded-lg p-4">
                        {/* Product Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <img
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded border"
                            onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Color: {product.color?.name || 'N/A'} | Size: {product.size || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Items Grouped by Status */}
                        {product.itemsGroupedByStatus && Object.keys(product.itemsGroupedByStatus).length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(product.itemsGroupedByStatus).map(([status, items]) => (
                              <div key={status} className="space-y-2">
                                <Badge className={getStatusColor(status)}>
                                  {getStatusIcon(status)} {status}
                                </Badge>
                                <div className="space-y-2">
                                  {items.map((item, itemIndex) => {
                                    const itemId = item._id?.toString() || item._id;
                                    const isSelected = selectedItemId === itemId;
                                    
                                    return (
                                      <div
                                        key={itemIndex}
                                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                          isSelected 
                                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                            : 'border-border hover:bg-muted/50'
                                        }`}
                                        onClick={() => handleItemSelect(itemId)}
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <p className="text-sm font-medium">Qty: {item.quantity}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              ₹{formatPrice(item.amount)}
                                            </p>
                                            {item.size && (
                                              <p className="text-xs text-muted-foreground">
                                                Size: {item.size} | Color: {item.color?.name || 'N/A'}
                                              </p>
                                            )}
                                          </div>
                                          {isSelected && (
                                            <CheckCircle className="h-4 w-4 text-primary" />
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No items found for this product
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No items found in this order</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Update Form */}
            {selectedItem && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle>Update Status</CardTitle>
                  <div className="flex items-center gap-4 p-3 bg-white rounded-lg border mt-2">
                    <img
                      src={getImageUrl(selectedItem.productImage)}
                      alt={selectedItem.productName}
                      className="w-16 h-16 object-cover rounded border"
                      onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{selectedItem.productName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Color: {selectedItem.productColor?.name || selectedItem.color?.name || 'N/A'} |
                        Size: {selectedItem.productSize || selectedItem.size || 'N/A'} |
                        Qty: {selectedItem.quantity}
                      </p>
                      <p className="text-sm font-medium text-green-600 mt-1">
                        ₹{formatPrice(selectedItem.amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Current Status:</p>
                      <Badge className={getStatusColor(selectedItem.currentStatus)}>
                        {getStatusIcon(selectedItem.currentStatus)} {selectedItem.currentStatus}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Available Transitions */}
                  {loadingTransitions ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading available transitions...
                    </div>
                  ) : availableTransitions.length > 0 ? (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="font-medium mb-3">Available Next Statuses (Forward Only):</h4>
                      <div className="flex flex-wrap gap-2">
                        {availableTransitions.map((transition) => (
                          <Button
                            key={transition.value}
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, status: transition.value }))}
                            className={formData.status === transition.value ? 'border-primary bg-primary/10' : ''}
                          >
                            {getStatusIcon(transition.value)} {transition.label || transition.value}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        No further status changes available (Final status reached)
                      </p>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={selectedItem.quantity}
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum: {selectedItem.quantity}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="status">New Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select new status" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTransitions.map((transition) => (
                            <SelectItem key={transition.value} value={transition.value}>
                              <div className="flex items-center gap-2">
                                <span>{getStatusIcon(transition.value)}</span>
                                <span>{transition.label || transition.value}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="note">Note (Optional)</Label>
                    <Textarea
                      id="note"
                      placeholder="Add a note for this status change..."
                      value={formData.note}
                      onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleStatusUpdate}
                      disabled={updating || !formData.status || !formData.quantity}
                      className="flex items-center gap-2"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Update Status
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={onClose} disabled={updating}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Item Selected Message */}
            {!selectedItem && (
              <Card className="border-dashed border-2 border-muted-foreground/25">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No Item Selected</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Click on any item above to select it and update its status.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
