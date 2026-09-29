import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  fetchAllUsers,
  updateUserRole,
  updateUserStatus,
  fetchAllAdminProducts,
  adminUpdateProduct,
  adminDeleteProduct,
  fetchAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchAllAdminOrders,
  adminUpdateOrderStatus,
  adminDeleteOrder,
} from "../../services/admin";
import {
  fetchAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  togglePromoCodeStatus,
} from "../../services/promoCodes";

import UserEditModal from "./components/UserEditModal";
import CategoryModal from "./components/CategoryModal";
import AdminProductModal from "./components/AdminProductModal";
import AdminOrderModal from "./components/AdminOrderModal";
import AdminConfirmModal from "./components/AdminConfirmModal";
import PromoCodeModal from "./components/PromoCodeModal";

export default function AdminDashboard() {
  const { currentUser } = useAuth();

  // Active tab: 'overview' | 'users' | 'products' | 'categories' | 'promoCodes' | 'orders'
  const [activeTab, setActiveTab] = useState("overview");

  // Data states
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingPromo, setEditingPromo] = useState(null);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmButtonText: "Confirm",
    isDanger: false,
    onConfirm: null,
  });

  // Action loading states
  const [isProcessing, setIsProcessing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Filter & Search states
  // Users
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");

  // Products
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productStockFilter, setProductStockFilter] = useState("all");

  // Categories
  const [categorySearch, setCategorySearch] = useState("");

  // Promo Codes
  const [promoSearch, setPromoSearch] = useState("");
  const [promoStatusFilter, setPromoStatusFilter] = useState("all");

  // Orders
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  const loadAllAdminData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [uList, pList, cList, oList, prList] = await Promise.all([
        fetchAllUsers(),
        fetchAllAdminProducts(),
        fetchAllCategories(),
        fetchAllAdminOrders(),
        fetchAllPromoCodes(),
      ]);

      setUsers(uList || []);
      setProducts(pList || []);
      setCategories(cList || []);
      setOrders(oList || []);
      setPromoCodes(prList || []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      setError("Failed to load platform data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllAdminData();
  }, [loadAllAdminData]);

  function flashSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg("");
    }, 4000);
  }

  /* ---------------- USER HANDLERS ---------------- */

  async function handleUpdateUserRole(userId, newRole) {
    setIsProcessing(true);
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      flashSuccess(`User role updated to "${newRole}".`);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleUpdateUserStatus(userId, newStatus) {
    setIsProcessing(true);
    try {
      await updateUserStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
      flashSuccess(
        newStatus === "suspended"
          ? "User account suspended (Soft Deleted)."
          : `User status set to "${newStatus}".`
      );
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }

  function handleToggleSoftDelete(user) {
    const isCurrentlyActive = (user.status || "active") === "active";
    const newStatus = isCurrentlyActive ? "suspended" : "active";

    setConfirmDialog({
      isOpen: true,
      title: isCurrentlyActive ? "Suspend User Account (Soft Delete)" : "Reactivate User Account",
      message: isCurrentlyActive
        ? `Are you sure you want to suspend "${user.name || user.email}"? The user will be restricted from logging in and transacting, while their past records remain safe.`
        : `Reactivate the account for "${user.name || user.email}"? They will regain full marketplace access.`,
      confirmButtonText: isCurrentlyActive ? "Yes, Suspend Account" : "Reactivate Account",
      isDanger: isCurrentlyActive,
      onConfirm: async () => {
        try {
          await handleUpdateUserStatus(user.id, newStatus);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch {
          setError("Failed to change user status.");
        }
      },
    });
  }

  /* ---------------- CATEGORY HANDLERS ---------------- */

  function handleOpenAddCategory() {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  }

  function handleOpenEditCategory(cat) {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  }

  async function handleSaveCategory(categoryData) {
    setIsProcessing(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id ? { ...c, ...categoryData } : c
          )
        );
        flashSuccess(`Category "${categoryData.name}" updated.`);
      } else {
        const created = await createCategory(categoryData);
        setCategories((prev) => [...prev, created]);
        flashSuccess(`Category "${categoryData.name}" created.`);
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDeleteCategory(cat) {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Category",
      message: `Are you sure you want to delete category "${cat.name}"? Products in this category will not be deleted.`,
      confirmButtonText: "Delete Category",
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteCategory(cat.id);
          setCategories((prev) => prev.filter((c) => c.id !== cat.id));
          flashSuccess(`Category "${cat.name}" deleted.`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error(err);
          setError("Failed to delete category.");
        }
      },
    });
  }

  /* ---------------- PRODUCT HANDLERS ---------------- */

  async function handleSaveProduct(productId, productUpdates) {
    setIsProcessing(true);
    try {
      await adminUpdateProduct(productId, productUpdates);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...productUpdates } : p))
      );
      flashSuccess(`Product "${productUpdates.name}" updated successfully.`);
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDeleteProduct(prod) {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Product",
      message: `Are you sure you want to remove "${prod.name}" from the marketplace?`,
      confirmButtonText: "Delete Product",
      isDanger: true,
      onConfirm: async () => {
        try {
          await adminDeleteProduct(prod.id);
          setProducts((prev) => prev.filter((p) => p.id !== prod.id));
          flashSuccess(`Product "${prod.name}" deleted.`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error(err);
          setError("Failed to delete product.");
        }
      },
    });
  }

  /* ---------------- PROMO CODE HANDLERS ---------------- */

  function handleOpenAddPromo() {
    setEditingPromo(null);
    setIsPromoModalOpen(true);
  }

  function handleOpenEditPromo(promo) {
    setEditingPromo(promo);
    setIsPromoModalOpen(true);
  }

  async function handleSavePromo(promoData) {
    setIsProcessing(true);
    try {
      if (editingPromo) {
        await updatePromoCode(editingPromo.code, promoData);
        setPromoCodes((prev) =>
          prev.map((p) => (p.code === editingPromo.code ? { ...p, ...promoData } : p))
        );
        flashSuccess(`Promo code "${editingPromo.code}" updated.`);
      } else {
        await createPromoCode(promoData);
        setPromoCodes((prev) => [promoData, ...prev]);
        flashSuccess(`Promo code "${promoData.code}" created!`);
      }
      setIsPromoModalOpen(false);
      setEditingPromo(null);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleTogglePromoStatus(promo) {
    const nextStatus = !promo.isActive;
    setIsProcessing(true);
    try {
      await togglePromoCodeStatus(promo.code, nextStatus);
      setPromoCodes((prev) =>
        prev.map((p) => (p.code === promo.code ? { ...p, isActive: nextStatus } : p))
      );
      flashSuccess(`Promo code "${promo.code}" marked as ${nextStatus ? "Active" : "Inactive"}.`);
    } catch (err) {
      console.error(err);
      setError("Failed to toggle promo code status.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDeletePromo(promo) {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Promo Code",
      message: `Are you sure you want to permanently delete promo code "${promo.code}"?`,
      confirmButtonText: "Delete Promo Code",
      isDanger: true,
      onConfirm: async () => {
        try {
          await deletePromoCode(promo.code);
          setPromoCodes((prev) => prev.filter((p) => p.code !== promo.code));
          flashSuccess(`Promo code "${promo.code}" deleted.`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error(err);
          setError("Failed to delete promo code.");
        }
      },
    });
  }

  /* ---------------- ORDER HANDLERS ---------------- */

  async function handleUpdateOrderStatus(orderId, newStatus) {
    setUpdatingOrderId(orderId);
    try {
      await adminUpdateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
      flashSuccess(`Order #${orderId.slice(0, 8)} status set to "${newStatus}".`);
    } catch (err) {
      console.error(err);
      setError("Failed to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function handleDeleteOrder(ord) {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Order Record",
      message: `Permanently remove Order #${ord.id}? This should only be used for corrupted or test data.`,
      confirmButtonText: "Delete Order",
      isDanger: true,
      onConfirm: async () => {
        try {
          await adminDeleteOrder(ord.id);
          setOrders((prev) => prev.filter((o) => o.id !== ord.id));
          flashSuccess(`Order #${ord.id.slice(0, 8)} removed.`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error(err);
          setError("Failed to delete order.");
        }
      },
    });
  }

  /* ---------------- COMPUTED METRICS ---------------- */

  const metrics = useMemo(() => {
    const grossVolume = orders.reduce((sum, o) => {
      if (o.status !== "cancelled") return sum + Number(o.total || 0);
      return sum;
    }, 0);

    const totalSavingsGranted = orders.reduce((sum, o) => {
      if (o.status !== "cancelled") return sum + Number(o.discount || 0);
      return sum;
    }, 0);

    const activeUsers = users.filter((u) => (u.status || "active") === "active").length;
    const suspendedUsers = users.filter((u) => u.status === "suspended").length;
    const sellerUsers = users.filter((u) => u.role === "seller").length;
    const customerUsers = users.filter((u) => u.role === "customer" || !u.role).length;
    const adminUsers = users.filter((u) => u.role === "admin").length;

    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const deliveredOrders = orders.filter((o) => o.status === "delivered").length;

    const outOfStockProducts = products.filter((p) => (p.stock ?? 0) <= 0).length;
    const lowStockProducts = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length;

    const activePromoCodes = promoCodes.filter((p) => p.isActive !== false).length;

    return {
      grossVolume,
      totalSavingsGranted,
      totalUsers: users.length,
      activeUsers,
      suspendedUsers,
      sellerUsers,
      customerUsers,
      adminUsers,
      totalProducts: products.length,
      outOfStockProducts,
      lowStockProducts,
      totalCategories: categories.length,
      totalPromoCodes: promoCodes.length,
      activePromoCodes,
      totalOrders: orders.length,
      pendingOrders,
      deliveredOrders,
    };
  }, [orders, users, products, categories, promoCodes]);

  /* ---------------- FILTERED LISTS ---------------- */

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !userSearch ||
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.id?.toLowerCase().includes(userSearch.toLowerCase());

      const matchRole =
        userRoleFilter === "all" ||
        (u.role || "customer") === userRoleFilter;

      const userStatus = u.status || "active";
      const matchStatus =
        userStatusFilter === "all" || userStatus === userStatusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !productSearch ||
        p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sellerName?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.id?.toLowerCase().includes(productSearch.toLowerCase());

      const matchCategory =
        productCategoryFilter === "all" ||
        p.categoryName === productCategoryFilter ||
        p.categoryId === productCategoryFilter;

      const stockVal = p.stock ?? 0;
      let matchStock = true;
      if (productStockFilter === "in_stock") matchStock = stockVal > 5;
      if (productStockFilter === "low_stock") matchStock = stockVal > 0 && stockVal <= 5;
      if (productStockFilter === "out_of_stock") matchStock = stockVal <= 0;

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, productSearch, productCategoryFilter, productStockFilter]);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      return (
        !categorySearch ||
        c.name?.toLowerCase().includes(categorySearch.toLowerCase()) ||
        c.id?.toLowerCase().includes(categorySearch.toLowerCase()) ||
        c.description?.toLowerCase().includes(categorySearch.toLowerCase())
      );
    });
  }, [categories, categorySearch]);

  const filteredPromoCodes = useMemo(() => {
    return promoCodes.filter((p) => {
      const matchSearch =
        !promoSearch ||
        p.code?.toLowerCase().includes(promoSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(promoSearch.toLowerCase());

      let matchStatus = true;
      const isExpired =
        p.expiryDate &&
        new Date(
          p.expiryDate.toDate
            ? p.expiryDate.toDate()
            : p.expiryDate.seconds
            ? p.expiryDate.seconds * 1000
            : p.expiryDate
        ).getTime() < Date.now();

      if (promoStatusFilter === "active") matchStatus = p.isActive !== false && !isExpired;
      if (promoStatusFilter === "inactive") matchStatus = p.isActive === false;
      if (promoStatusFilter === "expired") matchStatus = Boolean(isExpired);

      return matchSearch && matchStatus;
    });
  }, [promoCodes, promoSearch, promoStatusFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !orderSearch ||
        o.id?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.buyer?.name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.buyer?.email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.sellerName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.promoCode?.code?.toLowerCase().includes(orderSearch.toLowerCase());

      const matchStatus =
        orderStatusFilter === "all" || o.status === orderStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  if (loading) {
    return (
      <div className="placeholder-panel" style={{ margin: "3rem auto" }}>
        Loading executive terminal…
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1>Executive Terminal</h1>
            <span className="tag tag-amber">Platform Admin</span>
          </div>
          <p>
            Logged in as <strong>{currentUser?.email}</strong>. Moderate users,
            products, categories, promo codes, and marketplace orders.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadAllAdminData}
            style={{ width: "auto", padding: "0.55rem 1rem" }}
            title="Refresh all records"
          >
            ↻ Refresh Data
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
      <nav className="seller-tabs-nav" aria-label="Admin panel sections">
        <button
          type="button"
          className={`seller-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          type="button"
          className={`seller-tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 Users ({users.length}){" "}
          {metrics.suspendedUsers > 0 && (
            <span className="tab-alert-badge" title="Suspended users">
              {metrics.suspendedUsers}
            </span>
          )}
        </button>
        <button
          type="button"
          className={`seller-tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          🛍️ Products ({products.length})
        </button>
        <button
          type="button"
          className={`seller-tab-btn ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          📁 Categories ({categories.length})
        </button>
        <button
          type="button"
          className={`seller-tab-btn ${activeTab === "promoCodes" ? "active" : ""}`}
          onClick={() => setActiveTab("promoCodes")}
        >
          🏷️ Promo Codes ({promoCodes.length})
        </button>
        <button
          type="button"
          className={`seller-tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          📑 Orders ({orders.length}){" "}
          {metrics.pendingOrders > 0 && (
            <span className="tab-pending-badge">
              {metrics.pendingOrders}
            </span>
          )}
        </button>
      </nav>

      {/* ---------------- TAB 1: OVERVIEW ---------------- */}
      {activeTab === "overview" && (
        <div className="seller-tab-content">
          {/* Main Stat Grid */}
          <div className="stat-grid">
            <div className="stat-cell">
              <div className="stat-label">Gross Platform Volume</div>
              <div className="stat-value">
                ${metrics.grossVolume.toFixed(2)}
              </div>
              <span className="stat-hint">
                {metrics.totalSavingsGranted > 0 ? (
                  <span style={{ color: "var(--sage)" }}>
                    ${metrics.totalSavingsGranted.toFixed(2)} promo savings granted
                  </span>
                ) : (
                  `Across ${orders.length} orders`
                )}
              </span>
            </div>

            <div className="stat-cell">
              <div className="stat-label">Registered Users</div>
              <div className="stat-value">{metrics.totalUsers}</div>
              <span className="stat-hint">
                {metrics.sellerUsers} sellers · {metrics.customerUsers} customers · {metrics.adminUsers} admins
              </span>
            </div>

            <div className="stat-cell">
              <div className="stat-label">Marketplace Products</div>
              <div className="stat-value">{metrics.totalProducts}</div>
              <span className="stat-hint">
                In {metrics.totalCategories} active categories
              </span>
            </div>

            <div className="stat-cell">
              <div className="stat-label">Active Promo Codes</div>
              <div className="stat-value">{metrics.activePromoCodes}</div>
              <span className="stat-hint">
                {metrics.totalPromoCodes} total discounts created
              </span>
            </div>
          </div>

          {/* Shortcuts and Platform Health */}
          <div className="seller-overview-grid">
            <div className="overview-card">
              <h3>Admin Quick Actions</h3>
              <div className="quick-actions-list">
                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={() => setActiveTab("users")}
                >
                  <span className="quick-action-icon">👥</span>
                  <div>
                    <strong>User Directory &amp; Moderation</strong>
                    <p>Manage customer and merchant roles, or suspend abusive accounts.</p>
                  </div>
                </button>

                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={handleOpenAddPromo}
                >
                  <span className="quick-action-icon">🏷️</span>
                  <div>
                    <strong>Create New Promo Code</strong>
                    <p>Launch discount campaigns (% or fixed dollar savings).</p>
                  </div>
                </button>

                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={handleOpenAddCategory}
                >
                  <span className="quick-action-icon">📁</span>
                  <div>
                    <strong>Add Marketplace Category</strong>
                    <p>Create a fresh category for merchants to list under.</p>
                  </div>
                </button>

                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={() => setActiveTab("orders")}
                >
                  <span className="quick-action-icon">📑</span>
                  <div>
                    <strong>Manage Platform Orders</strong>
                    <p>Audit order flows, delivery status, and customer payments.</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Platform Health Card */}
            <div className="overview-card">
              <div className="overview-card-header">
                <h3>Platform Health &amp; Discounts</h3>
              </div>
              <div className="admin-health-list">
                <div className="health-row">
                  <span>Active Accounts</span>
                  <strong>{metrics.activeUsers} accounts</strong>
                </div>
                <div className="health-row">
                  <span>Suspended Accounts</span>
                  <strong style={{ color: metrics.suspendedUsers > 0 ? "var(--rust)" : "inherit" }}>
                    {metrics.suspendedUsers}
                  </strong>
                </div>
                <div className="health-row">
                  <span>Active Discounts</span>
                  <strong>{metrics.activePromoCodes} codes active</strong>
                </div>
                <div className="health-row">
                  <span>Total Savings Distributed</span>
                  <strong style={{ color: "var(--sage)" }}>
                    ${metrics.totalSavingsGranted.toFixed(2)}
                  </strong>
                </div>
                <div className="health-row">
                  <span>Pending Fulfillment</span>
                  <strong style={{ color: metrics.pendingOrders > 0 ? "var(--amber-dark)" : "inherit" }}>
                    {metrics.pendingOrders} orders
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: USERS MANAGEMENT (SOFT DELETE) ---------------- */}
      {activeTab === "users" && (
        <div className="seller-tab-content">
          <div className="seller-controls-bar">
            <div className="seller-search-box">
              <input
                type="text"
                placeholder="Search users by Name, Email, or UID…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            <div className="seller-filter-select">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="customer">Customers</option>
                <option value="seller">Sellers</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            <div className="seller-filter-select">
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only (Soft Deleted)</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="placeholder-panel">No users matched your query.</div>
          ) : (
            <div className="table-responsive">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email &amp; UID</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isSuspended = u.status === "suspended";
                    const createdDate = u.createdAt?.toDate
                      ? u.createdAt.toDate().toLocaleDateString()
                      : u.createdAt?.seconds
                      ? new Date(u.createdAt.seconds * 1000).toLocaleDateString()
                      : "—";

                    const roleBadgeClass =
                      u.role === "admin"
                        ? "tag-amber"
                        : u.role === "seller"
                        ? "tag-sage"
                        : "";

                    return (
                      <tr key={u.id} className={isSuspended ? "row-suspended" : ""}>
                        <td>
                          <div className="table-product-cell">
                            <div
                              className="profile-avatar"
                              style={{
                                width: "36px",
                                height: "36px",
                                fontSize: "0.95rem",
                                background: isSuspended ? "var(--rust)" : undefined,
                              }}
                            >
                              {(u.name || u.email || "U").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong className="table-product-name">
                                {u.name || "No name"}
                              </strong>
                              {u.phone && <span className="table-sku">📞 {u.phone}</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "0.88rem" }}>{u.email}</div>
                          <span className="table-sku">UID: {u.id.slice(0, 10)}…</span>
                        </td>
                        <td>
                          <span className={`tag ${roleBadgeClass}`}>
                            {u.role || "customer"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`stock-badge ${
                              isSuspended
                                ? "badge-out"
                                : u.status === "inactive"
                                ? "badge-low"
                                : "badge-in"
                            }`}
                          >
                            {isSuspended ? "Suspended (Soft Deleted)" : u.status || "active"}
                          </span>
                        </td>
                        <td>
                          <span className="order-subtext">{createdDate}</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="table-action-btns">
                            <button
                              type="button"
                              className={`btn ${
                                isSuspended ? "btn-secondary" : "btn-danger-sm"
                              } btn-sm`}
                              onClick={() => handleToggleSoftDelete(u)}
                              title={
                                isSuspended
                                  ? "Reactivate user account"
                                  : "Soft delete / suspend user"
                              }
                            >
                              {isSuspended ? "Reactivate" : "Suspend"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSelectedUser(u)}
                              title="Edit user role and details"
                            >
                              Edit Role
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

      {/* ---------------- TAB 3: PRODUCTS MODERATION ---------------- */}
      {activeTab === "products" && (
        <div className="seller-tab-content">
          <div className="seller-controls-bar">
            <div className="seller-search-box">
              <input
                type="text"
                placeholder="Search products by Title, Seller, or Product ID…"
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
                {categories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="seller-filter-select">
              <select
                value={productStockFilter}
                onChange={(e) => setProductStockFilter(e.target.value)}
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock (&gt;5)</option>
                <option value="low_stock">Low Stock (1-5)</option>
                <option value="out_of_stock">Out of Stock (0)</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="placeholder-panel">No products matched your filter.</div>
          ) : (
            <div className="table-responsive">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Seller</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
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
                              <strong className="table-product-name">{p.name}</strong>
                              <span className="table-sku">ID: {p.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{p.sellerName || "Store Seller"}</strong>
                            <div className="table-sku">ID: {p.sellerId?.slice(0, 8)}…</div>
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
                              isOut ? "badge-out" : isLow ? "badge-low" : "badge-in"
                            }`}
                          >
                            {isOut ? "0 (Out)" : `${p.stock} units`}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="table-action-btns">
                            <Link
                              to={`/product/${p.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                            >
                              View
                            </Link>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingProduct(p)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger-sm btn-sm"
                              onClick={() => handleDeleteProduct(p)}
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

      {/* ---------------- TAB 4: CATEGORIES MANAGEMENT ---------------- */}
      {activeTab === "categories" && (
        <div className="seller-tab-content">
          <div className="seller-controls-bar">
            <div className="seller-search-box">
              <input
                type="text"
                placeholder="Search categories by name or identifier…"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAddCategory}
              style={{ width: "auto" }}
            >
              + Add Category
            </button>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="placeholder-panel">No categories found.</div>
          ) : (
            <div className="admin-categories-grid">
              {filteredCategories.map((c) => {
                const count = products.filter(
                  (p) => p.categoryName === c.name || p.categoryId === c.id
                ).length;

                return (
                  <div key={c.id} className="admin-category-card">
                    <div className="admin-category-header">
                      <div>
                        <h3>{c.name}</h3>
                        <span className="category-slug-badge">{c.id}</span>
                      </div>
                      <span className="quantity-badge">{count} items</span>
                    </div>

                    <p className="admin-category-desc">
                      {c.description || "No category description provided."}
                    </p>

                    <div className="admin-category-footer">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEditCategory(c)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-sm btn-sm"
                        onClick={() => handleDeleteCategory(c)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 5: PROMO CODES MANAGEMENT ---------------- */}
      {activeTab === "promoCodes" && (
        <div className="seller-tab-content">
          <div className="seller-controls-bar">
            <div className="seller-search-box">
              <input
                type="text"
                placeholder="Search promo codes by Code or Description…"
                value={promoSearch}
                onChange={(e) => setPromoSearch(e.target.value)}
              />
            </div>

            <div className="seller-filter-select">
              <select
                value={promoStatusFilter}
                onChange={(e) => setPromoStatusFilter(e.target.value)}
              >
                <option value="all">All Promo Codes</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAddPromo}
              style={{ width: "auto", whiteSpace: "nowrap" }}
            >
              + Create Promo Code
            </button>
          </div>

          {filteredPromoCodes.length === 0 ? (
            <div className="placeholder-panel">
              {promoCodes.length === 0
                ? "No promo codes created yet. Click '+ Create Promo Code' above to launch your first discount campaign!"
                : "No promo codes matched your query."}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>Promo Code</th>
                    <th>Discount Rate</th>
                    <th>Usage &amp; Limits</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPromoCodes.map((p) => {
                    let expiryFormatted = "No Expiry";
                    let isExpired = false;
                    if (p.expiryDate) {
                      const d = p.expiryDate.toDate
                        ? p.expiryDate.toDate()
                        : p.expiryDate.seconds
                        ? new Date(p.expiryDate.seconds * 1000)
                        : new Date(p.expiryDate);
                      if (d && !isNaN(d.getTime())) {
                        expiryFormatted = d.toLocaleDateString();
                        isExpired = d.getTime() < Date.now();
                      }
                    }

                    const isCurrentlyActive = p.isActive !== false && !isExpired;

                    return (
                      <tr key={p.code}>
                        <td>
                          <div>
                            <span className="promo-code-badge">🏷️ {p.code}</span>
                            {p.description && (
                              <div className="table-sku">{p.description}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <strong style={{ fontSize: "0.95rem", color: "var(--ink)" }}>
                            {p.type === "percentage" ? `${p.value}% OFF` : `$${Number(p.value).toFixed(2)} OFF`}
                          </strong>
                          {p.minOrderAmount > 0 && (
                            <div className="table-sku">Min order: ${Number(p.minOrderAmount).toFixed(2)}</div>
                          )}
                          {p.maxDiscount > 0 && (
                            <div className="table-sku">Max cap: ${Number(p.maxDiscount).toFixed(2)}</div>
                          )}
                        </td>
                        <td>
                          <div>
                            <strong>{p.timesUsed || 0}</strong>
                            <span className="table-sku">
                              {p.usageLimit ? ` / ${p.usageLimit} max uses` : " uses (Unlimited)"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div>
                            {expiryFormatted}
                            {isExpired && (
                              <span className="stock-badge badge-out" style={{ marginLeft: "0.4rem", fontSize: "0.68rem" }}>
                                Expired
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`stock-badge ${
                              isCurrentlyActive
                                ? "badge-in"
                                : isExpired
                                ? "badge-out"
                                : "badge-low"
                            }`}
                          >
                            {isCurrentlyActive ? "Active" : isExpired ? "Expired" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="table-action-btns">
                            <button
                              type="button"
                              className={`btn ${
                                p.isActive !== false ? "btn-secondary" : "btn-primary"
                              } btn-sm`}
                              onClick={() => handleTogglePromoStatus(p)}
                              title="Toggle Active / Inactive"
                            >
                              {p.isActive !== false ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenEditPromo(p)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger-sm btn-sm"
                              onClick={() => handleDeletePromo(p)}
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

      {/* ---------------- TAB 6: ORDERS MANAGEMENT ---------------- */}
      {activeTab === "orders" && (
        <div className="seller-tab-content">
          <div className="seller-controls-bar">
            <div className="seller-search-box">
              <input
                type="text"
                placeholder="Search orders by Order ID, Buyer, Seller, or Promo Code…"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
            </div>

            <div className="filter-pill-group">
              <button
                type="button"
                className={`filter-pill ${orderStatusFilter === "all" ? "active" : ""}`}
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
                Pending ({orders.filter((o) => o.status === "pending").length})
              </button>
              <button
                type="button"
                className={`filter-pill ${
                  orderStatusFilter === "processing" ? "active" : ""
                }`}
                onClick={() => setOrderStatusFilter("processing")}
              >
                Processing ({orders.filter((o) => o.status === "processing").length})
              </button>
              <button
                type="button"
                className={`filter-pill ${
                  orderStatusFilter === "shipped" ? "active" : ""
                }`}
                onClick={() => setOrderStatusFilter("shipped")}
              >
                Shipped ({orders.filter((o) => o.status === "shipped").length})
              </button>
              <button
                type="button"
                className={`filter-pill ${
                  orderStatusFilter === "delivered" ? "active" : ""
                }`}
                onClick={() => setOrderStatusFilter("delivered")}
              >
                Delivered ({orders.filter((o) => o.status === "delivered").length})
              </button>
              <button
                type="button"
                className={`filter-pill ${
                  orderStatusFilter === "cancelled" ? "active" : ""
                }`}
                onClick={() => setOrderStatusFilter("cancelled")}
              >
                Cancelled ({orders.filter((o) => o.status === "cancelled").length})
              </button>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="placeholder-panel">No orders matched your search.</div>
          ) : (
            <div className="table-responsive">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Buyer</th>
                    <th>Seller</th>
                    <th>Total &amp; Promo</th>
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
                            <div className="table-sku">{ord.buyer?.email}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{ord.sellerName || "Seller"}</strong>
                            <div className="table-sku">ID: {ord.sellerId?.slice(0, 8)}…</div>
                          </div>
                        </td>
                        <td>
                          <strong>${Number(ord.total || 0).toFixed(2)}</strong>
                          {ord.discount > 0 && (
                            <div className="table-sku" style={{ color: "var(--sage)" }}>
                              🏷️ {ord.promoCode?.code} (-${Number(ord.discount).toFixed(2)})
                            </div>
                          )}
                          <div className="table-sku">
                            {ord.items?.length || 0} item(s)
                          </div>
                        </td>
                        <td>
                          <select
                            value={ord.status || "pending"}
                            onChange={(e) =>
                              handleUpdateOrderStatus(ord.id, e.target.value)
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
                          <div className="table-action-btns">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSelectedOrder(ord)}
                            >
                              Inspect
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger-sm btn-sm"
                              onClick={() => handleDeleteOrder(ord)}
                              title="Delete corrupted / test order"
                            >
                              ✕
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

      {/* ---------------- MODALS ---------------- */}
      <UserEditModal
        isOpen={Boolean(selectedUser)}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onSaveRole={handleUpdateUserRole}
        onSaveStatus={handleUpdateUserStatus}
        isSaving={isProcessing}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        category={editingCategory}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleSaveCategory}
        isSaving={isProcessing}
      />

      <AdminProductModal
        isOpen={Boolean(editingProduct)}
        product={editingProduct}
        categories={categories}
        onClose={() => setEditingProduct(null)}
        onSave={handleSaveProduct}
        isSaving={isProcessing}
      />

      <PromoCodeModal
        isOpen={isPromoModalOpen}
        promo={editingPromo}
        onClose={() => {
          setIsPromoModalOpen(false);
          setEditingPromo(null);
        }}
        onSubmit={handleSavePromo}
        isSaving={isProcessing}
      />

      <AdminOrderModal
        isOpen={Boolean(selectedOrder)}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateOrderStatus}
        isUpdating={updatingOrderId === selectedOrder?.id}
      />

      <AdminConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmButtonText={confirmDialog.confirmButtonText}
        isDanger={confirmDialog.isDanger}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        isProcessing={isProcessing}
      />
    </div>
  );
}
