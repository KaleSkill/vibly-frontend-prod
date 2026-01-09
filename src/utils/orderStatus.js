/**
 * Order Status Configuration
 * 
 * IMPORTANT: This must match the backend OrderStatus model exactly.
 * Backend location: backend/src/models/order.model.js
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
 */
export const OrderStatus = {
  ORDERED: { 
    value: 'Ordered', 
    next: ['Cancelled', 'Shipped'],
    color: 'bg-blue-100 text-blue-800',
    icon: '📦'
  },
  SHIPPED: { 
    value: 'Shipped', 
    next: ['Delivered'],
    color: 'bg-yellow-100 text-yellow-800',
    icon: '🚚'
  },
  DELIVERED: { 
    value: 'Delivered', 
    next: ['Return Requested'],
    color: 'bg-green-100 text-green-800',
    icon: '✅'
  },
  CANCELLED: { 
    value: 'Cancelled', 
    next: ['Refunded'],
    color: 'bg-red-100 text-red-800',
    icon: '❌'
  },
  RETURN_REQUESTED: { 
    value: 'Return Requested', 
    next: ['Departed For Returning', 'Return Cancelled'],
    color: 'bg-orange-100 text-orange-800',
    icon: '🔄'
  },
  DEPARTED_FOR_RETURNING: { 
    value: 'Departed For Returning', 
    next: ['Returned', 'Return Cancelled'],
    color: 'bg-purple-100 text-purple-800',
    icon: '🚛'
  },
  RETURNED: { 
    value: 'Returned', 
    next: ['Refunded'],
    color: 'bg-purple-100 text-purple-800',
    icon: '📦'
  },
  RETURN_CANCELLED: { 
    value: 'Return Cancelled', 
    next: [],
    color: 'bg-gray-100 text-gray-800',
    icon: '🚫'
  },
  REFUNDED: { 
    value: 'Refunded', 
    next: [],
    color: 'bg-gray-100 text-gray-800',
    icon: '💰'
  },
};

export const getStatusColor = (status) => {
  const statusKey = Object.keys(OrderStatus).find(key => OrderStatus[key].value === status);
  return statusKey ? OrderStatus[statusKey].color : 'bg-gray-100 text-gray-800';
};

export const getStatusIcon = (status) => {
  const statusKey = Object.keys(OrderStatus).find(key => OrderStatus[key].value === status);
  return statusKey ? OrderStatus[statusKey].icon : '📦';
};

export const getNextStatuses = (status) => {
  const statusKey = Object.keys(OrderStatus).find(key => OrderStatus[key].value === status);
  return statusKey ? OrderStatus[statusKey].next : [];
};
