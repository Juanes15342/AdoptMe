'use client'

import { useRouter } from 'next/navigation'
import RegisterPage from '../login/registro'

export default function RegistroPage() {
  const router = useRouter()

  return (
    <RegisterPage onBack={() => router.push('/')} />
  )
}
