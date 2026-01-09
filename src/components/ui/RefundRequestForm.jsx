import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { userApi } from "@/api/api";

const RefundRequestForm = ({ orderId, itemId, item, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState("UPI");
  const [formData, setFormData] = useState({
    quantity: item.quantity,
    note: "",
    // UPI details
    upiId: "",
    // Bank details
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    phoneNumber: "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (formData.quantity > item.quantity || formData.quantity < 1) {
      toast.error("Invalid quantity");
      return false;
    }

    if (accountType === "UPI") {
      if (!formData.upiId || !formData.upiId.includes("@")) {
        toast.error("Please enter a valid UPI ID");
        return false;
      }
    } else {
      if (
        !formData.bankName ||
        !formData.accountNumber ||
        !formData.ifscCode ||
        !formData.accountHolderName
      ) {
        toast.error("Please fill all bank account details");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const refundAccountDetails = {
        accountType: accountType,
        ...(accountType === "UPI"
          ? { upiId: formData.upiId, phoneNumber: formData.phoneNumber }
          : {
              bankName: formData.bankName,
              accountNumber: formData.accountNumber,
              ifscCode: formData.ifscCode,
              accountHolderName: formData.accountHolderName,
            }),
      };

      const response = await userApi.orders.requestRefund({
        orderId,
        itemId,
        quantity: formData.quantity,
        refundAccountDetails,
        note: formData.note,
      });

      if (response.success) {
        toast.success(
          "Refund request submitted successfully! Our team will process it within 2-3 business days."
        );
        onSuccess?.(response.data);
      } else {
        toast.error(response.message || "Failed to submit refund request");
      }
    } catch (error) {
      console.error("Refund request error:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit refund request"
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateRefundAmount = () => {
    return (item.amount.totalAmount * formData.quantity).toFixed(2);
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">Request Refund</CardTitle>
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Product:</strong> {item.product.name}
            </p>
            <p>
              <strong>Size:</strong> {item.size}
            </p>
            {item.color && (
              <p>
                <strong>Color:</strong> {item.color.name}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Refund</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={item.quantity}
                value={formData.quantity}
                onChange={(e) =>
                  handleInputChange("quantity", parseInt(e.target.value))
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum: {item.quantity} items
              </p>
            </div>

            {/* Refund Amount */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Refund Amount:</span>
                <span className="text-lg font-bold text-primary">
                  ₹{calculateRefundAmount()}
                </span>
              </div>
            </div>

            {/* Account Type */}
            <div className="space-y-3">
              <Label>Refund Account Type</Label>
              <RadioGroup
                value={accountType}
                onValueChange={setAccountType}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="UPI" id="upi" />
                  <Label htmlFor="upi">UPI (Recommended)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BANK" id="bank" />
                  <Label htmlFor="bank">Bank Account</Label>
                </div>
              </RadioGroup>
            </div>

            {/* UPI Details */}
            {accountType === "UPI" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="upiId">UPI ID *</Label>
                  <Input
                    id="upiId"
                    type="text"
                    placeholder="yourname@paytm or yourname@upi"
                    value={formData.upiId}
                    onChange={(e) => handleInputChange("upiId", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+91 99999 99999"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      handleInputChange("phoneNumber", e.target.value)
                    }
                  />
                </div>
              </div>
            )}

            {/* Bank Account Details */}
            {accountType === "BANK" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    type="text"
                    placeholder="State Bank of India"
                    value={formData.bankName}
                    onChange={(e) =>
                      handleInputChange("bankName", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    type="text"
                    placeholder="1234567890"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      handleInputChange("accountNumber", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code *</Label>
                  <Input
                    id="ifscCode"
                    type="text"
                    placeholder="SBIN0001234"
                    value={formData.ifscCode}
                    onChange={(e) =>
                      handleInputChange(
                        "ifscCode",
                        e.target.value.toUpperCase()
                      )
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountHolderName">
                    Account Holder Name *
                  </Label>
                  <Input
                    id="accountHolderName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.accountHolderName}
                    onChange={(e) =>
                      handleInputChange("accountHolderName", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            )}

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Reason for Refund (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Brief reason for requesting refund..."
                value={formData.note}
                onChange={(e) => handleInputChange("note", e.target.value)}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Submitting..." : "Submit Refund Request"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>

          {/* Information */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p>• Refunds will be processed within 2-3 business days</p>
            <p>• Amount will be credited to the provided account</p>
            <p>• You will receive SMS/Email confirmation once processed</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RefundRequestForm;
