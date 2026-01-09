import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { userApi } from '@/api/api'
import { 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package,
  DollarSign,
  Calendar
} from 'lucide-react'

const RefundTrackingPage = () => {
  const [refundRequests, setRefundRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRefundRequests()
  }, [])

  const fetchRefundRequests = async () => {
    try {
      setLoading(true)
      const response = await userApi.orders.getRefundRequests()
      if (response.data.success) {
        setRefundRequests(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching refund requests:', error)
      toast.error('Failed to load refund requests')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'REFUNDED':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Refunded</Badge>
      case 'REJECTED':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusMessage = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Your refund request is being reviewed by our team.'
      case 'REFUNDED':
        return 'Your refund has been processed and credited to your account.'
      case 'REJECTED':
        return 'Your refund request has been rejected. Please check the reason.'
      default:
        return 'Status unknown'
    }
  }

  const formatPrice = (amount) => {
    return parseFloat(amount || 0).toFixed(2)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading refund requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <RotateCcw className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Refund Requests</h1>
        </div>
        <p className="text-muted-foreground">Track the status of your refund requests</p>
      </div>

      {/* Refund Requests */}
      <div className="space-y-4">
        {refundRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <RotateCcw className="h-16 w-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">No refund requests found</h3>
                  <p className="text-muted-foreground">
                    You haven't submitted any refund requests yet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          refundRequests.map((request, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{request.product?.name}</CardTitle>
                  {getStatusBadge(request.refundStatus)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Order ID:</span>
                    <div className="font-medium">{request.orderId}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Size:</span>
                    <div className="font-medium">{request.size}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quantity:</span>
                    <div className="font-medium">{request.quantity}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Refund Amount:</span>
                    <div className="font-medium text-green-600">₹{formatPrice(request.refundAmount)}</div>
                  </div>
                </div>

                {/* Status Message */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-primary/10 rounded-full">
                      {request.refundStatus === 'PENDING' && <Clock className="h-4 w-4 text-yellow-600" />}
                      {request.refundStatus === 'REFUNDED' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {request.refundStatus === 'REJECTED' && <XCircle className="h-4 w-4 text-red-600" />}
                    </div>
                    <h4 className="font-medium">Status Update</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getStatusMessage(request.refundStatus)}
                  </p>
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Timeline</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Order placed:</span>
                      <span>{formatDate(request.orderedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Refund requested:</span>
                      <span>{formatDate(request.refundRequestedAt)}</span>
                    </div>
                    {request.refundApprovedAt && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-muted-foreground">Refund approved:</span>
                        <span className="text-green-600">{formatDate(request.refundApprovedAt)}</span>
                      </div>
                    )}
                    {request.refundRejectedAt && (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-3 w-3 text-red-600" />
                        <span className="text-muted-foreground">Refund rejected:</span>
                        <span className="text-red-600">{formatDate(request.refundRejectedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection Reason */}
                {request.refundRejectionReason && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">Rejection Reason</h4>
                    <p className="text-sm text-red-700">{request.refundRejectionReason}</p>
                  </div>
                )}

                {/* Notes */}
                {request.refundRequestNote && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Your Notes</h4>
                    <p className="text-sm text-blue-700">{request.refundRequestNote}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default RefundTrackingPage
