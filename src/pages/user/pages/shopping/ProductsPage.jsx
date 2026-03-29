import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { userApi } from "@/api/api";
import { toast } from "sonner";
import ProductFilterLayout from "@/pages/user/layout/ProductFilterLayout";
import ProductMainContent from "@/pages/user/components/ProductMainContent";
import ViblyNavigation from "@/components/ui/vivly-navigation";
import Footer from "@/pages/home/components/Footer";

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [filters, setFilters] = useState({
    gender: searchParams.get("gender") || "all",
    category: searchParams.get("category") || "all",
    color: searchParams.get("color") || "all",
    isOnSale: searchParams.get("isOnSale") || "all",
    priceGte: Number(searchParams.get("priceGte") ?? 0),
    priceLte: Number(searchParams.get("priceLte") ?? 10000),
    sort: searchParams.get("sort") || "newest",
  });
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [minMaxPrice, setMinMaxPrice] = useState({ min: 0, max: 10000 });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 20,
  });

  // Fetch products with specific filters
  const fetchProductsWithFilters = async (page = 1, filterState = filters) => {
    setLoading(true);
    try {
      const queryParams = {
        page,
        limit: 20,
        sort: filterState.sort,
        gender: filterState.gender !== "all" ? filterState.gender : undefined,
        category:
          filterState.category !== "all" ? filterState.category : undefined,
        color: filterState.color !== "all" ? filterState.color : undefined,
        isOnSale:
          filterState.isOnSale !== "all" ? filterState.isOnSale : undefined,
        // include price filters only when explicitly provided (allow 0)
        priceGte:
          filterState.priceGte !== undefined && filterState.priceGte !== null
            ? filterState.priceGte
            : undefined,
        priceLte:
          filterState.priceLte !== undefined && filterState.priceLte !== null
            ? filterState.priceLte
            : undefined,
      };

      // Remove undefined values
      Object.keys(queryParams).forEach((key) => {
        if (queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });

      console.log("Fetching products with params:", queryParams);

      const response = await userApi.products.getProducts(queryParams);
      console.log("API Response:", response.data);

      setProducts(response.data.data?.products || []);
      setPagination({
        currentPage: response.data.data?.pagination?.currentPage || 1,
        totalPages: response.data.data?.pagination?.totalPages || 1,
        totalProducts: response.data.data?.pagination?.totalProducts || 0,
        limit: response.data.data?.pagination?.limit || 20,
      });

      // update slider bounds (min/max available prices) but do not override active filters
      // Use API-provided minPrice/maxPrice to set slider bounds (ensure numbers)
      setMinMaxPrice({
        min: Number(response.data.data?.minPrice ?? filterState.priceGte ?? 0),
        max: Number(
          response.data.data?.maxPrice ?? filterState.priceLte ?? 10000
        ),
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      // Fetch categories
      const categoriesResponse = await userApi.categories.getCategories();
      setCategories(categoriesResponse.data.data || []);

      // Fetch colors
      const colorsResponse = await userApi.colors.getColors();
      setColors(colorsResponse.data.data || []);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // Update URL params when filters change
  const updateURLParams = (newFilters) => {
    const params = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, value]) => {
      // include numeric zero and non-empty values; skip 'all'
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "all"
      ) {
        params.set(key, String(value));
      }
    });

    setSearchParams(params);
  };

  // Handle filter changes
  // Accept either (filterType, value) or (updatesObject)
  const handleFilterChange = (filterTypeOrObj, value) => {
    let newFilters;
    if (
      filterTypeOrObj &&
      typeof filterTypeOrObj === "object" &&
      !Array.isArray(filterTypeOrObj)
    ) {
      newFilters = { ...filters, ...filterTypeOrObj };
    } else {
      newFilters = { ...filters, [filterTypeOrObj]: value };
    }
    setFilters(newFilters);
    updateURLParams(newFilters);
    console.log("handleFilterChange with new filters:", newFilters);
    // Pass the new filters directly to avoid timing issues
    fetchProductsWithFilters(1, newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const defaultFilters = {
      gender: "all",
      category: "all",
      color: "all",
      isOnSale: "all",
      priceGte: filters.priceGte,
      priceLte: filters.priceLte,
      sort: "newest",
    };
    setFilters(defaultFilters);
    setSearchParams(new URLSearchParams());
    console.log("clearAllFilters with default filters:", defaultFilters);
    fetchProductsWithFilters(1, defaultFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === "priceGte" || key === "priceLte") return value && value !== 0;
      return value && value !== "all";
    });
  };

  // Initialize filters from URL on component mount and fetch products
  useEffect(() => {
    const urlFilters = {
      gender: searchParams.get("gender") || "all",
      category: searchParams.get("category") || "all",
      color: searchParams.get("color") || "all",
      isOnSale: searchParams.get("isOnSale") || "all",
      priceGte: searchParams.get("priceGte") || filters.priceGte,
      priceLte: searchParams.get("priceLte") || filters.priceLte,
      sort: searchParams.get("sort") || "newest",
    };
    setFilters(urlFilters);
    console.log("Initial load with URL filters:", urlFilters);
    fetchProductsWithFilters(1, urlFilters);
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // SEO: Dynamic page title based on active category / filters
  useEffect(() => {
    const prevTitle = document.title
    const metaDesc = document.querySelector('meta[name="description"]')
    const prevDesc = metaDesc?.getAttribute('content') || ''

    let titlePart = 'All Products'
    if (filters.gender && filters.gender !== 'all') {
      titlePart = `${filters.gender}'s Fashion`
    }
    if (filters.isOnSale && filters.isOnSale !== 'all') {
      titlePart = 'Sale Products'
    }

    document.title = `${titlePart} | Shop Online at Vibly`
    if (metaDesc) {
      metaDesc.setAttribute('content',
        `Shop ${titlePart.toLowerCase()} on Vibly. Free shipping on orders above ₹599. Easy 7-day exchange policy.`
      )
    }

    return () => {
      document.title = prevTitle
      if (metaDesc) metaDesc.setAttribute('content', prevDesc)
    }
  }, [filters.gender, filters.category, filters.isOnSale]);

  return (
    <div className="h-screen bg-background flex flex-col">
      <ViblyNavigation />

      <div className="flex-1">
        <ProductFilterLayout
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearAllFilters}
          categories={categories}
          colors={colors}
          loading={loading}
          minMaxPrice={minMaxPrice}
          hasActiveFilters={hasActiveFilters}
          getActiveFilterCount={() =>
            Object.values(filters).filter((v) => v && v !== "all" && v !== "")
              .length
          }
        >
          <ProductMainContent
            products={products}
            loading={loading}
            viewMode={viewMode}
            setViewMode={setViewMode}
            filters={filters}
            handleFilterChange={handleFilterChange}
            clearAllFilters={clearAllFilters}
            hasActiveFilters={hasActiveFilters}
            pagination={pagination}
            fetchProductsWithFilters={fetchProductsWithFilters}
          />
        </ProductFilterLayout>
      </div>

      <Footer />
    </div>
  );
};

export default ProductsPage;