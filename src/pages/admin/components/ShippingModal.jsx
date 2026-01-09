import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { adminApi, userApi } from "@/api/api";
import { toast } from "sonner";
import {
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Loader2,
  MapPin,
  Ruler,
  Weight,
  Box,
} from "lucide-react";

export const ShippingModal = ({ order, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Create Adhoc, 2: Assign AWB, 3: Generate Pickup
  const [shippingData, setShippingData] = useState({
    length: "",
    breadth: "",
    height: "",
    weight: "",
    address: "",
  });
  const [addressDetails, setAddressDetails] = useState(null);
  const [stepStatus, setStepStatus] = useState({
    adhocOrderCreated: false,
    awbAssigned: false,
    pickupGenerated: false,
  });
  const [currentStepLoading, setCurrentStepLoading] = useState(false);

  useEffect(() => {
    if (order) {
      // Initialize with order's shipping info
      setShippingData((prev) => ({
        ...prev,
        address: `${order.shippingInfo.address}, ${order.shippingInfo.city}, ${order.shippingInfo.state} - ${order.shippingInfo.postalCode}`,
      }));

      // Check existing shiprocket status and determine current step
      const determineCurrentStep = () => {
        // Find ordered items with shiprocket data
        const orderedItems =
          order.items?.filter((item) => item.orderStatus === "Ordered") || [];
        const orderedItemsWithShiprocket = orderedItems.filter(
          (item) => item.shiprocket
        );

        if (orderedItemsWithShiprocket.length === 0) {
          return 1; // No shiprocket data, start from step 1
        }

        // Check flags from first ordered item with shiprocket data
        const firstItem = orderedItemsWithShiprocket[0];
        const flags = firstItem.shiprocket?.flags || {};

        // Check if all steps are completed
        if (flags.pickupGenerated) {
          return 4; // All steps completed
        }

        // Check if AWB is assigned but pickup not generated
        if (flags.awbAssigned) {
          return 3; // Ready for pickup generation
        }

        // Check if adhoc order is created but AWB not assigned
        if (flags.adhocOrderCreated) {
          return 2; // Ready for AWB assignment
        }

        // No steps completed, start from step 1
        return 1;
      };

      const currentStep = determineCurrentStep();
      setStep(currentStep);

      // Update step status based on shiprocket data from ordered items
      const orderedItems =
        order.items?.filter((item) => item.orderStatus === "Ordered") || [];
      const orderedItemsWithShiprocket = orderedItems.filter(
        (item) => item.shiprocket
      );
      const firstItem = orderedItemsWithShiprocket[0];

      setStepStatus({
        adhocOrderCreated:
          firstItem?.shiprocket?.flags?.adhocOrderCreated || false,
        awbAssigned: firstItem?.shiprocket?.flags?.awbAssigned || false,
        pickupGenerated: firstItem?.shiprocket?.flags?.pickupGenerated || false,
      });

      // Fetch address details from pincode
      fetchAddressDetails(order.shippingInfo.postalCode);
    }
  }, [order]);

  const fetchAddressDetails = async (pincode) => {
    try {
      const response = await userApi.address.getPincodeDetails(pincode);
      if (response.data.success) {
        setAddressDetails(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching address details:", error);
      // Don't show error to user, just use order data
    }
  };

  const handleInputChange = (field, value) => {
    setShippingData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateShippingData = () => {
    if (
      !shippingData.length ||
      !shippingData.breadth ||
      !shippingData.height ||
      !shippingData.weight
    ) {
      toast.error("Please fill all package dimensions and weight");
      return false;
    }

    if (
      isNaN(shippingData.length) ||
      isNaN(shippingData.breadth) ||
      isNaN(shippingData.height) ||
      isNaN(shippingData.weight)
    ) {
      toast.error(
        "Please enter valid numeric values for dimensions and weight"
      );
      return false;
    }

    return true;
  };

  const handleCreateAdhocOrder = async () => {
    if (!validateShippingData()) return;

    try {
      setCurrentStepLoading(true);
      const response = await adminApi.orders.createAdhocOrderStep(
        order.orderId,
        {
          length: parseFloat(shippingData.length),
          breadth: parseFloat(shippingData.breadth),
          height: parseFloat(shippingData.height),
          weight: parseFloat(shippingData.weight),
          address: shippingData.address,
        }
      );

      if (response.data.success) {
        toast.success("Adhoc order created successfully");
        setStepStatus((prev) => ({ ...prev, adhocOrderCreated: true }));
        setStep(2);
        onUpdate(); // Refresh order details
      }
    } catch (error) {
      console.error("Error creating adhoc order:", error);
      toast.error(
        error.response?.data?.message || "Failed to create adhoc order"
      );
    } finally {
      setCurrentStepLoading(false);
    }
  };

  const handleAssignAWB = async () => {
    try {
      setCurrentStepLoading(true);
      const response = await adminApi.orders.assignAWBStep(order.orderId);

      if (response.data.success) {
        toast.success("AWB assigned successfully");
        setStepStatus((prev) => ({ ...prev, awbAssigned: true }));
        setStep(3);
        onUpdate(); // Refresh order details
      }
    } catch (error) {
      console.error("Error assigning AWB:", error);
      toast.error(error.response?.data?.message || "Failed to assign AWB");
    } finally {
      setCurrentStepLoading(false);
    }
  };

  const handleGeneratePickup = async () => {
    try {
      setCurrentStepLoading(true);
      const response = await adminApi.orders.generatePickupStep(order.orderId);

      if (response.data.success) {
        toast.success(
          "Pickup generated successfully and order marked as shipped"
        );
        setStepStatus((prev) => ({ ...prev, pickupGenerated: true }));
        setStep(4);
        onUpdate(); // Refresh order details
      }
    } catch (error) {
      console.error("Error generating pickup:", error);
      toast.error(error.response?.data?.message || "Failed to generate pickup");
    } finally {
      setCurrentStepLoading(false);
    }
  };

  const getStepIcon = (stepNumber) => {
    // Check if step is completed based on stepStatus
    const isCompleted =
      (stepNumber === 1 && stepStatus.adhocOrderCreated) ||
      (stepNumber === 2 && stepStatus.awbAssigned) ||
      (stepNumber === 3 && stepStatus.pickupGenerated);

    if (isCompleted) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (stepNumber === step && currentStepLoading)
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    if (stepNumber === step)
      return (
        <div className="h-5 w-5 rounded-full border-2 border-blue-500 bg-blue-50" />
      );
    return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
  };

  const getStepStatus = (stepNumber) => {
    // Check if step is completed based on stepStatus
    const isCompleted =
      (stepNumber === 1 && stepStatus.adhocOrderCreated) ||
      (stepNumber === 2 && stepStatus.awbAssigned) ||
      (stepNumber === 3 && stepStatus.pickupGenerated);

    if (isCompleted) return "completed";
    if (stepNumber === step) return "current";
    return "pending";
  };

  if (!order) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Ship Order - {order.orderId}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            Customer: {order.user?.name} | Items:{" "}
            {order.products?.reduce(
              (sum, product) => sum + product.quantity,
              0
            )}
          </div>
          {(() => {
            const orderedItems =
              order.items?.filter((item) => item.orderStatus === "Ordered") ||
              [];
            const orderedItemsWithShiprocket = orderedItems.filter(
              (item) => item.shiprocket
            );

            if (orderedItemsWithShiprocket.length > 0) {
              return (
                <div className="text-xs text-muted-foreground mt-1">
                  {stepStatus.pickupGenerated
                    ? "✅ All steps completed"
                    : stepStatus.awbAssigned
                    ? "🔄 Ready for pickup generation"
                    : stepStatus.adhocOrderCreated
                    ? "🔄 Ready for AWB assignment"
                    : "📦 Ready to start shipping process"}
                </div>
              );
            }
            return null;
          })()}
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipping Process</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {[
                  {
                    number: 1,
                    title: "Create Adhoc Order",
                    description: "Create order in Shiprocket",
                  },
                  {
                    number: 2,
                    title: "Assign AWB",
                    description: "Assign tracking number",
                  },
                  {
                    number: 3,
                    title: "Generate Pickup",
                    description: "Generate pickup request",
                  },
                ].map((stepInfo, index) => (
                  <div
                    key={stepInfo.number}
                    className="flex flex-col items-center"
                  >
                    <div className="flex items-center">
                      {getStepIcon(stepInfo.number)}
                      {index < 2 && (
                        <div
                          className={`w-16 h-0.5 mx-2 ${
                            getStepStatus(stepInfo.number) === "completed"
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        />
                      )}
                    </div>
                    <div className="text-center mt-2">
                      <p
                        className={`text-sm font-medium ${
                          getStepStatus(stepInfo.number) === "current"
                            ? "text-blue-600"
                            : getStepStatus(stepInfo.number) === "completed"
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {stepInfo.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stepInfo.description}
                      </p>
                      {getStepStatus(stepInfo.number) === "completed" && (
                        <p className="text-xs text-green-600 font-medium">
                          ✓ Completed
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Step Summary */}
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Progress Summary</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div
                    className={`p-2 rounded text-center ${
                      stepStatus.adhocOrderCreated
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Step 1:{" "}
                    {stepStatus.adhocOrderCreated ? "✓ Done" : "⏳ Pending"}
                  </div>
                  <div
                    className={`p-2 rounded text-center ${
                      stepStatus.awbAssigned
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Step 2: {stepStatus.awbAssigned ? "✓ Done" : "⏳ Pending"}
                  </div>
                  <div
                    className={`p-2 rounded text-center ${
                      stepStatus.pickupGenerated
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Step 3:{" "}
                    {stepStatus.pickupGenerated ? "✓ Done" : "⏳ Pending"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Package Details */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Step 1: Package Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address Information */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {shippingData.address}
                  </p>
                  {addressDetails && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>State: {addressDetails.state}</p>
                      <p>City: {addressDetails.city}</p>
                    </div>
                  )}
                </div>

                {/* Package Dimensions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="length" className="flex items-center gap-2">
                      <Ruler className="h-4 w-4" />
                      Length (cm)
                    </Label>
                    <Input
                      id="length"
                      type="number"
                      step="0.1"
                      value={shippingData.length}
                      onChange={(e) =>
                        handleInputChange("length", e.target.value)
                      }
                      placeholder="e.g., 30"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="breadth"
                      className="flex items-center gap-2"
                    >
                      <Ruler className="h-4 w-4" />
                      Breadth (cm)
                    </Label>
                    <Input
                      id="breadth"
                      type="number"
                      step="0.1"
                      value={shippingData.breadth}
                      onChange={(e) =>
                        handleInputChange("breadth", e.target.value)
                      }
                      placeholder="e.g., 20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height" className="flex items-center gap-2">
                      <Ruler className="h-4 w-4" />
                      Height (cm)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      value={shippingData.height}
                      onChange={(e) =>
                        handleInputChange("height", e.target.value)
                      }
                      placeholder="e.g., 10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight" className="flex items-center gap-2">
                      <Weight className="h-4 w-4" />
                      Weight (kg)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={shippingData.weight}
                      onChange={(e) =>
                        handleInputChange("weight", e.target.value)
                      }
                      placeholder="e.g., 0.5"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCreateAdhocOrder}
                  disabled={currentStepLoading}
                  className="w-full"
                >
                  {currentStepLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Adhoc Order...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Create Adhoc Order
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Assign AWB */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Step 2: Assign AWB
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stepStatus.adhocOrderCreated && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      ✅ Step 1 completed: Adhoc order created successfully in
                      Shiprocket
                    </AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This will assign a tracking number (AWB) to the order for
                    shipment tracking.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleAssignAWB}
                  disabled={currentStepLoading}
                  className="w-full"
                >
                  {currentStepLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assigning AWB...
                    </>
                  ) : (
                    <>
                      <Truck className="h-4 w-4 mr-2" />
                      Assign AWB
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Generate Pickup */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Step 3: Generate Pickup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stepStatus.awbAssigned && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      ✅ Step 2 completed: AWB assigned successfully
                      {order.shiprocket?.trackingNumber && (
                        <div className="mt-1">
                          <strong>Tracking Number:</strong>{" "}
                          {order.shiprocket.trackingNumber}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This will generate a pickup request and mark all ordered
                    items as shipped.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleGeneratePickup}
                  disabled={currentStepLoading}
                  className="w-full"
                >
                  {currentStepLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Pickup...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Generate Pickup
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Completed */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Shipping Process Completed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    All shipping steps have been completed successfully. The
                    order has been marked as shipped.
                  </AlertDescription>
                </Alert>

                {(() => {
                  const orderedItems =
                    order.items?.filter(
                      (item) => item.orderStatus === "Ordered"
                    ) || [];
                  const orderedItemsWithShiprocket = orderedItems.filter(
                    (item) => item.shiprocket
                  );
                  const firstItem = orderedItemsWithShiprocket[0];

                  if (firstItem?.shiprocket) {
                    return (
                      <div className="bg-muted/30 rounded-lg p-4">
                        <h4 className="font-medium mb-2">
                          Tracking Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Shiprocket Order ID:</strong>{" "}
                            {firstItem.shiprocket.orderId}
                          </p>
                          <p>
                            <strong>Shipment ID:</strong>{" "}
                            {firstItem.shiprocket.shipmentId}
                          </p>
                          {firstItem.shiprocket.trackingNumber && (
                            <p>
                              <strong>Tracking Number:</strong>{" "}
                              {firstItem.shiprocket.trackingNumber}
                            </p>
                          )}
                          {firstItem.shiprocket.courierName && (
                            <p>
                              <strong>Courier:</strong>{" "}
                              {firstItem.shiprocket.courierName}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </CardContent>
            </Card>
          )}

          {/* Order Items Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {order.products?.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          product.image?.secure_url ||
                          "/placeholder-product.jpg"
                        }
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.color?.name} | Size: {product.size} | Qty:{" "}
                          {product.quantity}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={getStatusBadgeColor(
                        product.itemsGroupedByStatus
                          ? Object.keys(product.itemsGroupedByStatus)[0]
                          : "Ordered"
                      )}
                    >
                      {product.itemsGroupedByStatus
                        ? Object.keys(product.itemsGroupedByStatus)[0]
                        : "Ordered"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const getStatusBadgeColor = (status) => {
  const colors = {
    Ordered: "bg-blue-100 text-blue-800",
    Shipped: "bg-yellow-100 text-yellow-800",
    Delivered: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
    "Return Requested": "bg-orange-100 text-orange-800",
    Returned: "bg-purple-100 text-purple-800",
    Refunded: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};
