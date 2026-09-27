import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  fetchSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  updateProductStock,
  fetchSellerOrders,
  updateOrderStatus,
  fetchSellerProfile,
  updateSellerProfile,
} from "../../services/seller";
import ProductFormModal from "./components/ProductFormModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import SellerOrderDetailsModal from "./components/SellerOrderDetailsModal";

export default function SellerDashboard() {
  const { currentUser } = useAuth();

  // Active navigation tab: 'overview' | 'products' | 'inventory' | 'orders' | 'profile'
  const [activeTab, setActiveTab] = useState("overview");

  // Data states
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Product Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Filters and search states
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");

  // Inventory inline editing state { [productId]: stockNumber }
  const [stockDrafts, setStockDrafts] = useState({});
  const [stockUpdatingId, setStockUpdatingId] = useState(null);

  // Store profile edit state
  const [profileForm, setProfileForm] = useState({
    storeName: "",
    storeBio: "",
    name: "",
    phone: "",
    businessEmail: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const loadAllSellerData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError("");
    try {
      const [prods, ords, prof] = await Promise.all([
        fetchSellerProducts(currentUser.uid),
        fetchSellerOrders(currentUser.uid),
        fetchSellerProfile(currentUser.uid),
      ]);

      setProducts(prods || []);
      setOrders(ords || []);
      setSellerProfile(prof || null);

      if (prof) {
        setProfileForm({
          storeName: prof.storeName || prof.name || "",
          storeBio: prof.storeBio || "",
          name: prof.name || "",
          phone: prof.phone || "",
          businessEmail: prof.businessEmail || prof.email || "",
          address: prof.address || "",
          city: prof.city || "",
          postalCode: prof.postalCode || "",
          country: prof.country || "",
        });
      }

      // Initialize stock drafts
      const drafts = {};
      (prods || []).forEach((p) => {
        drafts[p.id] = p.stock ?? 0;
      });
      setStockDrafts(drafts);
    } catch (err) {
      console.error("Error loading seller dashboard data:", err);
      setError("Failed to load seller information. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load all seller data on mount or user change
  useEffect(() => {
    loadAllSellerData();
  }, [loadAllSellerData]);

  // Flash message helper
  function flashSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg("");
    }, 4000);
  }

  /* ---------------- PRODUCT CRUD HANDLERS ---------------- */

  function handleOpenAddProduct() {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  }

  function handleOpenEditProduct(product) {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  }

  async function handleSaveProduct(productData) {
    if (!currentUser) return;
    setIsSavingProduct(true);
    setError("");

    try {
      if (editingProduct) {
        // Update product
        await updateSellerProduct(editingProduct.id, {
          ...productData,
          sellerName: sellerProfile?.storeName || sellerProfile?.name || currentUser.displayName || "Store Seller",
        });

        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  ...productData,
                  sellerName:
                    sellerProfile?.storeName ||
                    sellerProfile?.name ||
                    currentUser.displayName ||
                    "Store Seller",
                }
              : p
          )
        );

        setStockDrafts((prev) => ({
          ...prev,
          [editingProduct.id]: productData.stock,
        }));

        flashSuccess(`Product "${productData.name}" updated successfully.`);
      } else {
        // Create new product
        const created = await createSellerProduct(
          currentUser.uid,
          sellerProfile?.storeName || sellerProfile?.name || currentUser.displayName || "Store Seller",
          productData
        );

        setProducts((prev) => [created, ...prev]);
        setStockDrafts((prev) => ({
          ...prev,
          [created.id]: created.stock,
        }));

        flashSuccess(`Product "${productData.name}" added to your store!`);
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error("Save product failed:", err);
      setError(err?.message || "Failed to save product.");
    } finally {
      setIsSavingProduct(false);
    }
  }

  function handleOpenDelete(product) {
    setDeleteTarget(product);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteSellerProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      flashSuccess(`Product "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  }

  /* ---------------- INVENTORY HANDLERS ---------------- */

  function handleStockChange(productId, delta) {
    setStockDrafts((prev) => {
      const current = prev[productId] !== undefined ? prev[productId] : 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  }

  function handleStockInput(productId, value) {
    const parsed = Math.max(0, parseInt(value, 10) || 0);
    setStockDrafts((prev) => ({ ...prev, [productId]: parsed }));
  }

  async function handleSaveStock(productId) {
    const newStock = stockDrafts[productId];
    if (newStock === undefined) return;

    setStockUpdatingId(productId);
    try {
      await updateProductStock(productId, newStock);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
      );
      flashSuccess("Stock level updated.");
    } catch (err) {
      console.error("Stock update failed:", err);
      setError("Failed to update stock count.");
    } finally {
      setStockUpdatingId(null);
    }
  }

  /* ---------------- ORDER HANDLERS ---------------- */

  async function handleStatusChange(orderId, newStatus) {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId ? { ...ord, status: newStatus } : ord
        )
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
      flashSuccess(`Order #${orderId} marked as ${newStatus}.`);
    } catch (err) {
      console.error("Failed to update order status:", err);
      setError("Could not update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  /* ---------------- PROFILE HANDLERS ---------------- */

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!currentUser || isSavingProfile) return;
    setIsSavingProfile(true);
    setError("");

    try {
      await updateSellerProfile(currentUser.uid, profileForm);
      setSellerProfile((prev) => ({ ...prev, ...profileForm }));
      setIsEditingProfile(false);
      flashSuccess("Store settings and profile saved successfully.");
    } catch (err) {
      console.error("Failed to update seller profile:", err);
      setError("Failed to save store profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  /* ---------------- COMPUTED METRICS ---------------- */

  const metrics = useMemo(() => {
    const totalEarnings = orders.reduce((sum, o) => {
      // Include non-cancelled orders in revenue
      if (o.status !== "cancelled") {
        return sum + Number(o.total || 0);
      }
      return sum;
    }, 0);

    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const processingOrders = orders.filter((o) => o.status === "processing").length;
    const lowStockCount = products.filter(
      (p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5
    ).length;
    const outOfStockCount = products.filter((p) => (p.stock ?? 0) <= 0).length;
    const totalUnitsInStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);

    return {
      totalEarnings,
      totalOrders: orders.length,
      pendingOrders,
      processingOrders,
      totalProducts: products.length,
      lowStockCount,
      outOfStockCount,
      totalUnitsInStock,
    };
  }, [orders, products]);

  // Product categories list
  const distinctCategories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
    });
    return Array.from(set);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !productSearch ||
        p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.categoryName?.toLowerCase().includes(productSearch.toLowerCase());
      const matchCategory =
        productCategoryFilter === "all" || p.categoryName === productCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, productSearch, productCategoryFilter]);

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !productSearch ||
        p.name?.toLowerCase().includes(productSearch.toLowerCase());
      const stockVal = p.stock ?? 0;
      let matchStatus = true;
      if (inventoryStatusFilter === "in_stock") matchStatus = stockVal > 5;
      if (inventoryStatusFilter === "low_stock")
        matchStatus = stockVal > 0 && stockVal <= 5;
      if (inventoryStatusFilter === "out_of_stock") matchStatus = stockVal <= 0;
      return matchSearch && matchStatus;
    });
  }, [products, productSearch, inventoryStatusFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus =
        orderStatusFilter === "all" || o.status === orderStatusFilter;
      const matchSearch =
        !orderSearch ||
        o.id?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.buyer?.name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.buyer?.email?.toLowerCase().includes(orderSearch.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  if (loading) {
    return (
      <div className="placeholder-panel" style={{ margin: "3rem auto" }}>
        Loading seller workspace…
      </div>
    );
  }

  return (
    <div className="seller-dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1>{sellerProfile?.storeName || "Seller Hub"}</h1>
            <span className="tag tag-sage">Active Seller</span>
          </div>
          <p>
            Welcome back,{" "}
            <strong>
              {sellerProfile?.storeName ||
                currentUser?.displayName ||
                currentUser?.email}
            </strong>
            . Manage your products, inventory, orders, and storefront settings.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAddProduct}
            style={{ width: "auto", padding: "0.6rem 1.25rem" }}
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="profile-success" role="status">
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="seller-tabs-nav" aria-label="Seller panel sections">
        <button
          type="button"
          className={`seller-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          type="button"
          className={`seller-tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          📦 Products ({products.length})
        </button>
        <button
          type="button"
          className={`seller-tab-btn ${activeTab === "inventory" ? "active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          🏷️ Inventory{" "}
          {metrics.lowStockCount + metrics.outOfStockCount > 0 && (
            <span className="tab-alert-badge">
              {metrics.lowStockCount + metrics.outOfStockCount}
            </span>
          )}
        </button>
        <button
          type="button"
          className={`seller-tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          📑 Orders ({orders.length}){" "}
          {metrics.pendingOrders > 0 && (
            <span className="tab-pending-badge">{metrics.pendingOrders}</span>
          )}
        </button>
        <button
          type="button"
          className={`seller-tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          🏪 Store Profile
        </button>
      </nav>

      {/* ---------------- TAB 1: OVERVIEW ---------------- */}
      {activeTab === "overview" && (
        <div className="seller-tab-content">
          {/* Metrics Grid */}
          <div className="stat-grid">
            <div className="stat-cell">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">
                ${metrics.totalEarnings.toFixed(2)}
              </div>
              <span className="stat-hint">From all fulfilled orders</span>
            </div>

            <div className="stat-cell">
              <div className="stat-label">Active Products</div>
              <div className="stat-value">{metrics.totalProducts}</div>
              <span className="stat-hint">
                {metrics.totalUnitsInStock} total units listed
              </span>
            </div>

            <div className="stat-cell">
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{metrics.totalOrders}</div>
              <span className="stat-hint">
                {metrics.pendingOrders > 0 ? (
                  <strong style={{ color: "var(--amber-dark)" }}>
                    {metrics.pendingOrders} pending fulfillment
                  </strong>
                ) : (
                  "All orders up to date"
                )}
              </span>
            </div>

            <div className="stat-cell">
              <div className="stat-label">Stock Health</div>
              <div className="stat-value" style={{ fontSize: "1.25rem" }}>
                {metrics.outOfStockCount > 0 ? (
                  <span style={{ color: "var(--rust)" }}>
                    {metrics.outOfStockCount} Out of Stock
                  </span>
                ) : metrics.lowStockCount > 0 ? (
                  <span style={{ color: "var(--amber-dark)" }}>
                    {metrics.lowStockCount} Low Stock
                  </span>
                ) : (
                  <span style={{ color: "var(--sage)" }}>All Good</span>
                )}
              </div>
              <span className="stat-hint">
                {metrics.lowStockCount} low stock alerts
              </span>
            </div>
          </div>

          {/* Quick Shortcuts & Inventory Alerts */}
          <div className="seller-overview-grid">
            {/* Quick Actions */}
            <div className="overview-card">
              <h3>Quick Actions</h3>
              <div className="quick-actions-list">
                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={handleOpenAddProduct}
                >
                  <span className="quick-action-icon">➕</span>
                  <div>
                    <strong>Add New Product</strong>
                    <p>Create a new listing in your marketplace store.</p>
                  </div>
                </button>

                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={() => setActiveTab("inventory")}
                >
                  <span className="quick-action-icon">📦</span>
                  <div>
                    <strong>Update Stock Levels</strong>
                    <p>Manage and adjust warehouse inventory in real-time.</p>
                  </div>
                </button>

                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={() => setActiveTab("orders")}
                >
                  <span className="quick-action-icon">📑</span>
                  <div>
                    <strong>View Customer Orders</strong>
                    <p>Check incoming purchases and update shipping status.</p>
                  </div>
                </button>

                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={() => setActiveTab("profile")}
                >
                  <span className="quick-action-icon">⚙️</span>
                  <div>
                    <strong>Store Settings</strong>
                    <p>Update store name, bio, and business contact info.</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="overview-card">
              <div className="overview-card-header">
                <h3>Recent Orders</h3>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setActiveTab("orders")}
                >
                  View all ({orders.length}) →
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="placeholder-panel">No orders placed yet.</div>
              ) : (
                <div className="recent-orders-list">
                  {orders.slice(0, 5).map((ord) => (
                    <div key={ord.id} className="recent-order-row">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                          Order #{ord.id.slice(0, 8)}…
                        </div>
                        <span className="order-subtext">
                          {ord.buyer?.name || "Customer"} · {ord.items?.length || 0}{" "}
                          item(s)
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 600 }}>
                          ${Number(ord.total || 0).toFixed(2)}
                        </div>
                        <span
                          className={`tag ${
                            ord.status === "delivered" || ord.status === "shipped"
                              ? "tag-sage"
                              : ord.status === "cancelled"
                              ? "tag-rust"
                              : "tag-amber"
                          }`}
                          style={{ fontSize: "0.7rem" }}
                        >
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: PRODUCTS ---------------- */}
      {activeTab === "products" && (
        <div className="seller-tab-content">
          {/* Controls Bar */}
          <div className="seller-controls-bar">
            <div className="seller-search-box">
              <input
                type="text"
                placeholder="Search products by title or category…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>

            <div className="seller-filter-select">
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {distinctCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAddProduct}
              style={{ width: "auto", whiteSpace: "nowrap" }}
            >
              + Add Product
            </button>
          </div>

          {/* Product Table */}
          {filteredProducts.length === 0 ? (
            <div className="placeholder-panel">
              {products.length === 0
                ? "You haven't listed any products yet. Click '+ Add Product' above to create your first listing!"
                : "No products matched your search or category filter."}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Rating</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isOut = (p.stock ?? 0) <= 0;
                    const isLow = (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="table-product-cell">
                            <div className="table-product-thumb">
                              {p.images?.[0] ? (
                                <img src={p.images[0]} alt={p.name} />
                              ) : (
                                <span>No img</span>
                              )}
                            </div>
                            <div>
                              <strong className="table-product-name">
                                {p.name}
                              </strong>
                              <span className="table-sku">ID: {p.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="category-pill">{p.categoryName}</span>
                        </td>
                        <td>
                          <strong>${Number(p.price || 0).toFixed(2)}</strong>
                        </td>
                        <td>
                          <span
                            className={`stock-badge ${
                              isOut
                                ? "badge-out"
                                : isLow
                                ? "badge-low"
                                : "badge-in"
                            }`}
                          >
                            {isOut
                              ? "Out of Stock (0)"
                              : isLow
                              ? `Low Stock (${p.stock})`
                              : `${p.stock} units`}
                          </span>
                        </td>
                        <td>
                          {p.rating > 0 ? (
                            <span className="table-rating">
                              ★ {p.rating.toFixed(1)} ({p.ratingCount || 0})
                            </span>
                          ) : (
                            <span className="table-muted">No reviews</span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="table-action-btns">
                            <Link
                              to={`/product/${p.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              title="View on storefront"
                            >
                              View
                            </Link>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenEditProduct(p)}
                              title="Edit product details"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger-sm btn-sm"
                              onClick={() => handleOpenDelete(p)}
                              title="Delete product"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 3: INVENTORY ---------------- */}
      {activeTab === "inventory" && (
        <div className="seller-tab-content">
          {/* Inventory summary cards */}
          <div className="inventory-summary-row">
            <div className="inventory-pill-stat">
              <span>Total Products</span>
              <strong>{metrics.totalProducts}</strong>
            </div>
            <div className="inventory-pill-stat">
              <span>Total Units in Stock</span>
              <strong>{metrics.totalUnitsInStock}</strong>
            </div>
            <div className="inventory-pill-stat alert-low">
              <span>Low Stock (≤5)</span>
              <strong>{metrics.lowStockCount}</strong>
            </div>
            <div className="inventory-pill-stat alert-out">
              <span>Out of Stock (0)</span>
              <strong>{metrics.outOfStockCount}</strong>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="seller-controls-bar">
            <div className="seller-search-box">
              <input
                type="text"
                placeholder="Search inventory by product title…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>

            <div className="filter-pill-group">
              <button
                type="button"
                className={`filter-pill ${
                  inventoryStatusFilter === "all" ? "active" : ""
                }`}
                onClick={() => setInventoryStatusFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`filter-pill ${
                  inventoryStatusFilter === "in_stock" ? "active" : ""
                }`}
                onClick={() => setInventoryStatusFilter("in_stock")}
              >
                In Stock (&gt;5)
              </button>
              <button
                type="button"
                className={`filter-pill ${
                  inventoryStatusFilter === "low_stock" ? "active" : ""
                }`}
                onClick={() => setInventoryStatusFilter("low_stock")}
              >
                Low Stock (1-5)
              </button>
              <button
                type="button"
                className={`filter-pill ${
                  inventoryStatusFilter === "out_of_stock" ? "active" : ""
                }`}
                onClick={() => setInventoryStatusFilter("out_of_stock")}
              >
                Out of Stock (0)
              </button>
            </div>
          </div>

          {/* Inventory Table with Quick Adjustment */}
          {filteredInventory.length === 0 ? (
            <div className="placeholder-panel">
              No inventory records matched your filter.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Current Status</th>
                    <th>Adjust Quantity</th>
                    <th style={{ textAlign: "right" }}>Save</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((p) => {
                    const draftStock =
                      stockDrafts[p.id] !== undefined
                        ? stockDrafts[p.id]
                        : p.stock ?? 0;
                    const isChanged = draftStock !== (p.stock ?? 0);
                    const isSaving = stockUpdatingId === p.id;
                    const isOut = draftStock <= 0;
                    const isLow = draftStock > 0 && draftStock <= 5;

                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="table-product-cell">
                            <div className="table-product-thumb">
                              {p.images?.[0] ? (
                                <img src={p.images[0]} alt={p.name} />
                              ) : (
                                <span>No img</span>
                              )}
                            </div>
                            <div>
                              <strong className="table-product-name">
                                {p.name}
                              </strong>
                              <span className="table-sku">
                                ${Number(p.price || 0).toFixed(2)} · {p.categoryName}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`stock-badge ${
                              isOut
                                ? "badge-out"
                                : isLow
                                ? "badge-low"
                                : "badge-in"
                            }`}
                          >
                            {isOut
                              ? "Out of Stock"
                              : isLow
                              ? "Low Stock"
                              : "In Stock"}
                          </span>
                        </td>
                        <td>
                          <div className="stock-counter-widget">
                            <button
                              type="button"
                              className="stock-btn"
                              onClick={() => handleStockChange(p.id, -1)}
                              disabled={draftStock <= 0 || isSaving}
                              aria-label="Decrease stock"
                            >
                              –
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={draftStock}
                              onChange={(e) =>
                                handleStockInput(p.id, e.target.value)
                              }
                              className="stock-input"
                              disabled={isSaving}
                            />
                            <button
                              type="button"
                              className="stock-btn"
                              onClick={() => handleStockChange(p.id, 1)}
                              disabled={isSaving}
                              aria-label="Increase stock"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className={`btn ${
                              isChanged ? "btn-primary" : "btn-secondary"
                            } btn-sm`}
                            onClick={() => handleSaveStock(p.id)}
                            disabled={!isChanged || isSaving}
                          >
                            {isSaving ? "Saving…" : isChanged ? "Save" : "Saved"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 4: ORDERS ---------------- */}
      {activeTab === "orders" && (
        <div className="seller-tab-content">
          {/* Controls Bar */}
          <div className="seller-controls-bar">
            <div className="seller-search-box">
              <input
                type="text"
                placeholder="Search orders by Order ID, Buyer Name, or Email…"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
            </div>

            <div className="filter-pill-group">
              <button
                type="button"
                className={`filter-pill ${
                  orderStatusFilter === "all" ? "active" : ""
                }`}
                onClick={() => setOrderStatusFilter("all")}
              >
                All ({orders.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${
                  orderStatusFilter === "pending" ? "active" : ""
                }`}
                onClick={() => setOrderStatusFilter("pending")}
              >
                Pending (
                {orders.filter((o) => o.status === "pending").length})
              </button>
              <button
                type="button"
                className={`filter-pill ${
                  orderStatusFilter === "processing" ? "active" : ""
                }`}
                onClick={() => setOrderStatusFilter("processing")}
              >
                Processing (
                {orders.filter((o) => o.status === "processing").length})
              </button>
              <button
                type="button"
                className={`filter-pill ${
                  orderStatusFilter === "shipped" ? "active" : ""
                }`}
                onClick={() => setOrderStatusFilter("shipped")}
              >
                Shipped (
                {orders.filter((o) => o.status === "shipped").length})
              </button>
              <button
                type="button"
                className={`filter-pill ${
                  orderStatusFilter === "delivered" ? "active" : ""
                }`}
                onClick={() => setOrderStatusFilter("delivered")}
              >
                Delivered (
                {orders.filter((o) => o.status === "delivered").length})
              </button>
              <button
                type="button"
                className={`filter-pill ${
                  orderStatusFilter === "cancelled" ? "active" : ""
                }`}
                onClick={() => setOrderStatusFilter("cancelled")}
              >
                Cancelled (
                {orders.filter((o) => o.status === "cancelled").length})
              </button>
            </div>
          </div>

          {/* Orders Table */}
          {filteredOrders.length === 0 ? (
            <div className="placeholder-panel">
              {orders.length === 0
                ? "No customer orders have been placed for your store yet."
                : "No orders matched your selected status filter."}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((ord) => {
                    const createdDate = ord.createdAt?.toDate
                      ? ord.createdAt.toDate().toLocaleDateString()
                      : ord.createdAt?.seconds
                      ? new Date(ord.createdAt.seconds * 1000).toLocaleDateString()
                      : "Recent";

                    const isUpdating = updatingOrderId === ord.id;

                    return (
                      <tr key={ord.id}>
                        <td>
                          <div>
                            <strong style={{ fontSize: "0.9rem" }}>
                              #{ord.id.slice(0, 8)}…
                            </strong>
                            <div className="table-sku">{createdDate}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{ord.buyer?.name || "Guest Buyer"}</strong>
                            <div className="table-sku">
                              {ord.buyer?.email || "No email"}
                            </div>
                            {ord.buyer?.phone && (
                              <div className="table-sku">
                                📞 {ord.buyer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="quantity-badge">
                            {ord.items?.length || 0} items
                          </span>
                        </td>
                        <td>
                          <strong>${Number(ord.total || 0).toFixed(2)}</strong>
                          <div className="table-sku">
                            {ord.paymentMethod === "cash_on_delivery"
                              ? "COD"
                              : ord.paymentMethod}
                          </div>
                        </td>
                        <td>
                          <select
                            value={ord.status || "pending"}
                            onChange={(e) =>
                              handleStatusChange(ord.id, e.target.value)
                            }
                            disabled={isUpdating}
                            className={`status-dropdown status-pill-${ord.status}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedOrder(ord)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 5: STORE PROFILE ---------------- */}
      {activeTab === "profile" && (
        <div className="seller-tab-content">
          <div className="profile-layout">
            {/* Store Summary Card */}
            <aside className="profile-card">
              <div
                className="profile-avatar"
                style={{ background: "var(--sage)" }}
                aria-hidden="true"
              >
                {(profileForm.storeName || currentUser.displayName || "S")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <strong className="profile-card-name">
                {profileForm.storeName || "My Store"}
              </strong>
              <span className="profile-card-email">{currentUser.email}</span>
              <span className="tag tag-sage" style={{ marginTop: "0.5rem" }}>
                Verified Seller
              </span>
              <p
                style={{
                  fontSize: "0.82rem",
                  margin: "0.75rem 0 0",
                  color: "var(--ink-soft)",
                }}
              >
                {profileForm.storeBio || "No store description added yet."}
              </p>
            </aside>

            {/* Profile Edit / Display Section */}
            <section className="profile-form-section">
              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile}>
                  <div className="profile-detail-header">
                    <h2>Edit Store &amp; Seller Profile</h2>
                  </div>

                  <div className="form-grid">
                    <label className="form-field field-full">
                      <span>Store / Brand Name *</span>
                      <input
                        type="text"
                        name="storeName"
                        value={profileForm.storeName}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            storeName: e.target.value,
                          }))
                        }
                        required
                        maxLength={80}
                      />
                    </label>

                    <label className="form-field field-full">
                      <span>Store Bio / Tagline</span>
                      <textarea
                        name="storeBio"
                        value={profileForm.storeBio}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            storeBio: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Tell shoppers about your brand, craftsmanship, and policies..."
                      />
                    </label>

                    <label className="form-field">
                      <span>Primary Contact Name</span>
                      <input
                        type="text"
                        name="name"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        maxLength={80}
                      />
                    </label>

                    <label className="form-field">
                      <span>Business Phone</span>
                      <input
                        type="tel"
                        name="phone"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        maxLength={30}
                      />
                    </label>

                    <label className="form-field field-full">
                      <span>Business Contact Email</span>
                      <input
                        type="email"
                        name="businessEmail"
                        value={profileForm.businessEmail}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            businessEmail: e.target.value,
                          }))
                        }
                        placeholder="contact@mystore.com"
                      />
                    </label>

                    <label className="form-field field-full">
                      <span>Warehouse / Pickup Address</span>
                      <input
                        type="text"
                        name="address"
                        value={profileForm.address}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        maxLength={180}
                      />
                    </label>

                    <label className="form-field">
                      <span>City</span>
                      <input
                        type="text"
                        name="city"
                        value={profileForm.city}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        maxLength={80}
                      />
                    </label>

                    <label className="form-field">
                      <span>Postal Code</span>
                      <input
                        type="text"
                        name="postalCode"
                        value={profileForm.postalCode}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            postalCode: e.target.value,
                          }))
                        }
                        maxLength={20}
                      />
                    </label>

                    <label className="form-field field-full">
                      <span>Country</span>
                      <input
                        type="text"
                        name="country"
                        value={profileForm.country}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            country: e.target.value,
                          }))
                        }
                        maxLength={80}
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      marginTop: "1.25rem",
                    }}
                  >
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: "auto", padding: "0.65rem 1.5rem" }}
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? "Saving…" : "Save Store Settings"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ width: "auto", padding: "0.65rem 1.5rem" }}
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="profile-detail-header">
                    <h2>Store &amp; Contact Information</h2>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ width: "auto", padding: "0.5rem 1.1rem" }}
                      onClick={() => setIsEditingProfile(true)}
                    >
                      Edit Store Details
                    </button>
                  </div>

                  <dl className="profile-details">
                    <div>
                      <dt>Store Name</dt>
                      <dd>
                        {sellerProfile?.storeName ||
                          sellerProfile?.name || (
                            <em className="empty-value">Not set</em>
                          )}
                      </dd>
                    </div>
                    <div>
                      <dt>Account Email</dt>
                      <dd>{currentUser.email}</dd>
                    </div>
                    <div>
                      <dt>Business Email</dt>
                      <dd>
                        {sellerProfile?.businessEmail || (
                          <em className="empty-value">Same as account</em>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Business Phone</dt>
                      <dd>
                        {sellerProfile?.phone || (
                          <em className="empty-value">Not set</em>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Store Description</dt>
                      <dd>
                        {sellerProfile?.storeBio || (
                          <em className="empty-value">No bio added</em>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Warehouse Address</dt>
                      <dd>
                        {sellerProfile?.address
                          ? [
                              sellerProfile.address,
                              sellerProfile.city,
                              sellerProfile.postalCode,
                              sellerProfile.country,
                            ]
                              .filter(Boolean)
                              .join(", ")
                          : <em className="empty-value">Not set</em>}
                      </dd>
                    </div>
                  </dl>
                </>
              )}
            </section>
          </div>
        </div>
      )}

      {/* ---------------- MODALS ---------------- */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSaveProduct}
        initialProduct={editingProduct}
        sellerId={currentUser.uid}
        isSaving={isSavingProduct}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        productName={deleteTarget?.name || ""}
        isDeleting={isDeleting}
      />

      <SellerOrderDetailsModal
        isOpen={Boolean(selectedOrder)}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleStatusChange}
        updatingOrderId={updatingOrderId}
      />
    </div>
  );
}
