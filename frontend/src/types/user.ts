export interface User {
    id: string
    name: string
    email: string
    role: 'admin' | 'user' | 'editor'
    status: 'active' | 'inactive' | 'pending'
    totalOrders: number
    lastLogin: string
  }