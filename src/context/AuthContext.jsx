import { createContext, useState } from 'react'
import { jwtDecode } from 'jwt-decode'

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null)

function getInitialUser() {
  try {
    const token = localStorage.getItem('token')
    if (!token) return { user: null, loading: false }
    const decoded = jwtDecode(token)
    if (decoded.exp * 1000 > Date.now()) return { user: decoded, loading: false }
    localStorage.removeItem('token')
  } catch {
    localStorage.removeItem('token')
  }
  return { user: null, loading: false }
}

const initial = getInitialUser()

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(initial.user)
  const [loading]             = useState(initial.loading)

  const login = (token) => {
    localStorage.setItem('token', token)
    setUser(jwtDecode(token))
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}