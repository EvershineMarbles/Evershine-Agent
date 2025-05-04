import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-3xl flex flex-col items-center">
        <div className="mb-8">
        <Image src="/logo.png" alt="Evershine Logo" width={120} height={100} priority/>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-dark mb-12 text-center">Welcome to Evershine</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <Link href="/register-client" className="w-full">
            <Button className="w-full h-24 text-lg font-medium bg-coral hover:bg-coral/90 text-white rounded-lg">
              Register New Client
            </Button>
          </Link>

          <Link href="/client-list" className="w-full">
            <Button className="w-full h-24 text-lg font-medium bg-blue hover:bg-blue/90 text-white rounded-lg">
              All Client List
            </Button>
          </Link>

          <Link href="/register-agent" className="w-full">
            <Button className="w-full h-24 text-lg font-medium bg-coral hover:bg-coral/90 text-white rounded-lg">
              Register New Consultant
            </Button>
          </Link>

          <Link href="/agent-login" className="w-full">
            <Button className="w-full h-24 text-lg font-medium bg-blue hover:bg-blue/90 text-white rounded-lg">
            Consultant Login
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
