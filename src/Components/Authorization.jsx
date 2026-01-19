import { Navigate } from "react-router"

const ProtectedRoute = ({ role, children }) => {
  const userRole = localStorage.getItem("role")

  if (userRole !== role) {
    return <Navigate to="/login" />
  }

  return children
}

export default ProtectedRoute