import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { adminApi } from "@/api/api";
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
  DollarSign,
  User,
  Package,
  CreditCard,
  Wallet,
  MessageSquare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const RefundManagement = () => {
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processingRefund, setProcessingRefund] = useState(null);
  const [rejectionNote, setRejectionNote] = useState("");

  useEffect(() => {
    fetchRefundRequests();
  }, []);

  const fetchRefundRequests = async () => {
    try {
      setLoading(true);
      const response = await adminApi.orders.getAllRefundRequests();
      if (response.data.success) {
        console.log("All Refund Requests Data:", response.data.data);
        setRefundRequests(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching refund requests:", error);
      toast.error("Failed to load refund requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRefund = async (request) => {
    try {
      setProcessingRefund(request.id);
      const response = await adminApi.orders.approveRefund(
        request.id,
        request.refundAmount
      );
      if (response.data.success) {
        toast.success("Refund approved and processed successfully");
        fetchRefundRequests(); // Refresh data
      } else {
        toast.error(response.data.message || "Failed to approve refund");
      }
    } catch (error) {
      console.error("Approve refund error:", error);
      toast.error(error.response?.data?.message || "Failed to approve refund");
    } finally {
      setProcessingRefund(null);
    }
  };

  const handleRejectRefund = async (request) => {
    if (!rejectionNote.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setProcessingRefund(request.id);
      const response = await adminApi.orders.rejectRefund(
        request.id,
        rejectionNote
      );
      if (response.data.success) {
        toast.success("Refund request rejected");
        setRejectionNote("");
        setSelectedRequest(null);
        fetchRefundRequests(); // Refresh data
      } else {
        toast.error(response.data.message || "Failed to reject refund");
      }
    } catch (error) {
      console.error("Reject refund error:", error);
      toast.error(error.response?.data?.message || "Failed to reject refund");
    } finally {
      setProcessingRefund(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Refunded
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = refundRequests.filter(
    (request) =>
      request.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">
            Loading refund requests...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Refund Management</h1>
          <p className="text-muted-foreground">
            Manage customer refund requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders, customers..."
              className="pl-8 pr-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{refundRequests.length}</p>
              </div>
              <RotateCcw className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {
                    refundRequests.filter((r) => r.refundStatus === "PENDING")
                      .length
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {
                    refundRequests.filter((r) => r.refundStatus === "REFUNDED")
                      .length
                  }
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  ₹
                  {refundRequests
                    .reduce((sum, r) => sum + (r.refundAmount || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refund Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Refund Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <RotateCcw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No refund requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.orderId}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{request.customerName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{request.productName}</TableCell>
                    <TableCell>{request.quantity}</TableCell>
                    <TableCell className="font-medium">
                      ₹{formatPrice(request.refundAmount)}
                    </TableCell>
                    <TableCell>
                      {request.transactionId ? (
                        <span className="text-sm font-mono">
                          {request.transactionId.substring(0, 8)}...
                          {request.transactionId.slice(-4)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          N/A
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(request.refundRequestedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.refundStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* View Details Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log("Refund Request Data:", request);
                                setSelectedRequest(request);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] bg-card">
                            <DialogHeader className="pb-4 border-b">
                              <DialogTitle className="text-xl font-bold">
                                Refund Request Details
                              </DialogTitle>
                              <p className="text-sm text-muted-foreground">
                                Review refund request and approve or reject
                              </p>
                            </DialogHeader>
                            <div className="max-h-[calc(90vh-120px)] overflow-y-auto px-1">
                              {selectedRequest && (
                                <div className="space-y-6">
                                  {/* Summary Information */}
                                  <Card className="border-2">
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Refund Request Summary
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      {/* Order ID */}
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                          <Package className="h-4 w-4" />
                                          Order ID
                                        </Label>
                                        <p className="text-xl font-bold">
                                          {selectedRequest.orderId}
                                        </p>
                                      </div>

                                      {/* Transaction ID */}
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                          <CreditCard className="h-4 w-4" />
                                          Transaction ID
                                        </Label>
                                        <p className="text-lg font-semibold font-mono break-all">
                                          {selectedRequest.transactionId ||
                                            "N/A"}
                                        </p>
                                      </div>

                                      {/* Refund Amount */}
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                          <DollarSign className="h-4 w-4" />
                                          Refund Amount
                                        </Label>
                                        <p className="text-2xl font-bold text-green-600">
                                          ₹
                                          {formatPrice(
                                            selectedRequest.refundAmount
                                          )}
                                        </p>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Customer Information */}
                                    <Card>
                                      <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                          <User className="h-5 w-5" />
                                          Customer Information
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium text-muted-foreground">
                                            Customer Name
                                          </Label>
                                          <p className="font-medium">
                                            {selectedRequest.customerName}
                                          </p>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium text-muted-foreground">
                                            Email
                                          </Label>
                                          <p className="font-medium">
                                            {selectedRequest.customerEmail}
                                          </p>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium text-muted-foreground">
                                            Payment Method
                                          </Label>
                                          <Badge
                                            variant="outline"
                                            className="font-mono"
                                          >
                                            {selectedRequest.paymentMethod}
                                          </Badge>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    {/* Product Information */}
                                    <Card>
                                      <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                          <Package className="h-5 w-5" />
                                          Product Details
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium text-muted-foreground">
                                            Product
                                          </Label>
                                          <p className="font-medium">
                                            {selectedRequest.productName}
                                          </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-2">
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Size
                                            </Label>
                                            <p className="font-medium">
                                              {selectedRequest.size}
                                            </p>
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Color
                                            </Label>
                                            <p className="font-medium">
                                              {selectedRequest.color}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium text-muted-foreground">
                                            Quantity
                                          </Label>
                                          <Badge variant="secondary">
                                            {selectedRequest.quantity}
                                          </Badge>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* Refund Account Details */}
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <Wallet className="h-5 w-5" />
                                        Refund Account Details
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">
                                          Account Type
                                        </Label>
                                        <Badge
                                          variant={
                                            selectedRequest.accountType ===
                                            "UPI"
                                              ? "default"
                                              : "secondary"
                                          }
                                        >
                                          {selectedRequest.accountType}
                                        </Badge>
                                      </div>
                                      {selectedRequest.accountType === "UPI" ? (
                                        <>
                                          <div className="space-y-2">
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              UPI ID
                                            </Label>
                                            <p className="font-mono text-sm">
                                              {selectedRequest.upiId}
                                            </p>
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Phone
                                            </Label>
                                            <p className="font-mono">
                                              {selectedRequest.phoneNumber}
                                            </p>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <div className="space-y-2">
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Bank Name
                                            </Label>
                                            <p className="font-medium">
                                              {selectedRequest.bankName}
                                            </p>
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Account Number
                                            </Label>
                                            <p className="font-mono text-sm">
                                              {selectedRequest.accountNumber}
                                            </p>
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              IFSC Code
                                            </Label>
                                            <p className="font-mono">
                                              {selectedRequest.ifscCode}
                                            </p>
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Account Holder
                                            </Label>
                                            <p className="font-medium">
                                              {
                                                selectedRequest.accountHolderName
                                              }
                                            </p>
                                          </div>
                                        </>
                                      )}
                                    </CardContent>
                                  </Card>

                                  {/* Timeline */}
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <Clock className="h-5 w-5" />
                                        Timeline
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">
                                          Order Date
                                        </Label>
                                        <p className="text-sm">
                                          {new Date(
                                            selectedRequest.orderedAt
                                          ).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">
                                          Refund Request Date
                                        </Label>
                                        <p className="text-sm">
                                          {new Date(
                                            selectedRequest.refundRequestedAt
                                          ).toLocaleDateString()}
                                        </p>
                                      </div>
                                      {selectedRequest.refundApprovedAt && (
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium text-muted-foreground">
                                            Refund Status
                                          </Label>
                                          <Badge variant="default">
                                            Approved
                                          </Badge>
                                        </div>
                                      )}
                                      {selectedRequest.refundRejectedAt && (
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium text-muted-foreground">
                                            Refund Status
                                          </Label>
                                          <Badge variant="destructive">
                                            Rejected
                                          </Badge>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>

                                  {/* Notes */}
                                  {selectedRequest.refundRequestNote && (
                                    <Card>
                                      <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                          <MessageSquare className="h-5 w-5" />
                                          Request Notes
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                          {selectedRequest.refundRequestNote}
                                        </p>
                                      </CardContent>
                                    </Card>
                                  )}

                                  {/* Action Buttons */}
                                  {selectedRequest.refundStatus ===
                                    "PENDING" && (
                                    <>
                                      <Card className="bg-card border-t-2">
                                        <CardContent className="pt-4">
                                          <div className="space-y-3">
                                            <Label htmlFor="rejectionNote">
                                              Rejection Reason (if rejecting)
                                            </Label>
                                            <Textarea
                                              id="rejectionNote"
                                              placeholder="Provide reason for rejection..."
                                              value={rejectionNote}
                                              onChange={(e) =>
                                                setRejectionNote(e.target.value)
                                              }
                                              rows={3}
                                            />
                                          </div>
                                          <div className="flex gap-3 mt-4">
                                            <Button
                                              onClick={() =>
                                                handleApproveRefund(
                                                  selectedRequest
                                                )
                                              }
                                              disabled={
                                                processingRefund ===
                                                selectedRequest.id
                                              }
                                              className="w-full"
                                            >
                                              <CheckCircle className="h-4 w-4 mr-2" />
                                              {processingRefund ===
                                              selectedRequest.id
                                                ? "Processing..."
                                                : "Approve Refund"}
                                            </Button>
                                            <Button
                                              variant="destructive"
                                              onClick={() =>
                                                handleRejectRefund(
                                                  selectedRequest
                                                )
                                              }
                                              disabled={
                                                processingRefund ===
                                                selectedRequest.id
                                              }
                                              className="w-full"
                                            >
                                              <XCircle className="h-4 w-4 mr-2" />
                                              {processingRefund ===
                                              selectedRequest.id
                                                ? "Processing..."
                                                : "Reject Refund"}
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RefundManagement;
