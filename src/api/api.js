import axios from 'axios';

const Backend_url = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
const API_URL = `${Backend_url}/api`

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Include cookies in requests
});

// Request interceptor - attach Bearer token if present
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    const shiprocketToken = localStorage.getItem('shiprocket_token');
    
    if (token) {
        config.headers = config.headers || {};
        if (!config.headers['Authorization']) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
    }
    
    // Add Shiprocket token for Shiprocket API calls
    if (shiprocketToken) {
        config.headers['x-shiprocket-token'] = shiprocketToken;
    }
    
    return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
            // Try to refresh token
            try {
                const refreshResponse = await fetch(`${API_URL}/auth/refresh-token`, {
                    method: 'POST',
                    credentials: 'include'
                });
                
                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    if (data.data?.accessToken) {
                        localStorage.setItem('token', data.data.accessToken);
                        if (data.data.refreshToken) {
                            localStorage.setItem('refreshToken', data.data.refreshToken);
                        }
                    }
                    // Retry original request
                    return api(originalRequest);
                } else {
                    // Refresh failed, redirect to login
                    localStorage.clear();
                    window.location.href = '/login';
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
            }
        } else if (error.response?.status === 401) {
        }
        
        return Promise.reject(error);
    }
);




// Helper function to check if user is authenticated
export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
};

//auth api
export const authApi = {
    // Google OAuth login
    loginWithGoogle: () => {
        window.location.href = `${Backend_url}/api/auth/google`;
    },

    // Get current user
    getCurrentUser: () => {
        // If no token exists, return a rejected promise immediately
        if (!isAuthenticated()) {
            return Promise.reject(new Error('No valid token found'));
        }
        return api.get('/auth/me');
    },

    // Check authentication status
    checkAuth: () => {
        // If no token exists, return a rejected promise immediately
        if (!isAuthenticated()) {
            return Promise.reject(new Error('No valid token found'));
        }
        return api.get('/auth/me');
    },

    // Logout
    logout: async () => {
        try {
            // Try to call backend logout first
            const response = await api.get('/auth/logout');
            return response;
        } catch (error) {
            console.log('Backend logout failed, continuing with local cleanup:', error);
            // Even if backend logout fails, we should still clear local storage
            // This ensures the user can login again
            throw error; // Re-throw so the caller knows it failed
        } finally {
            // Always clear local storage regardless of backend response
            localStorage.clear();
        }
    },

    // Refresh token
    refreshToken: () => {
        return api.post('/auth/refresh-token');
    },

    // Get user details
    getUserDetails: (id) => {
        return api.get(`/auth/user-details/${id}`);
    }
};

//admin api
export const adminApi = {
    // Banner management
    banners: {
        // Get all banners with filter
        getBanners: (isActive = 'all', saleActive = 'all') => {
            let params = [];
            if (isActive !== 'all') {
                params.push(`isActive=${isActive}`);
            }
            if (saleActive !== 'all') {
                params.push(`saleActive=${saleActive}`);
            }
            const queryString = params.length > 0 ? `?${params.join('&')}` : '';
            return api.get(`/admin/banners${queryString}`);
        },

        // Upload new banner
        uploadBanner: (formData) => {
            return api.post('/admin/banners/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },

        // Toggle banner status
        toggleBannerStatus: (bannerId) => {
            return api.patch(`/admin/banners/${bannerId}/toggle`);
        },

        // Toggle banner sale status
        toggleBannerSaleStatus: (bannerId) => {
            return api.patch(`/admin/banners/${bannerId}/toggle-sale`);
        },

        // Reorder banners
        reorderBanners: (orderedIds) => {
            return api.put('/admin/banners/reorder/all', { orderedIds });
        },

        // Update banner link
        updateBannerLink: (bannerId, link) => {
            return api.patch(`/admin/banners/${bannerId}/link`, { link });
        },

        // Delete banner
        deleteBanner: (bannerId) => {
            return api.delete(`/admin/banners/${bannerId}`);
        }
    },

    // Color management
    colors: {
        // Get all colors with filter
        getColors: (isActive = 'all') => {
            let params = '';
            if (isActive === 'true') {
                params = '?isActive=true';
            } else if (isActive === 'false') {
                params = '?isActive=false';
            }
            // For 'all', don't add any params to show all colors
            return api.get(`/admin/colors${params}`);
        },

        // Create new color
        createColor: (colorData) => {
            return api.post('/admin/colors', colorData);
        },

        // Update color
        updateColor: (colorId, colorData) => {
            return api.put(`/admin/colors/${colorId}`, colorData);
        },

        // Delete color
        deleteColor: (colorId) => {
            return api.delete(`/admin/colors/${colorId}`);
        },

        // Toggle color status
        toggleColorStatus: (colorId) => {
            return api.put(`/admin/colors/${colorId}/toggle`);
        },

        // Get products of a color
        getProductsOfColor: (colorName) => {
            return api.get(`/admin/colors/color=${colorName}`);
        }
    },

    // Category management
    categories: {
        // Get all categories with filter
        getCategories: (gender = 'all', isActive = 'all') => {
            let params = [];
            if (gender !== 'all') {
                params.push(`gender=${gender}`);
            }
            if (isActive === 'true') {
                params.push('isActive=true');
            } else if (isActive === 'false') {
                params.push('isActive=false');
            }
            const queryString = params.length > 0 ? `?${params.join('&')}` : '';
            return api.get(`/admin/categories${queryString}`);
        },

        // Create new category
        createCategory: (categoryData) => {
            return api.post('/admin/categories', categoryData);
        },

        // Update category
        updateCategory: (categoryId, categoryData) => {
            return api.patch(`/admin/categories/${categoryId}`, categoryData);
        },

        // Delete category
        deleteCategory: (categoryId) => {
            return api.delete(`/admin/categories/${categoryId}`);
        },

        // Toggle category status
        toggleCategoryStatus: (categoryId) => {
            return api.put(`/admin/categories/${categoryId}/toggle`);
        }
    },

    // User management
    users: {
        // Get all users with filter and pagination
        getUsers: (role = 'all', search = '', page = 1, limit = 10) => {
            let params = [];
            if (role !== 'all') {
                params.push(`role=${role}`);
            }
            if (search) {
                params.push(`search=${encodeURIComponent(search)}`);
            }
            params.push(`page=${page}`);
            params.push(`limit=${limit}`);
            const queryString = `?${params.join('&')}`;
            return api.get(`/admin/users${queryString}`);
        },

        // Get user by ID
        getUserById: (userId) => {
            return api.get(`/admin/users/${userId}`);
        },

        // Update user role
        updateUserRole: (userId, role) => {
            return api.patch(`/admin/users/${userId}/role`, { role });
        },

        // Delete user
        deleteUser: (userId) => {
            return api.delete(`/admin/users/${userId}`);
        },

        // Get user statistics
        getUserStats: () => {
            return api.get('/admin/users/stats');
        }
    },

    // Product management
    products: {
        // Get all products with filters and pagination
        getProducts: (filters = {}) => {
            const {
                gender = 'all',
                category = 'all',
                color = 'all',
                priceLte = '',
                priceGte = '',
                sort = 'newest',
                page = 1,
                limit = 20,
                isOnSale = 'all',
                isActive = 'all',
                search = ''
            } = filters;

            let params = [];
            if (gender !== 'all') params.push(`gender=${gender}`);
            if (category !== 'all') params.push(`category=${category}`);
            if (color !== 'all') params.push(`color=${color}`);
            if (priceLte) params.push(`price[lte]=${priceLte}`);
            if (priceGte) params.push(`price[gte]=${priceGte}`);
            if (sort !== 'newest') params.push(`sort=${sort}`);
            if (page !== 1) params.push(`page=${page}`);
            if (limit !== 20) params.push(`limit=${limit}`);
            if (isOnSale !== 'all') params.push(`isOnSale=${isOnSale}`);
            if (isActive !== 'all') params.push(`isActive=${isActive}`);
            if (search) params.push(`search=${encodeURIComponent(search)}`);

            const queryString = params.length > 0 ? `?${params.join('&')}` : '';
            return api.get(`/admin/products${queryString}`);
        },

        // Get product by ID
        getProductById: (productId) => {
            return api.get(`/admin/products/${productId}`);
        },

        // Create new product
        createProduct: (productData) => {
            return api.post('/admin/products', productData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },

        // Update product
        updateProduct: (productId, productData) => {
            return api.patch(`/admin/products/${productId}`, productData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },

        // Delete product
        deleteProduct: (productId) => {
            return api.delete(`/admin/products/${productId}`);
        },

        // Toggle product status
        toggleProductStatus: (productId) => {
            return api.patch(`/admin/products/${productId}/toggle-status`);
        },

        // Variant management
        addVariant: (productId, variantData) => {
            return api.post(`/admin/products/${productId}/variants`, variantData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },

        updateVariant: (productId, colorId, variantData) => {
            return api.patch(`/admin/products/${productId}/variants/${colorId}`, variantData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },

        deleteVariant: (productId, color) => {
            return api.delete(`/admin/products/${productId}/variants&color=${color}`);
        },

        getVariantById: (productId, color) => {
            return api.get(`/admin/products/${productId}/variants&color=${color}`);
        },

        // Get variant by ID for editing
        getVariantForEdit: (productId, variantId) => {
            return api.get(`/admin/products/${productId}/variants/edit/${variantId}`);
        },

        // Get product statistics
        getProductStats: () => {
            return api.get('/admin/products/stats');
        }
    },

    // Sale management
    sales: {
        // Get all sales
        getSales: () => {
            return api.get('/admin/sales');
        },

        // Get sale by ID
        getSaleById: (saleId) => {
            return api.get(`/admin/sales/${saleId}`);
        },

        // Create new sale
        createSale: (saleData) => {
            return api.post('/admin/sales', saleData);
        },

        // Update sale
        updateSale: (saleId, saleData) => {
            return api.put(`/admin/sales/${saleId}`, saleData);
        },

        // Delete sale
        deleteSale: (saleId) => {
            return api.delete(`/admin/sales/${saleId}`);
        },

        // Toggle sale status
        toggleSaleStatus: (saleId) => {
            return api.patch(`/admin/sales/${saleId}/toggle`);
        }
    },

    // Admin payment management
    adminPayments: {
        // Get payment configuration (admin)
        getPaymentConfig: () => {
            return api.get('/admin/payments/config');
        },

        // Update payment configuration
        updatePaymentConfig: (configData) => {
            return api.put('/admin/payments/config', configData);
        },

        // Get all payment transactions
        getAllPaymentTransactions: (params) => {
            return api.get('/admin/payments/transactions', { params });
        },

        // Get payment statistics
        getPaymentStats: () => {
            return api.get('/admin/payments/stats');
        }
    },

    // Order management
    newOrders: {
        // Get all orders with filters and pagination
        getAllOrders: (queryString = '') => {
            return api.get(`/admin/newOrders${queryString ? '?' + queryString : ''}`);
        },

        // Get order items by order ID
        getOrderItemsByOrderId: (orderId) => {
            return api.get(`/admin/newOrders/${orderId}/items`);
        },

        // Update order item status (manual update)
        updateOrderItemStatus: (itemId, data) => {
            return api.put(`/admin/newOrders/items/${itemId}/update-status`, data);
        },

        // Get available status transitions for an item
        getAvailableStatusTransitions: (itemId) => {
            return api.get(`/admin/newOrders/items/${itemId}/available-transitions`);
        },

        // Process refund for returned item
        processRefund: (data) => {
            return api.put('/admin/newOrders/items/refund', data);
        },

        // Cancel return request
        processReturnCancel: (data) => {
            return api.put('/admin/newOrders/items/return-cancel', data);
        },

        // Get all return requests
        getReturnRequests: (status = 'all', page = 1, limit = 20) => {
            let params = [];
            if (status !== 'all') params.push(`status=${status}`);
            params.push(`page=${page}`);
            params.push(`limit=${limit}`);
            const queryString = `?${params.join('&')}`;
            return api.get(`/admin/newOrders/returns${queryString}`);
        },

        // Get return request details
        getReturnRequestDetails: (returnId) => {
            return api.get(`/admin/newOrders/returns/${returnId}`);
        },

        // Update return request status
        updateReturnStatus: (returnId, status, note = '') => {
            return api.put(`/admin/newOrders/returns/${returnId}/status`, { status, note });
        },

        // Get all refund requests
        getAllRefundRequests: () => {
            return api.get('/admin/newOrders/refunds');
        },

        // Approve refund request
        approveRefund: (refundRequestId, refundAmount) => {
            return api.put(`/admin/newOrders/refunds/${refundRequestId}/approve`, { refundAmount });
        },

        // Reject refund request
        rejectRefund: (refundRequestId, rejectionReason) => {
            return api.put(`/admin/newOrders/refunds/${refundRequestId}/reject`, { rejectionReason });
        },

        // Shiprocket shipping steps
        createAdhocOrderStep: (orderId, shippingData) => {
            return api.post(`/admin/newOrders/${orderId}/create-adhoc-order`, shippingData);
        },

        assignAWBStep: (orderId) => {
            return api.post(`/admin/newOrders/${orderId}/assign-awb`);
        },

        generatePickupStep: (orderId) => {
            return api.post(`/admin/newOrders/${orderId}/generate-pickup`);
        }
    },

    // Statistics management
    stats: {
        // Get comprehensive dashboard overview stats
        getOverviewStats: () => {
            return api.get('/admin/stats/overview');
        },

        // Get detailed user statistics
        getUserStats: () => {
            return api.get('/admin/stats/users');
        },

        // Get detailed product statistics
        getProductStats: () => {
            return api.get('/admin/stats/products');
        },

        // Get detailed sales statistics
        getSalesStats: () => {
            return api.get('/admin/stats/sales');
        },

        // Get detailed order statistics
        getOrderStats: () => {
            return api.get('/admin/stats/orders');
        },

        // Get detailed payment statistics
        getPaymentStats: () => {
            return api.get('/admin/stats/payments');
        }
    },

    // ==================== ANALYTICS ====================
    analytics: {
        getStats: () => {
            return api.get('/admin/stats');
        },
        getPaymentStats: () => {
            return api.get('/admin/stats/payments');
        }
    }
}

// User API for homepage and product browsing
export const userApi = {
    // Banner management
    banners: {
        // Get active banners for homepage
        getActiveBanners: () => {
            return api.get('/banners');
        }
    },

    // Product management
    products: {
        // Get all products with filters
        getProducts: (filters = {}) => {
            const {
                gender = 'all',
                category = 'all',
                color = 'all',
                priceLte = '',
                priceGte = '',
                sort = 'newest',
                page = 1,
                limit = 20,
                isOnSale = 'all',
                search = ''
            } = filters;

            let params = [];
            if (gender !== 'all') params.push(`gender=${gender}`);
            if (category !== 'all') params.push(`category=${category}`);
            if (color !== 'all') params.push(`color=${color}`);
            if (priceLte) params.push(`price[lte]=${priceLte}`);
            if (priceGte) params.push(`price[gte]=${priceGte}`);
            if (sort !== 'newest') params.push(`sort=${sort}`);
            if (page !== 1) params.push(`page=${page}`);
            if (limit !== 20) params.push(`limit=${limit}`);
            if (isOnSale !== 'all') params.push(`isOnSale=${isOnSale}`);
            if (search) params.push(`search=${encodeURIComponent(search)}`);

            const queryString = params.length > 0 ? `?${params.join('&')}` : '';
            return api.get(`/products${queryString}`);
        },

        // Get product by ID
        getProductById: (productId) => {
            return api.get(`/products/${productId}`);
        },

        // Search products
        searchProducts: (query, limit = 5) => {
            return api.get(`/products/search?q=${encodeURIComponent(query)}&limit=${limit}`);
        },

        // Get trending products (limit to 8 for homepage)
        getTrendingProducts: () => {
            return api.get('/products?limit=8&sort=newest');
        }
    },

    // Category management
    categories: {
        // Get all active categories
        getCategories: () => {
            return api.get('/categories');
        },

        // Get category by ID
        getCategoryById: (categoryId) => {
            return api.get(`/categories/${categoryId}`);
        },

        // Get products of a category
        getProductsOfCategory: (categoryId, filters = {}) => {
            const {
                gender = 'all',
                color = 'all',
                priceLte = '',
                priceGte = '',
                sort = 'newest',
                page = 1,
                limit = 20,
                isOnSale = 'all'
            } = filters;

            let params = [];
            if (gender !== 'all') params.push(`gender=${gender}`);
            if (color !== 'all') params.push(`color=${color}`);
            if (priceLte) params.push(`priceGte=${priceLte}`);
            if (priceGte) params.push(`priceGte=${priceGte}`);
            if (sort !== 'newest') params.push(`sort=${sort}`);
            if (page !== 1) params.push(`page=${page}`);
            if (limit !== 20) params.push(`limit=${limit}`);
            if (isOnSale !== 'all') params.push(`isOnSale=${isOnSale}`);

            const queryString = params.length > 0 ? `?${params.join('&')}` : '';
            return api.get(`/categories/${categoryId}/products${queryString}`);
        }
    },

    // Color management
    colors: {
        // Get all active colors
        getColors: () => {
            return api.get('/colors');
        },

        // Get color by ID
        getColorById: (colorId) => {
            return api.get(`/colors/${colorId}`);
        },

        // Get products of a color
        getProductsOfColor: (colorId, filters = {}) => {
            const {
                gender = 'all',
                category = 'all',
                priceLte = '',
                priceGte = '',
                sort = 'newest',
                page = 1,
                limit = 20,
                isOnSale = 'all'
            } = filters;

            let params = [];
            if (gender !== 'all') params.push(`gender=${gender}`);
            if (category !== 'all') params.push(`category=${category}`);
            if (priceLte) params.push(`priceGte=${priceLte}`);
            if (priceGte) params.push(`priceGte=${priceGte}`);
            if (sort !== 'newest') params.push(`sort=${sort}`);
            if (page !== 1) params.push(`page=${page}`);
            if (limit !== 20) params.push(`limit=${limit}`);
            if (isOnSale !== 'all') params.push(`isOnSale=${isOnSale}`);

            const queryString = params.length > 0 ? `?${params.join('&')}` : '';
            return api.get(`/colors/${colorId}${queryString}`);
        }
    },

    // New Order management (using newOrder controller)
    newOrders: {
        // Create new order
        createOrder: (orderData) => {
            return api.post('/newOrders', orderData);
        },

        // Get user orders
        getUserOrders: () => {
            return api.get('/newOrders');
        },

        // Get order by order ID
        getOrderByOrderId: (orderId) => {
            return api.get(`/newOrders/${orderId}`);
        },

        // Cancel order item
        cancelOrderItem: (itemId, quantity) => {
            return api.put('/newOrders/cancel', { itemId, quantity });
        },

        // Return order item
        returnOrderItem: (itemId, quantity, note) => {
            return api.put('/newOrders/return', { itemId, quantity, note });
        },

        // Cancel return request
        cancelReturnRequest: (itemId, quantity) => {
            return api.put('/newOrders/return-cancel', { itemId, quantity });
        },

        // Request refund
        requestRefund: (refundData) => {
            return api.post('/newOrders/refund/request', refundData);
        },

        // Get user refund requests
        getRefundRequests: () => {
            return api.get('/newOrders/refund/requests');
        }
    },

    // Address management
    addresses: {
        // Get user addresses
        getUserAddresses: () => {
            return api.get('/newOrders/addresses');
        },

        // Add new address
        addAddress: (addressData) => {
            return api.post('/newOrders/addresses', addressData);
        },

        // Update address
        updateAddress: (addressId, addressData) => {
            return api.put(`/newOrders/addresses/${addressId}`, addressData);
        },

        // Delete address
        deleteAddress: (addressId) => {
            return api.delete(`/newOrders/addresses/${addressId}`);
        },

        // Set default address
        setDefaultAddress: (addressId) => {
            return api.put(`/newOrders/addresses/${addressId}/default`);
        }
    },

    // Payment management
    payments: {
        // Get payment configuration
        getPaymentConfig: () => {
            return api.get('/payments/config');
        },

        // Create payment order
        createPaymentOrder: (orderData) => {
            return api.post('/payments/create-order', orderData);
        },

        // Create simple payment (for Cashfree like your example)
        createSimplePayment: (orderData) => {
            return api.post('/payments/simple-payment', orderData);
        },

        // Verify Razorpay payment
        verifyRazorpayPayment: (paymentData) => {
            return api.post('/payments/verify/razorpay', paymentData);
        },

        // Verify Cashfree payment
        verifyCashfreePayment: (paymentData) => {
            return api.post('/payments/verify/cashfree', paymentData);
        },

        // Get payment transactions
        getPaymentTransactions: (orderId) => {
            return api.get(`/payments/transactions/${orderId}`);
        }
    },

    // Cart management
    cart: {
        // Add product to cart
        addToCart: (cartData) => {
            return api.post('/cart', cartData);
        },

        // Get cart items
        getCartItems: () => {
            return api.get('/cart');
        },

        // Remove item from cart
        removeFromCart: (productId, colorId, size) => {
            return api.delete(`/cart/remove-item`, { data: { productId, colorId, size } });
        },

        // Update cart item quantity
        updateQuantity: (productId, colorId, size, quantity) => {
            return api.patch(`/cart/update-quantity`, { productId, colorId, size, quantity });
        }
    },

    // Review API
    reviews: {
        // Get reviews for a product
        getProductReviews: (productId, page = 1, limit = 10) => {
            return api.get(`/reviews/product/${productId}?page=${page}&limit=${limit}`);
        },

        // Create a review
        createReview: (productId, rating, comment) => {
            return api.post(`/reviews/product/${productId}`, { rating, comment });
        },

        // Update a review
        updateReview: (reviewId, rating, comment) => {
            return api.put(`/reviews/${reviewId}`, { rating, comment });
        },

        // Delete a review
        deleteReview: (reviewId) => {
            return api.delete(`/reviews/${reviewId}`);
        }
    },


    // ==================== REVIEWS ====================
    reviews: {
        // Add a review
        addReview: (productId, reviewData) => {
            console.log('API call - productId:', productId);
            console.log('API call - reviewData:', reviewData);
            return api.post(`/reviews/${productId}`, reviewData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        },

        // Get reviews for a product with pagination
        getReviews: (productId, params = {}) => {
            const { page = 1, limit = 10, rating, sort = 'newest' } = params;
            let queryString = `?page=${page}&limit=${limit}&sort=${sort}`;
            if (rating) queryString += `&rating=${rating}`;
            return api.get(`/reviews/${productId}${queryString}`);
        },

        // Update a review
        updateReview: (productId, reviewId, reviewData) => {
            return api.patch(`/reviews/${productId}/${reviewId}`, reviewData);
        },

        // Delete a review
        deleteReview: (productId, reviewId) => {
            return api.delete(`/reviews/${productId}/${reviewId}`);
        },

        // Mark review as helpful
        markHelpful: (productId, reviewId) => {
            return api.post(`/reviews/${productId}/${reviewId}/helpful`);
        }
    },

    // ==================== ADDRESS SERVICES ====================
    address: {
        // Get address details by pincode
        getPincodeDetails: (pincode) => {
            return api.get(`/address/pincode/${pincode}`);
        }
    }
};


//shiprocket api
export const shiprocketApi = {
    // Generate Shiprocket token
    generateToken: (credentials) => {
        return api.post('/admin/shiprocket/generate-token', credentials);
    },

    // Logout from Shiprocket
    logout: (token) => {
        return api.post('/admin/shiprocket/token-logout', {}, {
            headers: {
                'x-shiprocket-token': token
            }
        });
    },

    // Webhook management
    getWebhookConfig: () => {
        return api.get('/admin/shiprocket/webhooks/config');
    },

    testWebhook: () => {
        return api.post('/admin/shiprocket/webhooks/test');
    },

    testWebhookLocal: (payload) => {
        return api.post('/admin/shiprocket/webhooks/test-local', payload);
    },

    getWebhookTestStatus: () => {
        return api.get('/admin/shiprocket/webhooks/test-status');
    },

    simulateWebhook: (payload) => {
        return api.post('/admin/shiprocket/webhooks/simulate', payload);
    },

    getTunnelWebhookUrls: () => {
        return api.get('/admin/shiprocket/webhooks/tunnel-urls');
    },

    // Order tracking and status management
    getOrderTracking: (orderId) => {
        return api.get(`/admin/shiprocket/orders/${orderId}/tracking`);
    },

    getOrdersByStatus: (status) => {
        return api.get(`/admin/shiprocket/orders/status/${status}`);
    },

    updateOrderStatus: (orderId, status, trackingData) => {
        return api.post(`/admin/shiprocket/orders/${orderId}/status`, {
            status,
            trackingData
        });
    }
};