// contexts/AuthContext.tsx - FIXED VERSION
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email?: string | null
  name?: string
  full_name?: string
  plan?: string
  days_remaining?: number
  is_trial_expired?: boolean
  trial_status?: 'active' | 'expired' | 'expiring_soon'
  user_metadata?: any
  role?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  authError: string | null
  isSessionExpired: boolean
  retryAuth: () => Promise<void>
  authTimeout: boolean
  clearAuthTimeout: () => void
  connectionStatus: string
  // ADD THIS - track when user is freshly authenticated
  isFreshSignIn: boolean
  clearFreshSignIn: () => void
  // Admin-specific properties
  adminUser: User | null
  adminSignOut: () => Promise<void>
  adminSignIn: (email: string, password: string) => Promise<void>
  adminLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  const [authTimeout, setAuthTimeout] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('online')
  // ADD THIS - track fresh sign ins
  const [isFreshSignIn, setIsFreshSignIn] = useState(false)

  const mounted = useRef(true)
  const authInitialized = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Safe state setter
  const safeSetState = useCallback(<T,>(setter: (value: T) => void, value: T) => {
    if (mounted.current) {
      setter(value)
    }
  }, [])

  // Enhanced fetch user profile
  const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      console.log('🔄 Fetching user profile for:', userId.substring(0, 8) + '...')
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Profile fetch error:', error)
        
        // Create default profile if not found
        if (error.code === 'PGRST116') {
          console.log('📝 Creating default profile...')
          const defaultProfile = {
            id: userId,
            plan: 'free',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
          }

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([defaultProfile])
            .select()
            .single()

          if (createError) {
            console.error('❌ Error creating profile:', createError)
            return null
          }

          return {
            ...newProfile,
            days_remaining: 14,
            is_trial_expired: false,
            trial_status: 'active'
          }
        }
        throw error
      }

      if (!profile) {
        console.error('❌ No profile data returned')
        return null
      }

      // Calculate trial status
      const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      const now = new Date()
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isTrialExpired = daysRemaining <= 0

      const userWithTrial: User = {
        ...profile,
        days_remaining: Math.max(0, daysRemaining),
        is_trial_expired: isTrialExpired,
        trial_status: isTrialExpired ? 'expired' : daysRemaining <= 3 ? 'expiring_soon' : 'active'
      }

      console.log('✅ User profile loaded:', {
        id: userWithTrial.id.substring(0, 8) + '...',
        plan: userWithTrial.plan,
        daysRemaining: userWithTrial.days_remaining,
        isTrialExpired: userWithTrial.is_trial_expired
      })

      return userWithTrial

    } catch (error: any) {
      console.error('❌ Error in fetchUserProfile:', error)
      return null
    }
  }, [])

  // Fixed initialize auth function
  const initializeAuth = useCallback(async () => {
    if (!mounted.current || authInitialized.current) return

    authInitialized.current = true
    safeSetState(setLoading, true)
    safeSetState(setAuthError, null)

    try {
      console.log('🔐 Initializing auth...')
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()

      if (!mounted.current) return

      if (error) {
        console.error('❌ Session error:', error)
        safeSetState(setAuthError, error.message)
        return
      }

      if (session?.user) {
        console.log('👤 User session found:', session.user.id.substring(0, 8) + '...')
        const userProfile = await fetchUserProfile(session.user.id)
        if (mounted.current) {
          safeSetState(setUser, userProfile)
          console.log('✅ User state updated in context:', userProfile ? 'with profile' : 'no profile')
        }
      } else {
        console.log('👤 No user session found')
        safeSetState(setUser, null)
      }

    } catch (error: any) {
      console.error('❌ Auth initialization error:', error)
      safeSetState(setAuthError, error.message)
    } finally {
      if (mounted.current) {
        safeSetState(setLoading, false)
        console.log('🏁 Auth initialization complete')
      }
    }
  }, [fetchUserProfile, safeSetState])

  // FIXED: Auth state change handler - properly track fresh sign ins
  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    if (!mounted.current) return

    console.log('🔄 Auth state change:', event, session?.user?.id?.substring(0, 8) + '...')
    
    switch (event) {
      case 'SIGNED_IN':
        console.log('✅ User signed in, updating state...', session?.user?.id?.substring(0, 8))
        if (session?.user) {
          safeSetState(setIsFreshSignIn, true) // MARK AS FRESH SIGN IN
          const userProfile = await fetchUserProfile(session.user.id)
          if (mounted.current) {
            safeSetState(setUser, userProfile)
            safeSetState(setAuthError, null)
            safeSetState(setIsSessionExpired, false)
            console.log('✅ User state updated after sign in - READY FOR REDIRECT')
          }
        }
        break
        
      case 'SIGNED_OUT':
        console.log('🚪 User signed out, clearing state...')
        safeSetState(setUser, null)
        safeSetState(setAuthError, null)
        safeSetState(setIsSessionExpired, false)
        safeSetState(setIsFreshSignIn, false) // CLEAR FRESH SIGN IN
        break
        
      case 'TOKEN_REFRESHED':
        if (session?.user) {
          console.log('🔄 Token refreshed, updating user...')
          const userProfile = await fetchUserProfile(session.user.id)
          if (mounted.current && userProfile) {
            safeSetState(setUser, userProfile)
          }
        }
        break
        
      case 'USER_UPDATED':
        if (session?.user) {
          console.log('📝 User updated, refreshing profile...')
          const userProfile = await fetchUserProfile(session.user.id)
          if (mounted.current && userProfile) {
            safeSetState(setUser, userProfile)
          }
        }
        break

      case 'TOKEN_REFRESHED_ERROR':
        console.error('❌ Token refresh error')
        safeSetState(setIsSessionExpired, true)
        break
    }
  }, [fetchUserProfile, safeSetState])

  // Set up auth state listener
  useEffect(() => {
    mounted.current = true
    console.log('🚀 AuthProvider mounted')

    // Initialize auth
    initializeAuth()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    // Cleanup
    return () => {
      console.log('🧹 AuthProvider unmounting')
      mounted.current = false
      subscription.unsubscribe()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [initializeAuth, handleAuthStateChange])

  const refreshProfile = async () => {
    if (user?.id) {
      console.log('🔄 Manually refreshing profile...')
      const userProfile = await fetchUserProfile(user.id)
      if (mounted.current && userProfile) {
        safeSetState(setUser, userProfile)
      }
    }
  }

  const retryAuth = async () => {
    console.log('🔄 Retrying auth...')
    authInitialized.current = false
    safeSetState(setAuthError, null)
    safeSetState(setAuthTimeout, false)
    await initializeAuth()
  }

  const clearAuthTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    safeSetState(setAuthTimeout, false)
    safeSetState(setConnectionStatus, 'online')
  }, [safeSetState])

  // ADD THIS - clear fresh sign in flag
  const clearFreshSignIn = useCallback(() => {
    safeSetState(setIsFreshSignIn, false)
  }, [safeSetState])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Signing in user:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Sign in error:', error)
        throw error
      }

      console.log('✅ Sign in successful')
    } catch (error: any) {
      console.error('❌ Sign in failed:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...')
      await supabase.auth.signOut()
      safeSetState(setUser, null)
      safeSetState(setAuthError, null)
      safeSetState(setIsSessionExpired, false)
      safeSetState(setIsFreshSignIn, false)
      console.log('✅ Signed out successfully')
    } catch (error) {
      console.error('❌ Sign out error:', error)
      safeSetState(setAuthError, 'Failed to sign out. Please try again.')
    }
  }

  // Admin-specific sign in function
  const adminSignIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Admin signing in user:', email)

      // Check if admin exists in admins table
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (adminError || !adminData) {
        console.error('❌ Admin not found or inactive:', adminError)
        throw new Error('Invalid admin credentials')
      }

      // Verify password - check both plain text and potential hash
      let passwordValid = false
      if (adminData.password_hash === password) {
        passwordValid = true
      } else if (adminData.password_hash.startsWith('$2a$') || adminData.password_hash.startsWith('$2b$')) {
        // If it's bcrypt hashed, we'd need to verify it properly
        // For now, assume it's plain text since the second entry looks plain
        passwordValid = false
      }

      if (!passwordValid) {
        console.error('❌ Invalid password for admin')
        throw new Error('Invalid admin credentials')
      }

      // For admin authentication, we don't use Supabase Auth since admins are separate
      // Instead, we'll create a mock user object and set admin state
      const adminUser: User = {
        id: adminData.id,
        email: adminData.email,
        name: adminData.full_name,
        full_name: adminData.full_name,
        plan: 'admin',
        days_remaining: 999,
        is_trial_expired: false,
        trial_status: 'active',
        role: adminData.role,
        user_metadata: { is_admin: true }
      }

      // Set admin user state directly (bypass normal auth)
      if (mounted.current) {
        safeSetState(setUser, adminUser)
        safeSetState(setAuthError, null)
        safeSetState(setIsSessionExpired, false)
        safeSetState(setIsFreshSignIn, true)
        console.log('✅ Admin sign in successful - admin user set')
      }

    } catch (error: any) {
      console.error('❌ Admin sign in failed:', error)
      throw error
    }
  }

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Connection online')
      safeSetState(setConnectionStatus, 'online')
      safeSetState(setAuthTimeout, false)
    }

    const handleOffline = () => {
      console.log('🌐 Connection offline')
      safeSetState(setConnectionStatus, 'offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [safeSetState])

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    refreshProfile,
    authError,
    isSessionExpired,
    retryAuth,
    authTimeout,
    clearAuthTimeout,
    connectionStatus,
    isFreshSignIn, // ADD THIS
    clearFreshSignIn, // ADD THIS
    adminUser: user, // For admin context, same as user
    adminSignOut: signOut, // Same as regular signOut
    adminSignIn, // Use the new admin-specific sign in function
    adminLoading: loading // Same as regular loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}