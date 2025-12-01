import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { adminApi, authApi } from '@/api/api';
import { toast } from 'sonner';
import {
  Search,
  Eye,
  Filter,
  RefreshCw,
  Package,
  CreditCard,
  Truck,
  MoreHorizontal,
  Settings,
  ShoppingCart
} from 'lucide-react';
import { StatusUpdateModal } from './StatusUpdateModal';
import { getStatusColor } from '@/utils/orderStatus';

export const OrderManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusSummary, setStatusSummary] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    search: ''
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.status && { status: filters.status }),
        ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus })
      });

      const response = await adminApi.newOrders.getAllOrders(params.toString());
      console.log("order seeeee", response.data.data)

      if (response.data.success) {
        setOrders(response.data.data);
        setTotalPages(response.data.totalPages);
        setStatusSummary(response.data.statusSummary);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Get user details by ID
  const getUserDetails = async (id) => {
    try {
      const response = await authApi.getUserDetails(id);
      console.log("user details", response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  }


  useEffect(() => {
    fetchOrders();
  }, [page, filters]);

  // Fetch user details when orders are loaded
  useEffect(() => {
    const fetchUserDetailsForOrders = async () => {
      if (orders.length > 0) {
        setLoadingUserDetails(true);
        const userDetailsMap = {};
        for (const order of orders) {
          if (order.user?._id && !userDetailsMap[order.user._id]) {
            const userData = await getUserDetails(order.user._id);
            if (userData) {
              userDetailsMap[order.user._id] = userData;
            }
          }
        }
        setUserDetails(userDetailsMap);
        setLoadingUserDetails(false);
      }
    };

    fetchUserDetailsForOrders();
  }, [orders]);






  const handleStatusFilter = (status) => {
    setFilters(prev => ({ ...prev, status }));
    setPage(1);
  };

  const handlePaymentStatusFilter = (paymentStatus) => {
    setFilters(prev => ({ ...prev, paymentStatus }));
    setPage(1);
  };

  const handleSearch = (search) => {
    setFilters(prev => ({ ...prev, search }));
    setPage(1);
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

  const getPaymentMethodIcon = (method) => {
    return method === 'COD' ? <Package className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />;
  };

  const handleViewOrder = (order) => {
    navigate(`/admin/orders/${order.orderId}`);
  };

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const formatPrice = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  const getImageUrl = (imageData) => {
    if (!imageData) return '/placeholder-product.jpg';
    if (typeof imageData === 'string') return imageData;
    if (imageData.secure_url) return imageData.secure_url;
    if (imageData.url) return imageData.url;
    return '/placeholder-product.jpg';
  };

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>


      {/* Order Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(statusSummary).map(([status, count]) => (
              <Card key={status}>
                <CardContent className="p-4 text-center">
                  <div className="space-y-2">
                    <div className="mx-auto w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{status}</p>
                      <p className="text-xl font-bold">{count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Simple Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Orders</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Order ID, customer name..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Order Status</label>
              <Select value={filters.status || "all"} onValueChange={(value) => handleStatusFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Ordered">Ordered</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Return Requested">Return Requested</SelectItem>
                  <SelectItem value="Returned">Returned</SelectItem>
                  <SelectItem value="Refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Status</label>
              <Select value={filters.paymentStatus || "all"} onValueChange={(value) => handlePaymentStatusFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Orders ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading orders...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ordered At</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell className="font-medium">{order.orderId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {loadingUserDetails ? (
                              <span className="text-muted-foreground">Loading...</span>
                            ) : userDetails[order.user?._id]?.firstname
                              ? `${userDetails[order.user._id].firstname}`
                              : userDetails[order.user?._id]?.firstname || 'Unknown Customer'
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {userDetails[order.user?._id]?.email || order.user?.email || 'No email'}
                          </p>
                          {order.shippingInfo?.phone && (
                            <p className="text-xs text-muted-foreground">📞 {order.shippingInfo.phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2 max-w-xs">
                          {order.items && order.items.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                              <img
                                src={getImageUrl(item.product?.image)}
                                alt={item.product?.name || 'Product'}
                                className="w-8 h-8 object-cover rounded flex-shrink-0"
                                onError={(e) => {
                                  e.target.src = '/placeholder-product.jpg';
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" title={item.product?.name || 'Product'}>
                                  {item.product?.name || 'Product'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.color?.name} • {item.size} • Qty: {item.quantity}
                                </p>
                                <p className="text-xs font-medium text-green-600">
                                  ₹{formatPrice(item.amount)}
                                </p>
                              </div>
                            </div>
                          ))}
                          {order.items && order.items.length > 2 && (
                            <div className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-6"
                                onClick={() => handleViewOrder(order)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                +{order.items.length - 2} more items
                              </Button>
                            </div>
                          )}
                          {order.items && order.items.length <= 2 && (
                            <div className="text-xs text-muted-foreground text-center">
                              Total: {order.totalItems} items
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(order.paymentMethod)}
                          <div>
                            <p className="text-sm font-medium">{order.paymentMethod}</p>
                            <Badge className={getPaymentStatusBadgeColor(order.paymentStatus)}>
                              {order.paymentStatus}
                            </Badge>
                            {order.transactionId && (
                              <p className="text-xs text-muted-foreground mt-1">
                                TXN: {order.transactionId}
                              </p>
                            )}
                            {order.paymentProvider && (
                              <p className="text-xs text-muted-foreground">
                                Via: {order.paymentProvider}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {Object.entries(order.overallStatus).map(([status, count]) => (
                            <Badge key={status} className={getStatusBadgeColor(status)}>
                              {status}: {count}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(order.orderedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Manual Status Update
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Simple Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showStatusModal && (
        <StatusUpdateModal
          order={selectedOrder}
          onClose={() => setShowStatusModal(false)}
          onUpdate={fetchOrders}
        />
      )}
    </div>
  );
};
