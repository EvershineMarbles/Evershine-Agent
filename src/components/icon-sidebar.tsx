import type React from "react"
import Link from "next/link"

interface IconSidebarProps {
  clientId: string
}

export const IconSidebar: React.FC<IconSidebarProps> = ({ clientId }) => {
  return (
    <div className="w-64 bg-gray-100 p-4">
      <h2 className="text-lg font-semibold mb-4">Client: {clientId}</h2>
      <nav>
        <ul>
          <li className="mb-2">
            <Link href={`/client-dashboard/${clientId}/products`} className="block hover:bg-gray-200 p-2 rounded">
              Products
            </Link>
          </li>
          <li className="mb-2">
            <Link href={`/client-dashboard/${clientId}/scan`} className="block hover:bg-gray-200 p-2 rounded">
              Scan QR
            </Link>
          </li>
          <li className="mb-2">
            <Link href={`/client-dashboard/${clientId}/wishlist`} className="block hover:bg-gray-200 p-2 rounded">
              Wishlist
            </Link>
          </li>
          <li className="mb-2">
            <Link href={`/client-dashboard/${clientId}/cart`} className="block hover:bg-gray-200 p-2 rounded">
              Cart
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}

