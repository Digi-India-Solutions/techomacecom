/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { AdminPermission } from '@/types/admin';
import { ToastProvider } from '@/components/admin/ToastProvider';
import { AuthProvider, useAuth } from '@/components/admin/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { LoginPage } from '@/pages/admin/LoginPage';
import { ResetPasswordPage } from '@/pages/admin/ResetPasswordPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { ProductsPage } from '@/pages/admin/ProductsPage';
import { ProductFormPage } from '@/pages/admin/ProductFormPage';
import { CategoriesPage } from '@/pages/admin/CategoriesPage';
import { BrandsPage } from '@/pages/admin/BrandsPage';
import { BulkImportPage } from '@/pages/admin/BulkImportPage';
import { InventoryStockPage } from '@/pages/admin/InventoryStockPage';
import { RentalUnitsPage } from '@/pages/admin/RentalUnitsPage';
import { RentalUnitDetailPage } from '@/pages/admin/RentalUnitDetailPage';
import { OrdersPage } from '@/pages/admin/OrdersPage';
import { OrderDetailPage } from '@/pages/admin/OrderDetailPage';
import { ReturnsPage } from '@/pages/admin/ReturnsPage';
import { RentalsPage } from '@/pages/admin/RentalsPage';
import { RentalDetailPage } from '@/pages/admin/RentalDetailPage';
import { EnquiriesPage } from '@/pages/admin/EnquiriesPage';
import { ReviewsPage } from '@/pages/admin/ReviewsPage';
import { CustomersPage } from '@/pages/admin/CustomersPage';
import { CustomerDetailPage } from '@/pages/admin/CustomerDetailPage';
import { HeroBannersPage } from '@/pages/admin/HeroBannersPage';
import { PageBannersPage } from '@/pages/admin/PageBannersPage';
import { HomepageSectionsPage } from '@/pages/admin/HomepageSectionsPage';
import { CouponsPage } from '@/pages/admin/CouponsPage';
import { DealsPage } from '@/pages/admin/DealsPage';
import { CmsPagesPage } from '@/pages/admin/CmsPagesPage';
import { FaqsPage } from '@/pages/admin/FaqsPage';
import { BlogPage } from '@/pages/admin/BlogPage';
import { SettingsPage } from '@/pages/admin/SettingsPage';
import { StaffRolesPage } from '@/pages/admin/StaffRolesPage';
import { ActivityLogPage } from '@/pages/admin/ActivityLogPage';

function PermissionGate({
  permission,
  children,
}: {
  permission: AdminPermission | string;
  children: React.ReactNode;
}) {
  const { can } = useAuth();
  if (!can(permission)) {
    return (
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-8 max-w-lg">
        <h2 className="text-lg font-semibold text-[#12263F]">Permission Restricted</h2>
        <p className="mt-1.5 text-sm text-[#5B6B82]">
          Your role does not include access to this section. Ask a Super Admin to update your role under Staff &amp; Roles.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin/reset-password" element={<ResetPasswordPage />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route
                index
                element={
                  <PermissionGate permission="dashboard.view">
                    <DashboardPage />
                  </PermissionGate>
                }
              />

              {/* Catalog */}
              <Route
                path="products"
                element={
                  <PermissionGate permission="products.view">
                    <ProductsPage />
                  </PermissionGate>
                }
              />
              <Route
                path="products/new"
                element={
                  <PermissionGate permission="products.create">
                    <ProductFormPage />
                  </PermissionGate>
                }
              />
              <Route
                path="products/:id"
                element={
                  <PermissionGate permission="products.edit">
                    <ProductFormPage />
                  </PermissionGate>
                }
              />
              <Route
                path="categories"
                element={
                  <PermissionGate permission="categories.manage">
                    <CategoriesPage />
                  </PermissionGate>
                }
              />
              <Route
                path="brands"
                element={
                  <PermissionGate permission="brands.manage">
                    <BrandsPage />
                  </PermissionGate>
                }
              />
              <Route
                path="bulk-import"
                element={
                  <PermissionGate permission="bulk_import.run">
                    <BulkImportPage />
                  </PermissionGate>
                }
              />

              {/* Inventory */}
              <Route
                path="inventory"
                element={
                  <PermissionGate permission="inventory.view">
                    <InventoryStockPage />
                  </PermissionGate>
                }
              />
              <Route
                path="rental-units"
                element={
                  <PermissionGate permission="rental_units.view">
                    <RentalUnitsPage />
                  </PermissionGate>
                }
              />
              <Route
                path="rental-units/:id"
                element={
                  <PermissionGate permission="rental_units.view">
                    <RentalUnitDetailPage />
                  </PermissionGate>
                }
              />

              {/* Sales */}
              <Route
                path="orders"
                element={
                  <PermissionGate permission="orders.view">
                    <OrdersPage />
                  </PermissionGate>
                }
              />
              <Route
                path="orders/:id"
                element={
                  <PermissionGate permission="orders.view">
                    <OrderDetailPage />
                  </PermissionGate>
                }
              />
              <Route
                path="returns"
                element={
                  <PermissionGate permission="returns.view">
                    <ReturnsPage />
                  </PermissionGate>
                }
              />

              {/* Operations */}
              <Route
                path="rentals"
                element={
                  <PermissionGate permission="rentals.view">
                    <RentalsPage />
                  </PermissionGate>
                }
              />
              <Route
                path="rentals/:id"
                element={
                  <PermissionGate permission="rentals.view">
                    <RentalDetailPage />
                  </PermissionGate>
                }
              />
              <Route
                path="enquiries"
                element={
                  <PermissionGate permission="enquiries.view">
                    <EnquiriesPage />
                  </PermissionGate>
                }
              />
              <Route
                path="reviews"
                element={
                  <PermissionGate permission="reviews.view">
                    <ReviewsPage />
                  </PermissionGate>
                }
              />
              <Route
                path="customers"
                element={
                  <PermissionGate permission="customers.view">
                    <CustomersPage />
                  </PermissionGate>
                }
              />
              <Route
                path="customers/:id"
                element={
                  <PermissionGate permission="customers.view">
                    <CustomerDetailPage />
                  </PermissionGate>
                }
              />

              {/* Marketing */}
              <Route
                path="banners/hero"
                element={
                  <PermissionGate permission="marketing.manage">
                    <HeroBannersPage />
                  </PermissionGate>
                }
              />
              <Route
                path="banners/pages"
                element={
                  <PermissionGate permission="marketing.manage">
                    <PageBannersPage />
                  </PermissionGate>
                }
              />
              <Route
                path="homepage"
                element={
                  <PermissionGate permission="marketing.manage">
                    <HomepageSectionsPage />
                  </PermissionGate>
                }
              />
              <Route
                path="coupons"
                element={
                  <PermissionGate permission="marketing.manage">
                    <CouponsPage />
                  </PermissionGate>
                }
              />
              <Route
                path="deals"
                element={
                  <PermissionGate permission="marketing.manage">
                    <DealsPage />
                  </PermissionGate>
                }
              />

              {/* Redirects from Part 1 placeholder marketing URLs */}
              <Route path="marketing/hero-banners" element={<Navigate to="/admin/banners/hero" replace />} />
              <Route path="marketing/page-banners" element={<Navigate to="/admin/banners/pages" replace />} />
              <Route path="marketing/homepage-sections" element={<Navigate to="/admin/homepage" replace />} />
              <Route path="marketing/coupons" element={<Navigate to="/admin/coupons" replace />} />
              <Route path="marketing/deal-of-the-day" element={<Navigate to="/admin/deals" replace />} />

              {/* Content */}
              <Route
                path="pages"
                element={
                  <PermissionGate permission="content.manage">
                    <CmsPagesPage />
                  </PermissionGate>
                }
              />
              <Route
                path="faqs"
                element={
                  <PermissionGate permission="content.manage">
                    <FaqsPage />
                  </PermissionGate>
                }
              />
              <Route
                path="blog"
                element={
                  <PermissionGate permission="content.manage">
                    <BlogPage />
                  </PermissionGate>
                }
              />

              {/* Redirects from Part 1 placeholder content URLs */}
              <Route path="content/pages" element={<Navigate to="/admin/pages" replace />} />
              <Route path="content/faqs" element={<Navigate to="/admin/faqs" replace />} />
              <Route path="content/blog" element={<Navigate to="/admin/blog" replace />} />

              {/* System */}
              <Route
                path="settings"
                element={
                  <PermissionGate permission="settings.manage">
                    <SettingsPage />
                  </PermissionGate>
                }
              />
              <Route
                path="staff"
                element={
                  <PermissionGate permission="staff.manage">
                    <StaffRolesPage />
                  </PermissionGate>
                }
              />
              <Route
                path="activity"
                element={
                  <PermissionGate permission="activity_log.view">
                    <ActivityLogPage />
                  </PermissionGate>
                }
              />
              <Route path="activity-log" element={<Navigate to="/admin/activity" replace />} />

              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
