import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authstore'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Package, 
  Settings, 
  BarChart3,
  LogOut,
  Shield,
  ChevronDown,
  Image,
  Palette,
  Tag,
  ShoppingCart,
  CreditCard,
  Percent,
  RotateCcw,
  Truck
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const AdminLayout = () => {
  const { authUser, logout, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [shiprocketToken] = useState(localStorage.getItem('shiprocket_token') || '')

  // Protect admin routes - redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading) {
      if (!authUser) {
        // User not logged in, redirect to home
        navigate('/', { replace: true })
      } else if (authUser.role !== 'Admin' && authUser.data?.role !== 'Admin') {
        // User is not an admin, redirect to home
        navigate('/', { replace: true })
      }
    }
  }, [authUser, isLoading, navigate])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <svg
          className="animate-spin h-8 w-8 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
      </div>
    )
  }

  // Redirect if not authenticated or not admin
  if (!authUser || (authUser.role !== 'Admin' && authUser.data?.role !== 'Admin')) {
    return <Navigate to="/" replace />
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home, current: location.pathname === '/admin' },
    { name: 'Users', href: '/admin/users', icon: Users, current: location.pathname === '/admin/users' },
    { name: 'Products', href: '/admin/products', icon: Package, current: location.pathname === '/admin/products' },
    { name: 'Sales', href: '/admin/sales', icon: Percent, current: location.pathname === '/admin/sales' },
    { name: 'Banners', href: '/admin/banners', icon: Image, current: location.pathname === '/admin/banners' },
    { name: 'Colors', href: '/admin/colors', icon: Palette, current: location.pathname === '/admin/colors' },
    { name: 'Categories', href: '/admin/categories', icon: Tag, current: location.pathname === '/admin/categories' },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, current: location.pathname === '/admin/orders' },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard, current: location.pathname === '/admin/payments' },
    { name: 'Refunds', href: '/admin/refunds', icon: RotateCcw, current: location.pathname === '/admin/refunds' },
    { 
      name: 'Shiprocket', 
      href: shiprocketToken ? '/admin/shiprocket/dashboard' : '/admin/shiprocket', 
      icon: Truck, 
      current: location.pathname === '/admin/shiprocket' || location.pathname === '/admin/shiprocket/dashboard' 
    },
  ]

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-64 bg-card border-r"
            >
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center justify-between px-4 border-b">
                  <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex-1 space-y-1 px-2 py-4">
                  {navigation.map((item) => (
                    <motion.button
                      key={item.name}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        navigate(item.href)
                        setSidebarOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        item.current
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </motion.button>
                  ))}
                </nav>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center border-b">
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(item.href)}
                        className={`w-full flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-lg transition-colors ${
                          item.current
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </motion.button>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Badge variant="outline" className="hidden sm:flex items-center gap-1">
               
                Admin
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={authUser?.profile} alt={authUser?.firstname} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {authUser?.firstname ? getInitials(authUser.firstname + ' ' + authUser.lastname) : 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{authUser?.firstname} {authUser?.lastname}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {authUser?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/')}>
                    <Home className="mr-2 h-4 w-4" />
                    <span>Back to Home</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
