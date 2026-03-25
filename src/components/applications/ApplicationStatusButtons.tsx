'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateApplicationStatus } from '@/actions/application-actions'
import { ApplicationStatus } from '@/types'

interface Props {
  applicationId: string
  currentStatus: ApplicationStatus
}

export function ApplicationStatusButtons({ applicationId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStatus(status: ApplicationStatus) {
    setLoading(true)
    await updateApplicationStatus(applicationId, status)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="space-y-2">
      {currentStatus === 'submitted' && (
        <button onClick={() => handleStatus('reviewing')} disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md">
          審査を開始
        </button>
      )}
      {(currentStatus === 'submitted' || currentStatus === 'reviewing') && (
        <button onClick={() => handleStatus('approved')} disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md">
          承認する
        </button>
      )}
      {currentStatus !== 'converted' && currentStatus !== 'rejected' && (
        <button onClick={() => handleStatus('rejected')} disabled={loading}
          className="w-full bg-white border border-red-300 hover:bg-red-50 text-red-600 text-sm font-medium py-2 rounded-md">
          却下する
        </button>
      )}
    </div>
  )
}
